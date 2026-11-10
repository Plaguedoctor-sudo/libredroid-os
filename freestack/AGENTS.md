# AGENTS.md — FreeStack build agent contract

You are building FreeStack: a fully free, telemetry-free, reproducible
operating system from a signed manifest. Read this file completely before
any action. Re-read it after every phase.

## Non-negotiables (violating any = build fails)

R1  Every component builds from source with a free toolchain.
R2  No binary blobs in tier `core`. Blobs only with `--allow-blobs`, itemized.
R3  No account required to install, boot, or use.
R4  No default-on telemetry.
R5  Default-deny network egress; a process with no rule has no network.
R6  No single-vendor key in the boot chain. Root of trust is the user's.
R7  Reproducible builds, bit for bit. Non-reproducible components carry a
    repro_exception and are tracked.
R8  Strong copyleft (GPL-3.0-or-later) for platform core.
R9  Foundation governance; trademark outside the company.
R10 DCO sign-off, never a relicensing CLA.
R11 No mandatory cloud. Local-first, self-hostable, offline path.
R12 No patent traps. Apache-2.0 / GPL-3.0 patent grants only.

## Absolute prohibitions

- Never edit `manifest/*.schema.json` to make invalid data pass. Fix the data.
- Never bump a `upstream.pin` without updating `verify.sha256` and re-running
  `fsbuild resolve`.
- Never add a `tier: blob` component to a `core` stage without a waiver entry.
- Never let `build` reach the network. If a build needs net, declare a mirror.
- Never commit `.store/`, `dist/`, or anything from `out/`.
- Never write to `manifest/freestack.lock.json` by hand. Only `fsbuild resolve`.
- Never mark a component `reproducible: true` without a clean `fsbuild gate`.
- Never add `systemd-resolved`, `systemd-timesyncd`, or GMS.
- Never introduce X11. Wayland only; XWayland is opt-in.
- Never add a default-on "anonymous statistics" flag anywhere.

## Tool

All work goes through `./tools/fsbuild/fsbuild.py`. Do not shell out to
`git clone` or `make` directly for tracked components — the tool records
hashes and provenance. `make help` lists every entry point.

## Phases and acceptance criteria

Complete phases in order. Do not start phase N+1 until phase N's criteria
all pass. Report the exact command output for each criterion.

### Phase 0 — skeleton
- `make verify` exits 0 (manifest signature verified, ≥3 of 5 keys)
- `make schema` exits 0
- `make rules` exits 0
- `make sbom` produces `dist/sbom.spdx.json` and `dist/sbom.cdx.json`
- `docs/THREAT-MODEL.md` exists and lists residual limits

### Phase 1 — toolchain and base
- `make resolve` writes a lock with zero zero-hashes
- `make fetch` materializes `musl`, `toybox`, `dinit`, `bubblewrap`
- `make build COMPONENT=musl` produces `lib/libc.a` and `lib/libc.so`
- `make build COMPONENT=dinit` produces `bin/dinit`
- `make stage TARGET=x200-libreboot PROFILE=native --allow-blobs=0` builds a root

### Phase 2 — boot chain
- `heads`, `coreboot`, `minisign`, `tpm2-tss` all build
- `tools/gen-root-keys.sh` generates a 3-of-5 key ceremony doc and test keys
- `fsbuild` refuses a manifest signed by fewer than 3 keys (verify by test)

### Phase 3 — display
- `wayland`, `wlroots`, `mesa`, `phosh` build
- stage includes a working `sway`-or-`phosh` session unit
- `make gate` shows zero diffoscope output on `mesa`

### Phase 4 — network lockdown
- `nftables` ruleset from `config/nftables/default.nft` is default-deny
- `opensnitch`, `unbound`, `chrony` (NTS) build
- `make test-net` proves a process without a rule has no route
- modem netns isolation unit exists in `config/dinit/`

### Phase 5 — security core
- `selinux-userspace`, `libseccomp`, `cryptsetup`, `libsodium`, `libfido2` build
- `config/selinux/minimal.te` compiles with `checkpolicy`
- `config/sysctl/99-hardening.conf` applies clean
- every service unit has `bwrap` with `--unshare-all --die-with-parent`

### Phase 6 — updates and transparency
- `rauc`, `erofs-utils`, `cosign`, `rebuilderd` build
- `make sign-dry` produces a threshold-signed manifest and a rekor entry
- three mirror definitions present including one `.onion`

### Phase 7 — gate and release
- `make gate` green: reprotest, diffoscope vs builder-b, reuse lint, syzkaller 72h
- `make report` writes `dist/fsbuild-report.json`
- `docs/BUILD.md` reproduces the whole thing from a clean container

## Definition of done

A release is done when a third party can, from `docs/BUILD.md` alone and with
no account, rebuild the image bit-for-bit and get the same hashes. Until then
it is a snapshot, not a release.

## Style

- Commit messages: `phase(N): <what>` and `Signed-off-by:` trailer (DCO).
- Every new file gets an SPDX header and a `REUSE.toml` entry if binary.
- Prefer small commits. One component per commit.
- When blocked, write the blocker into `docs/BUILD.md` under `## Blockers`
  and continue with the next independent component.

## Amendment 1 — hashes and keys

- `verify.sha256` in the manifest may be `000…0`. That is a sentinel, not a value.
- Run `make resolve` before Phase 1. It writes `manifest/hashes.json` and
  `manifest/freestack.lock.json`. Commit both.
- `make build` and `make gate` call `verify-hashes` and fail with exit 45 on
  any zero, missing or mismatched hash. Never bypass this.
- Never hand-edit `hashes.json` or the lock. Only `resolve` writes them.
- `keys/` must exist with 5 `*.pub` files before `make verify` can pass. If
  `keys/` is empty, run `make gen-keys` (uses passphrase prompts; use
  `--allow-unsigned` only for Phase 0 dry runs).
- Private keys (`keys/*.key`) are gitignored. Public keys are committed.

## Amendment 2 — pin resolution

- `pin` is an object, never a bare string. Valid kinds: `commit`, `tag`,
  `tag_glob`, `branch`, `tarball`, `dir_glob`.
- Prefer `tag_glob` with `min` and, where the tag carries a prefix,
  `version_regex`. A glob survives a wrong guess; an exact tag does not.
- `make pin-audit` resolves every pin without writing anything. Run it after
  any manifest edit. Non-zero means fix pins before doing anything else.
- `make resolve` runs `--repair`: it writes what resolves, records what does
  not in `manifest/pin-report.json`, and exits 51. Never let a 51 stand.
- `manifest/pins.json` holds resolved commits. Commit it. `--offline` rebuilds
  from it with no network.
- A pin that fails for a repo with no tags gets `kind: branch` plus a
  `# TODO: pin to commit once stable` note in `docs/BUILD.md#blockers`.
- Never widen a `min` floor just to make a pin resolve. Narrow the pattern.
