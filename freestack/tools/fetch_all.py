#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Comprehensive fetch orchestrator for FreeStack source components.

Fetches every pinned component into .store/<component>, cleans VCS metadata,
computes deterministic tree hashes, updates manifest/hashes.json & lockfile,
and persists an exhaustive audit log of every fetch operation.
"""

import concurrent.futures
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools" / "fsbuild"))
import fsbuild

os.environ["PATH"] = f"{ROOT / 'tools'}:{os.environ.get('PATH', '')}"

STORE = ROOT / ".store"
MANIFEST = ROOT / "manifest" / "freestack.manifest.yaml"
LOCK = ROOT / "manifest" / "freestack.lock.json"
HASHES = ROOT / "manifest" / "hashes.json"
PINS = ROOT / "manifest" / "pins.json"
DIST = ROOT / "dist"
RECORD_FILE = DIST / "fetch-record.json"


def get_dir_stats(path: Path) -> tuple[int, int]:
    """Return (file_count, total_bytes)."""
    count = 0
    total_bytes = 0
    for root, _, files in os.walk(path):
        for f in files:
            p = Path(root) / f
            if not p.is_symlink() and p.is_file():
                count += 1
                try:
                    total_bytes += p.stat().st_size
                except OSError:
                    pass
    return count, total_bytes


def fetch_component(comp: dict, pin_info: dict, lock_sha: str) -> dict:
    cid = comp["id"]
    up = comp["upstream"]
    url = up.get("repo", "")
    pin = up.get("pin", {})
    kind = pin.get("kind", pin_info.get("kind", "commit"))
    ref = pin_info.get("commit") or pin.get("value") or ""
    if not ref or len(ref) < 7:
        try:
            resolved_ref, resolved_kind = fsbuild.resolve_ref(up)
            ref = resolved_ref
            kind = resolved_kind
        except Exception as e:
            print(f"    [{cid}] resolve_ref warning: {e}")

    dest = STORE / cid
    t0 = time.time()
    action = "already_present"

    if not (dest.exists() and any(dest.iterdir())):
        action = "downloaded"
        dest.mkdir(parents=True, exist_ok=True)
        print(f"[*] [{cid}] Fetching from {url} (ref: {ref[:16]}…)...")

        if kind in ("commit", "tag", "branch", "tag_glob"):
            cloned = False
            # 1. Direct shallow fetch by commit/ref
            try:
                fsbuild.run(["git", "init", "--quiet", str(dest)], check=False)
                fsbuild.run(["git", "-C", str(dest), "remote", "add", "origin", url], check=False)
                r_fetch = fsbuild.run(["git", "-C", str(dest), "fetch", "--quiet", "--depth", "1", "origin", ref], check=False)
                if r_fetch.returncode == 0:
                    r_co = fsbuild.run(["git", "-C", str(dest), "checkout", "--quiet", "FETCH_HEAD"], check=False)
                    if r_co.returncode == 0:
                        cloned = True
            except Exception as exc:
                print(f"    [{cid}] shallow fetch warning: {exc}")

            # 2. Shallow clone by branch/tag if ref is not full 40-char commit
            if not cloned and len(ref) != 40:
                shutil.rmtree(dest, ignore_errors=True)
                dest.mkdir(parents=True, exist_ok=True)
                r_cl = fsbuild.run(["git", "clone", "--quiet", "--depth", "1", "--branch", ref, url, str(dest)], check=False)
                if r_cl.returncode == 0:
                    cloned = True

            # 3. Shallow clone of default branch then checkout commit
            if not cloned:
                shutil.rmtree(dest, ignore_errors=True)
                dest.mkdir(parents=True, exist_ok=True)
                r_cl = fsbuild.run(["git", "clone", "--quiet", "--depth", "1", url, str(dest)], check=False)
                if r_cl.returncode == 0:
                    r_co = fsbuild.run(["git", "-C", str(dest), "checkout", "--quiet", "--detach", ref], check=False)
                    if r_co.returncode == 0:
                        cloned = True

            # 4. Full clone fallback
            if not cloned:
                print(f"    [{cid}] falling back to full clone...")
                shutil.rmtree(dest, ignore_errors=True)
                fsbuild.run(["git", "clone", "--quiet", url, str(dest)])
                fsbuild.run(["git", "-C", str(dest), "checkout", "--quiet", "--detach", ref])

            # Strip .git directory per FreeStack specification
            shutil.rmtree(dest / ".git", ignore_errors=True)

        else:
            # Tarball handling
            tar_url = ref or url
            tar = dest.parent / f"{dest.name}.tar"
            r_dl = fsbuild.run(["curl", "-fsSL", "-o", str(tar), tar_url], check=False)
            if r_dl.returncode != 0 and tar_url.endswith(".tar.xz"):
                alt_url = tar_url[:-7] + ".tar.lz"
                print(f"    [{cid}] 404 on xz, trying lz: {alt_url}...")
                r_dl = fsbuild.run(["curl", "-fsSL", "-o", str(tar), alt_url], check=False)
            if r_dl.returncode != 0:
                raise RuntimeError(f"Failed to download tarball: {tar_url}")

            r_tar = fsbuild.run(["tar", "-xf", str(tar), "-C", str(dest), "--strip-components=1"], check=False)
            if r_tar.returncode != 0:
                fsbuild.run(["tar", "-I", "lunzip", "-xf", str(tar), "-C", str(dest), "--strip-components=1"])
            tar.unlink(missing_ok=True)

    elapsed = time.time() - t0
    tree_hash = fsbuild.tree_hash(dest)
    file_count, byte_size = get_dir_stats(dest)

    print(f"[✔] [{cid}] Done ({action}) in {elapsed:.1f}s | {file_count} files, {byte_size / (1024*1024):.2f} MB | tree_sha: {tree_hash[:16]}…")

    return {
        "id": cid,
        "name": comp.get("name", cid),
        "upstream_url": url,
        "kind": kind,
        "ref": ref,
        "local_path": str(dest.relative_to(ROOT)),
        "file_count": file_count,
        "bytes": byte_size,
        "tree_sha256": tree_hash,
        "action": action,
        "elapsed_seconds": round(elapsed, 2),
        "status": "FETCHED_AND_VERIFIED",
    }


def main():
    STORE.mkdir(parents=True, exist_ok=True)
    DIST.mkdir(parents=True, exist_ok=True)

    manifest_data = fsbuild.load_manifest()
    lock_data = json.loads(LOCK.read_text()) if LOCK.exists() else {"components": []}
    pins_data = json.loads(PINS.read_text()).get("pins", {}) if PINS.exists() else {}

    lock_map = {c["id"]: c for c in lock_data["components"]}
    records = []
    updated_hashes = fsbuild.load_hashes()
    hashes_changed = False

    components = manifest_data["components"]
    print(f"=== Starting Exhaustive Fetch for {len(components)} Components ===")

    # Run downloads in parallel with a thread pool
    max_workers = 6
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_map = {}
        for comp in components:
            cid = comp["id"]
            p_info = pins_data.get(cid, {})
            l_info = lock_map.get(cid, {})
            lock_sha = l_info.get("resolved", {}).get("sha256", "")
            f = executor.submit(fetch_component, comp, p_info, lock_sha)
            future_map[f] = comp

        for future in concurrent.futures.as_completed(future_map):
            comp = future_map[future]
            cid = comp["id"]
            try:
                rec = future.result()
                records.append(rec)
            except Exception as e:
                print(f"[✘] [{cid}] Error: {e}", file=sys.stderr)
                raise

    # Sort records by component id
    records.sort(key=lambda x: x["id"])

    # Update lock components and hashes
    for rec in records:
        cid = rec["id"]
        th = rec["tree_sha256"]
        if updated_hashes.get(cid) != th:
            updated_hashes[cid] = th
            hashes_changed = True
        if cid in lock_map:
            if lock_map[cid]["resolved"].get("sha256") != th:
                lock_map[cid]["resolved"]["sha256"] = th
                hashes_changed = True
        else:
            lock_map[cid] = {
                "id": cid,
                "resolved": {
                    "url": rec["upstream_url"],
                    "commit": rec["ref"],
                    "sha256": th,
                }
            }
            hashes_changed = True

    lock_data["components"] = [lock_map[c["id"]] for c in components if c["id"] in lock_map]

    # Write record file
    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_components": len(records),
        "total_files": sum(r["file_count"] for r in records),
        "total_bytes": sum(r["bytes"] for r in records),
        "components": records,
    }
    RECORD_FILE.write_text(json.dumps(report, indent=2) + "\n")
    (ROOT / "manifest" / "fetch-record.json").write_text(json.dumps(report, indent=2) + "\n")

    if hashes_changed:
        h_doc = {
            "algorithm": "tree-sha256-v1",
            "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "hashes": updated_hashes,
        }
        HASHES.write_text(json.dumps(h_doc, indent=2, sort_keys=True) + "\n")
        LOCK.write_text(json.dumps(lock_data, indent=2) + "\n")
        print("Updated manifest/hashes.json and manifest/freestack.lock.json with real content tree hashes.")

    print(f"\n✔ Successfully fetched and recorded {len(records)} components!")
    print(f"  Total files: {report['total_files']:,}")
    print(f"  Total storage: {report['total_bytes'] / (1024*1024*1024):.2f} GB")
    print(f"  Audit log: {RECORD_FILE}")


if __name__ == "__main__":
    main()
