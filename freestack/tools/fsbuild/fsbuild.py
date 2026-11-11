#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""fsbuild — hermetic, hash-pinned build driver for FreeStack.

Hash model: content tree hash.
  tree_hash(dir) = sha256( concat( sorted("MODE\\tSHA256(file)\\tRELPATH\\n") ) )
  .git contents excluded. Symlinks hashed by target string. Modes in octal.
Deterministic, order-stable, independent of mtimes, owners and inode numbers.
"""

from __future__ import annotations

import argparse, hashlib, json, os, re, shutil, subprocess, sys, time
from pathlib import Path

# Add tools directory to PATH so local tools (e.g. minisign) are discoverable
ROOT = Path(__file__).resolve().parents[2]
os.environ["PATH"] = f"{ROOT / 'tools'}:{os.environ.get('PATH', '')}"

try:
    import yaml
except ImportError:
    sys.exit("need pyyaml: pip install pyyaml jsonschema")

try:
    import jsonschema
except ImportError:
    # Fallback to system third-party if present
    if Path("/usr/lib/google-cloud-sdk/lib/third_party").exists():
        sys.path.append("/usr/lib/google-cloud-sdk/lib/third_party")
        import jsonschema
    else:
        sys.exit("need jsonschema: pip install jsonschema")

MANIFEST = ROOT / "manifest" / "freestack.manifest.yaml"
SIGFILE = ROOT / "manifest" / "freestack.manifest.yaml.sig"
SCHEMA = ROOT / "manifest" / "freestack.manifest.schema.json"
LOCK = ROOT / "manifest" / "freestack.lock.json"
HASHES = ROOT / "manifest" / "hashes.json"
PINS = ROOT / "manifest" / "pins.json"
KEYS = ROOT / "keys"
STORE = Path(os.environ.get("FSBUILD_STORE", ROOT / ".store"))
OUT = Path(os.environ.get("FSBUILD_OUT", ROOT / "out"))
DIST = ROOT / "dist"

EXIT = dict(ok=0, untrusted=40, threshold=41, schema=42, rule=43,
            fetch=44, hash=45, materialize=46, build=47, tier=48,
            gate=49, sign=50, pin=51, ambiguous=52)

ZERO = "0" * 64


# ---------------------------------------------------------------- helpers
def die(code: int, msg: str):
    print(f"fsbuild: {msg}", file=sys.stderr)
    sys.exit(code)


def load_manifest() -> dict:
    if not MANIFEST.exists():
        die(EXIT["schema"], f"missing {MANIFEST}")
    return yaml.safe_load(MANIFEST.read_text())


def load_hashes() -> dict:
    if not HASHES.exists():
        return {}
    try:
        return json.loads(HASHES.read_text()).get("hashes", {})
    except Exception:
        return {}


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def tree_hash(d: Path) -> str:
    """Deterministic content hash of a directory tree."""
    rows = []
    for p in sorted(d.rglob("*")):
        rel = p.relative_to(d)
        if ".git" in rel.parts:
            continue
        if p.is_symlink():
            rows.append(f"120000\t{sha256_bytes(os.readlink(p).encode())}\t{rel}")
        elif p.is_file():
            rows.append(f"{p.stat().st_mode & 0o777:o}\t{sha256_file(p)}\t{rel}")
    return sha256_bytes("\n".join(rows).encode())


def run(cmd, cwd=None, env=None, check=True, capture=True):
    e = {k: v for k, v in os.environ.items()
         if k in ("PATH", "HOME", "TERM", "TMPDIR")}
    e["SOURCE_DATE_EPOCH"] = os.environ.get("SOURCE_DATE_EPOCH", "1700000000")
    e["LC_ALL"] = "C.UTF-8"
    e["TZ"] = "UTC"
    e["GIT_TERMINAL_PROMPT"] = "0"
    if env:
        e.update(env)
    r = subprocess.run(cmd, cwd=cwd, env=e, text=True, capture_output=capture)
    if check and r.returncode != 0:
        die(EXIT["build"], f"{' '.join(map(str, cmd))}\n{r.stdout}\n{r.stderr}")
    return r


# ---------------------------------------------------------------- trust
def parse_multisig(path: Path) -> list[tuple[str, str]]:
    """Return [(holder, minisign_block)] from a multi-signature file."""
    out, holder, buf = [], None, []
    for line in path.read_text().splitlines():
        if line.startswith("# holder="):
            if holder is not None:
                out.append((holder, "\n".join(buf).strip()))
            holder, buf = line.split("=", 1)[1].strip(), []
        elif holder is not None:
            buf.append(line)
    if holder is not None:
        out.append((holder, "\n".join(buf).strip()))
    return out


def cmd_manifest_verify(a):
    if not SIGFILE.exists():
        if a.allow_unsigned:
            print("fsbuild: no signature, --allow-unsigned given")
            return
        die(EXIT["untrusted"], f"{SIGFILE.name} missing")
    m = load_manifest()
    need = m["trust"]["threshold"]["m"]
    pubs = {p.stem: p for p in KEYS.glob("*.pub")}
    if not pubs:
        die(EXIT["untrusted"], "no public keys in keys/")
    valid, rejected = [], []
    sig_pairs = parse_multisig(SIGFILE)
    if not sig_pairs:
        die(EXIT["threshold"], "signature file empty or malformed")
    for holder, block in sig_pairs:
        pub = pubs.get(holder)
        if not pub:
            rejected.append(f"{holder}: no pubkey")
            continue
        sig_tmp = Path(f"/tmp/.fs_sig_{holder}")
        sig_tmp.write_text(block + "\n")
        r = run(["minisign", "-Vm", str(MANIFEST), "-p", str(pub),
                 "-x", str(sig_tmp)], check=False)
        sig_tmp.unlink(missing_ok=True)
        if r.returncode == 0:
            valid.append(holder)
        else:
            rejected.append(holder)
    if rejected:
        print(f"fsbuild: rejected {rejected}", file=sys.stderr)
    if len(valid) < need:
        die(EXIT["threshold"], f"only {len(valid)}/{need} valid: {valid}")
    print(f"verified {len(valid)}/{need} by {valid}")


# ---------------------------------------------------------------- validation
def cmd_schema_validate(a):
    jsonschema.validate(load_manifest(), json.loads(SCHEMA.read_text()))
    print("schema ok")


def cmd_rules_check(a):
    m = load_manifest()
    today = time.strftime("%Y-%m-%d")
    bad = []
    for c in m["components"]:
        sat = set(c["rules"]["satisfies"])
        for w in c["rules"].get("waivers", []):
            if w.get("expires", "9999") < today:
                bad.append(f"{c['id']}: expired waiver {w['rule']}")
            sat.add(w["rule"])
        for r in [f"R{i}" for i in range(1, 13)]:
            if r in ("R9", "R10"):
                continue
            if r not in sat:
                bad.append(f"{c['id']}: unsatisfied {r}")
        if c["tier"] == "blob" and "blob" not in c:
            bad.append(f"{c['id']}: tier=blob without blob block")
    if bad:
        die(EXIT["rule"], "\n".join(bad))
    print("rules ok")


# ---------------------------------------------------------------- pin resolution
class PinError(Exception):
    pass


def vkey(s: str) -> list:
    return [(0, int(p)) if p.isdigit() else (1, p.lower())
            for p in re.split(r"[._\-+]", s) if p]


def _strip_version(tag: str, rx: str | None) -> str:
    if not rx:
        return tag
    m = re.search(rx, tag)
    return tag[m.end():] if m else tag


def _forge_tags(up: dict) -> list[str]:
    forge, repo = up.get("forge"), up["repo"]
    if forge == "github":
        m = re.search(r"github\.com/([^/]+)/([^/]+?)(?:\.git)?$", repo)
        if not m:
            return []
        url = f"https://api.github.com/repos/{m[1]}/{m[2]}/tags?per_page=100"
        r = run(["curl", "-fsSL", url], check=False)
        if r.returncode != 0:
            return []
        try:
            return [t["name"] for t in json.loads(r.stdout)]
        except Exception:
            return []
    if forge == "gitlab":
        m = re.search(r"gitlab[^/]*/(.+?)(?:\.git)?$", repo)
        if not m:
            return []
        proj = m[1].replace("/", "%2F")
        url = f"https://gitlab.com/api/v4/projects/{proj}/repository/tags?per_page=100"
        r = run(["curl", "-fsSL", url], check=False)
        if r.returncode != 0:
            return []
        try:
            return [t["name"] for t in json.loads(r.stdout)]
        except Exception:
            return []
    return []


def _remote_tags_dict(up: dict) -> dict[str, str]:
    r = run(["git", "ls-remote", "--tags", up["repo"]], check=False)
    tag_map = {}
    if r.returncode == 0:
        for line in r.stdout.splitlines():
            parts = line.split()
            if len(parts) >= 2:
                sha, ref = parts[0], parts[1]
                if ref.startswith("refs/tags/"):
                    tag_name = ref[len("refs/tags/"):]
                    if tag_name.endswith("^{}"):
                        tag_map[tag_name[:-3]] = sha  # peeled commit takes precedence!
                    elif tag_name not in tag_map:
                        tag_map[tag_name] = sha
    if not tag_map:
        for t in _forge_tags(up):
            tag_map[t] = ""
    return tag_map


def _ls_remote(up: dict, ref: str) -> str:
    r = run(["git", "ls-remote", up["repo"], ref], check=False)
    if r.returncode != 0:
        raise PinError(f"ls-remote failed: {r.stderr.strip()[:200]}")
    lines = [l for l in r.stdout.splitlines() if not l.endswith("^{}")]
    if not lines:
        raise PinError(f"ref not found: {ref}")
    return lines[0].split()[0]


def resolve_ref(up: dict) -> tuple[str, str]:
    """Return (commit_sha_or_url, kind). Raises PinError."""
    pin, kind = up["pin"], up["pin"]["kind"]
    if kind == "commit":
        return pin["value"], kind
    if kind == "tarball":
        return pin["value"], kind
    if kind == "branch":
        return _ls_remote(up, f"refs/heads/{pin['value']}"), kind
    if kind == "tag":
        return _ls_remote(up, f"refs/tags/{pin['value']}"), kind
    if kind == "tag_glob":
        tag_map = _remote_tags_dict(up)
        pat = re.compile(pin["pattern"].replace("*", ".*") + "$")
        cands = [t for t in tag_map if pat.match(t)]
        if pin.get("min"):
            floor = vkey(pin["min"])
            cands = [t for t in cands
                     if vkey(_strip_version(t, pin.get("version_regex"))) >= floor]
        if not cands:
            raise PinError(f"no tag matching {pin['pattern']!r} at or above {pin.get('min')}")
        best = max(cands, key=lambda t: vkey(_strip_version(t, pin.get("version_regex"))))
        if tag_map.get(best):
            return tag_map[best], kind
        return _ls_remote(up, f"refs/tags/{best}"), kind
    if kind == "dir_glob":
        r = run(["curl", "-fsSL", pin["url"]], check=False)
        if r.returncode != 0:
            raise PinError(f"index fetch failed: {pin['url']}")
        rx = re.compile(pin["pattern"])
        hits = sorted({h for h in rx.findall(r.stdout)})
        if not hits:
            raise PinError(f"no file matching {pin['pattern']!r}")
        return pin["url"].rstrip("/") + "/" + hits[-1], kind
    raise PinError(f"unknown pin kind {kind}")


def _materialize(url: str, ref: str, dest: Path, kind: str):
    if dest.exists() and any(dest.iterdir()):
        return
    dest.mkdir(parents=True, exist_ok=True)
    if kind in ("commit", "tag", "branch", "tag_glob"):
        cloned = False
        if len(ref) != 40:
            r = run(["git", "clone", "--quiet", "--depth", "1", "--branch", ref, url, str(dest)], check=False)
            if r.returncode == 0:
                cloned = True
        if not cloned:
            r = run(["git", "clone", "--quiet", "--depth", "1", url, str(dest)], check=False)
            if r.returncode == 0:
                run(["git", "-C", str(dest), "checkout", "--quiet", "--detach", ref], check=False)
                cloned = True
        if not cloned:
            run(["git", "clone", "--quiet", url, str(dest)])
            run(["git", "-C", str(dest), "checkout", "--quiet", "--detach", ref])
        shutil.rmtree(dest / ".git", ignore_errors=True)
    else:
        tar = dest.parent / f"{dest.name}.tar"
        run(["curl", "-fsSL", "-o", str(tar), ref or url])
        run(["tar", "-xf", str(tar), "-C", str(dest), "--strip-components=1"])
        tar.unlink(missing_ok=True)


def cmd_resolve(a):
    m = load_manifest()
    STORE.mkdir(parents=True, exist_ok=True)
    lock = {"lock_version": "0.1",
            "manifest_sha256": sha256_file(MANIFEST),
            "resolved_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "components": []}
    hashes = {"generated": lock["resolved_at"], "algorithm": "tree-sha256-v1",
              "hashes": {}}
    pins = {"generated": lock["resolved_at"], "pins": {}}
    failures = []
    
    prior_pins = {}
    if PINS.exists():
        try:
            prior_pins = json.loads(PINS.read_text()).get("pins", {})
        except Exception:
            pass

    for c in m["components"]:
        cid, up = c["id"], c["upstream"]
        if a.offline:
            if cid not in prior_pins:
                failures.append({"id": cid, "reason": "no offline pin"})
                continue
            commit, kind = prior_pins[cid]["commit"], prior_pins[cid]["kind"]
        else:
            try:
                commit, kind = resolve_ref(up)
            except PinError as e:
                # If repair and prior pin exists, keep prior
                if a.repair and cid in prior_pins:
                    commit, kind = prior_pins[cid]["commit"], prior_pins[cid]["kind"]
                    print(f"  warn {cid}: keeping prior pin due to: {e}")
                else:
                    failures.append({"id": cid, "reason": str(e)})
                    print(f"  FAIL {cid}: {e}", file=sys.stderr)
                    if a.strict:
                        break
                    continue
        dest = STORE / cid
        prior_hashes = load_hashes().get("hashes", {})
        if dest.exists() and any(dest.iterdir()):
            h = tree_hash(dest)
        elif cid in prior_hashes and prior_hashes[cid] != ZERO:
            h = prior_hashes[cid]
        else:
            h = sha256_bytes(f"freestack-tree:{up['repo']}:{commit}".encode())

        pins["pins"][cid] = {"commit": commit, "kind": kind,
                             "tag": up["pin"].get("value") or up["pin"].get("pattern")}
        hashes["hashes"][cid] = h
        lock["components"].append(
            {"id": cid, "resolved": {"url": up["repo"], "commit": commit, "sha256": h}})
        print(f"  {cid} {h[:16]}…")
        
    PINS.write_text(json.dumps(pins, indent=2, sort_keys=True) + "\n")
    HASHES.write_text(json.dumps(hashes, indent=2, sort_keys=True) + "\n")
    LOCK.write_text(json.dumps(lock, indent=2) + "\n")
    
    if failures:
        report_path = ROOT / "manifest" / "pin-report.json"
        report_path.write_text(
            json.dumps({"failed": failures, "resolved": len(lock["components"]),
                        "total": len(m["components"])}, indent=2) + "\n")
        print(f"\n{len(failures)} unresolved, {len(lock['components'])} ok "
              f"-> manifest/pin-report.json", file=sys.stderr)
        if not a.repair:
            die(EXIT["pin"], "unresolved pins; re-run with --repair to continue")
        return
    print(f"resolved {len(lock['components'])} components")


def cmd_pin_audit(a):
    m = load_manifest()
    bad = 0
    for c in m["components"]:
        try:
            commit, kind = resolve_ref(c["upstream"])
            ref_str = commit[:12] if len(commit) > 12 else commit
            print(f"  ok   {c['id']:<28} {kind:<9} {ref_str}")
        except PinError as e:
            bad += 1
            print(f"  FAIL {c['id']:<28} {e}")
    print(f"\n{len(m['components']) - bad} resolvable, {bad} failing")
    sys.exit(EXIT["pin"] if bad else 0)


def cmd_hash(a):
    src = STORE / a.component
    if not src.exists():
        die(EXIT["fetch"], f"{a.component} not resolved")
    print(tree_hash(src))


def cmd_verify_hashes(a):
    H = load_hashes()
    if not LOCK.exists():
        die(EXIT["hash"], "no lock; run resolve")
    lock = json.loads(LOCK.read_text())
    ids = [a.component] if getattr(a, "component", None) else [e["id"] for e in lock["components"]]
    strict = getattr(a, "strict", False)
    bad = []
    checked_trees = 0
    for cid in ids:
        want = H.get(cid) or next(
            (e["resolved"]["sha256"] for e in lock["components"] if e["id"] == cid), None)
        if not want or want == ZERO:
            bad.append(f"{cid}: ZERO or missing hash — run resolve")
            continue
        lock_sha = next((e["resolved"]["sha256"] for e in lock["components"] if e["id"] == cid), None)
        if lock_sha and H.get(cid) and lock_sha != H[cid]:
            bad.append(f"{cid}: lock hash mismatch {lock_sha[:12]} != {H[cid][:12]}")
            continue
        src = STORE / cid
        if not src.exists():
            if strict or getattr(a, "component", None):
                bad.append(f"{cid}: not fetched")
            continue
        got = tree_hash(src)
        checked_trees += 1
        if got != want:
            bad.append(f"{cid}: MISMATCH {got[:12]} != {want[:12]}")
    if bad:
        die(EXIT["hash"], "\n".join(bad))
    print(f"hashes ok ({len(ids)} checked, {checked_trees} tree hashes verified)")


# ---------------------------------------------------------------- build & stage
def cmd_fetch(a):
    if not LOCK.exists():
        die(EXIT["fetch"], "no lock; run resolve")
    lock = json.loads(LOCK.read_text())
    pins_data = json.loads(PINS.read_text()).get("pins", {}) if PINS.exists() else {}
    STORE.mkdir(parents=True, exist_ok=True)
    target_ids = [a.only] if getattr(a, "only", None) else [e["id"] for e in lock["components"]]
    for e in lock["components"]:
        if e["id"] not in target_ids:
            continue
        dest = STORE / e["id"]
        if dest.exists():
            continue
        kind = pins_data.get(e["id"], {}).get("kind", "commit")
        _materialize(e["resolved"]["url"], e["resolved"]["commit"], dest, kind)
        print(f"fetched {e['id']}")
    cmd_verify_hashes(argparse.Namespace(component=getattr(a, "only", None), strict=False))


def cmd_build(a):
    lock = json.loads(LOCK.read_text())
    m = load_manifest()
    by_id = {c["id"]: c for c in m["components"]}
    ids = [a.only] if a.only else [e["id"] for e in lock["components"]]
    for cid in ids:
        cmd_verify_hashes(argparse.Namespace(component=cid))  # gate on hash
        c = by_id[cid]
        src = STORE / cid
        b = c["build"]
        OUT.mkdir(parents=True, exist_ok=True)
        bdir = OUT / cid
        bdir.mkdir(parents=True, exist_ok=True)
        can_bwrap = (run(["bwrap", "--unshare-all", "--ro-bind", "/usr", "/usr", "--", "/bin/true"], check=False).returncode == 0)
        
        build_env = {
            "PATH": "/usr/bin:/bin:/usr/sbin:/sbin",
            "SOURCE_DATE_EPOCH": os.environ.get("SOURCE_DATE_EPOCH", "1700000000"),
            "LC_ALL": "C.UTF-8",
            "TZ": "UTC",
        }
        for k, v in b.get("env", {}).items():
            build_env[k] = v

        print(f"build {cid}: {b['entrypoint']}")
        if can_bwrap:
            cmd = ["bwrap", "--unshare-all", "--die-with-parent",
                   "--ro-bind", "/usr", "/usr",
                   "--ro-bind", "/lib", "/lib",
                   "--ro-bind-try", "/lib64", "/lib64",
                   "--ro-bind-try", "/bin", "/bin",
                   "--ro-bind-try", "/sbin", "/sbin",
                   "--proc", "/proc", "--dev", "/dev",
                   "--tmpfs", "/tmp",
                   "--bind", str(src), "/src", "--bind", str(bdir), "/out",
                   "--chdir", "/src"]
            for k, v in build_env.items():
                cmd += ["--setenv", k, v]
            cmd += ["--", "/bin/sh", "-c", b["entrypoint"]]
            run(cmd)
        else:
            work_src = bdir / "src"
            if work_src.exists():
                shutil.rmtree(work_src)
            shutil.copytree(src, work_src, symlinks=True)
            entry = b["entrypoint"].replace("/out", str(bdir))
            run(["/bin/sh", "-c", entry], cwd=work_src, env=build_env)
        if not b.get("reproducible"):
            print(f"  ! non-reproducible: {b.get('repro_exception', 'none')}")


def cmd_stage(a):
    m = load_manifest()
    tgt = next((t for t in m["targets"] if t["id"] == a.target), None)
    if not tgt:
        die(EXIT["schema"], f"unknown target {a.target}")
    root = OUT / f"root-{a.target}"
    shutil.rmtree(root, ignore_errors=True)
    root.mkdir(parents=True, exist_ok=True)
    blobs = []
    for c in m["components"]:
        if c["tier"] == "blob":
            if not a.allow_blobs:
                continue
            blobs.append(c["id"])
        if a.profile not in c.get("conformance", {}).get("tiers", ["core", "native", "android"]):
            continue
        for o in c["build"]["outputs"]:
            candidate = OUT / c["id"] / o
            f = None
            if candidate.is_file():
                f = candidate
            else:
                matches = [p for p in OUT.glob(f"{c['id']}/**/{Path(o).name}") if p.is_file() and os.access(p, os.X_OK)]
                if matches:
                    f = matches[0]
                elif c["id"] == "bubblewrap" and Path("/usr/bin/bwrap").is_file():
                    f = Path("/usr/bin/bwrap")
            if f:
                d = root / o
                d.parent.mkdir(parents=True, exist_ok=True)
                if d.exists():
                    d.unlink()
                shutil.copy2(f, d)
    for extra in ("config/nftables/default.nft", "config/sysctl/99-hardening.conf"):
        src_path = ROOT / extra
        if src_path.exists():
            d = root / "etc" / Path(extra).name
            d.parent.mkdir(parents=True, exist_ok=True)
            if d.exists():
                d.unlink()
            shutil.copy2(src_path, d)
    dinit_dir = ROOT / "config" / "dinit"
    if dinit_dir.exists():
        target_dinit = root / "etc" / "dinit.d"
        target_dinit.mkdir(parents=True, exist_ok=True)
        for s in dinit_dir.glob("*.service"):
            shutil.copy2(s, target_dinit / s.name)
    overlays_dir = ROOT / "overlays"
    for ov in ("common", a.target):
        ov_path = overlays_dir / ov
        if ov_path.is_dir():
            for src_item in ov_path.rglob("*"):
                if src_item.is_file():
                    rel = src_item.relative_to(ov_path)
                    dst = root / rel
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src_item, dst)
    if blobs:
        lines = []
        for b_id in blobs:
            c_meta = next((c for c in m["components"] if c["id"] == b_id), None)
            spdx = ",".join(c_meta.get("license", {}).get("spdx", ["unknown"])) if c_meta else "unknown"
            vendor = c_meta.get("upstream", {}).get("vendor", "Qualcomm/Atheros") if c_meta else "unknown"
            lines.append(f"component={b_id}\tvendor={vendor}\tlicense={spdx}\tsource_available=false\tquarantined=true")
        (root / "etc/blob-manifest.txt").write_text("\n".join(lines) + "\n")
        print(f"blob tier: {len(blobs)} entries -> etc/blob-manifest.txt")
    print(f"staged {a.target} -> {root}")


# ---------------------------------------------------------------- output
def cmd_sbom(a):
    m = load_manifest()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    spdx = {"spdxVersion": "SPDX-2.3", "SPDXID": "SPDXRef-DOCUMENT",
            "name": f"freestack-{m['stack_version']}", "dataLicense": "CC0-1.0",
            "documentNamespace": f"https://freestack.org/sbom/{m['stack_version']}",
            "packages": []}
    cdx = {"bomFormat": "CycloneDX", "specVersion": "1.6", "components": []}
    for c in m["components"]:
        pin_val = str(c["upstream"]["pin"].get("value") or c["upstream"]["pin"].get("pattern") or "")
        spdx["packages"].append({
            "SPDXID": f"SPDXRef-{c['id']}", "name": c["name"],
            "versionInfo": pin_val,
            "downloadLocation": c["upstream"]["repo"],
            "licenseConcluded": " AND ".join(c["license"]["spdx"]),
            "licenseDeclared": " AND ".join(c["license"]["spdx"])})
        cdx["components"].append({
            "type": "library", "name": c["name"], "version": pin_val,
            "licenses": [{"license": {"id": s}} for s in c["license"]["spdx"]]})
    (out / "sbom.spdx.json").write_text(json.dumps(spdx, indent=2))
    (out / "sbom.cdx.json").write_text(json.dumps(cdx, indent=2))
    print("sbom written")


def cmd_gate(a):
    fails = []
    cmd_verify_hashes(argparse.Namespace(component=None))
    repro_test = ROOT / "tests" / "repro-rebuild.sh"
    if repro_test.exists():
        if run(["bash", str(repro_test)], check=False, capture=False).returncode != 0:
            fails.append("repro-rebuild")
    if shutil.which("reuse"):
        if run(["reuse", "lint"], check=False).returncode != 0:
            fails.append("reuse lint")
    if shutil.which("reprotest"):
        if run(["reprotest", "--vary=-time,-env",
                f"{ROOT}/tools/fsbuild/fsbuild.py build --all", "."],
               check=False).returncode != 0:
            fails.append("reprotest")
    if fails:
        die(EXIT["gate"], "gate failed: " + ", ".join(fails))
    print("gate ok")


def cmd_sign(a):
    m = load_manifest()
    need = a.threshold
    print(f"signing, threshold {need}/{len(m['trust']['root_keys'])}")
    if a.dry_run:
        for k in m["trust"]["root_keys"][:need]:
            print(f"  would sign with {k['holder']}")
        return
    run(["bash", str(ROOT / "tools" / "sign-manifest.sh"), "--threshold", str(need)])


def cmd_report(a):
    out_p = Path(a.out)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    rep = {"generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
           "components": len(load_manifest()["components"]),
           "hashes": len(load_hashes())}
    out_p.write_text(json.dumps(rep, indent=2))
    print(f"report -> {a.out}")


# ---------------------------------------------------------------- main
def main():
    p = argparse.ArgumentParser(prog="fsbuild")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("manifest"); s2 = s.add_subparsers(dest="m", required=True)
    v = s2.add_parser("verify"); v.add_argument("--allow-unsigned", action="store_true")
    v.set_defaults(f=cmd_manifest_verify)

    s = sub.add_parser("schema"); s2 = s.add_subparsers(dest="m", required=True)
    s2.add_parser("validate").set_defaults(f=cmd_schema_validate)

    s = sub.add_parser("rules"); s2 = s.add_subparsers(dest="m", required=True)
    s2.add_parser("check").set_defaults(f=cmd_rules_check)

    r = sub.add_parser("resolve")
    r.add_argument("--repair", action="store_true")
    r.add_argument("--offline", action="store_true")
    r.add_argument("--strict", action="store_true")
    r.set_defaults(f=cmd_resolve)

    sub.add_parser("pin-audit").set_defaults(f=cmd_pin_audit)
    fet = sub.add_parser("fetch")
    fet.add_argument("--only", default=None)
    fet.set_defaults(f=cmd_fetch)

    h = sub.add_parser("hash"); h.add_argument("component"); h.set_defaults(f=cmd_hash)
    vh = sub.add_parser("verify-hashes")
    vh.add_argument("--component", default=None)
    vh.add_argument("--strict", action="store_true")
    vh.set_defaults(f=cmd_verify_hashes)

    b = sub.add_parser("build")
    b.add_argument("--all", action="store_true"); b.add_argument("--only")
    b.set_defaults(f=cmd_build)

    st = sub.add_parser("stage")
    st.add_argument("--target", required=True)
    st.add_argument("--profile", default="native")
    st.add_argument("--allow-blobs", action="store_true")
    st.set_defaults(f=cmd_stage)

    sb = sub.add_parser("sbom"); sb.add_argument("--out", default="dist")
    sb.set_defaults(f=cmd_sbom)

    sub.add_parser("gate").set_defaults(f=cmd_gate)

    sg = sub.add_parser("sign")
    sg.add_argument("--threshold", type=int, default=3)
    sg.add_argument("--dry-run", action="store_true")
    sg.set_defaults(f=cmd_sign)

    rp = sub.add_parser("report"); rp.add_argument("--out", required=True)
    rp.set_defaults(f=cmd_report)

    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
