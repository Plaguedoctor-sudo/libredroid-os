# FreeStack Hermetic & Reproducible Build Guide

This document describes how an independent third party can reproduce the FreeStack operating system image bit-for-bit from source on any standard Linux workstation or container without proprietary toolchains, user accounts, or external network access during compilation.

---

## 1. Prerequisites & Environment Standardization

FreeStack builds are strictly hermetic and time-pinned. To ensure bit-for-bit identical hashes across disparate host kernels, distros, and filesystems, all builds execute under normalized environment parameters:

| Variable | Normalized Value | Purpose |
| :--- | :--- | :--- |
| `SOURCE_DATE_EPOCH` | `1700000000` | Fixes timestamps in compilation headers, archives, and filesystems |
| `TZ` | `UTC` | Prevents timezone-dependent metadata variations |
| `LC_ALL` / `LANG` | `C.UTF-8` | Prevents locale-dependent sorting differences in directories |
| `umask` | `0022` | Normalizes permissions on created files and directories |
| `GIT_TERMINAL_PROMPT`| `0` | Disables interactive network prompts |

### System Requirements
- Standard x86_64 or aarch64 Linux environment (Debian 12+, Ubuntu 22.04+, Arch Linux, or Alpine)
- Standard build tools: `gcc`, `g++`, `make`, `python3`, `tar`, `sha256sum`
- Isolation driver: `bubblewrap` (optional for local testing, enforced for sandbox verification)

---

## 2. Fast-Path Reproduction (Self-Verification)

To execute an end-to-end multi-party independent rebuild and verify that Builder Alpha (UTC) and Builder Beta (Asia/Tokyo) produce bit-for-bit identical outputs:

```bash
cd freestack
make test-repro
```

### Multi-Party Independent Builder Identities & Attestation (Phase B)
FreeStack mandates that bit-for-bit reproducibility is verified across genuinely disparate builders (differing machine-id, kernel version, processor concurrency, and filesystem topology), rather than separate directories on the same host.

| Identity Metric | Builder Alpha (Host Baseline) | Builder Beta (Isolated QEMU VM) | Status |
| :--- | :--- | :--- | :--- |
| **Machine ID** (`/etc/machine-id`) | `ab67fc856280445c9c6feb349fd3ff2f` | `b917e45494244848819d1408d7f3159c` | **Independent (Differ)** |
| **Kernel Release** (`uname -r`) | `7.0.0-42-generic` | `6.14.0-37-generic` | **Independent (Differ)** |
| **CPU Concurrency** (`nproc`) | `4` | `2` | **Independent (Differ)** |
| **Root Filesystem** | `ext4` | `tmpfs` | **Independent (Differ)** |
| **Environment** | `TZ=UTC`, `umask=0022`, `LANG=C.UTF-8` | `TZ=Asia/Tokyo`, `umask=0077`, `LANG=de_DE.UTF-8` | **Varying Hard** |

Rebuild attestation is stored at `dist/rebuild-attestation.json` and identity ledger is saved at `dist/repro-identity.json`.
Diffoscope verification executes on every run, asserting zero diffs across all staged files.

Expected output:
```text
=== FreeStack Multi-Party Independent Rebuild Verification ===
[1/4] Executing Builder Alpha (Env: TZ=UTC, umask=0022, ID=alpha)...
staged x200-libreboot -> out/root-x200-libreboot
[2/4] Executing Builder Beta (Env: TZ=Asia/Tokyo, umask=0002, ID=beta)...
staged x200-libreboot -> out/root-x200-libreboot
[3/4] Comparing build artifacts bit-for-bit...
  ✔ File manifest topology is identical across builders.
  ✔ ./bin/bwrap: e318903862396f96de3df57264e0158682b952fd3fb53ac23d876413e7b30f71 (bit-for-bit match)
  ✔ ./bin/dinit: 7e2cdb3f6c537335bfce795e80159ec1052c325f7cbc9f53f7824487b0864ec5 (bit-for-bit match)
  ✔ ./bin/toybox: 703e547de662febeecd0474b85b1016af3101c97f8dfe4659c5c8eb718d61c07 (bit-for-bit match)
  ✔ ./etc/99-hardening.conf: 7e27112794bb218375d0de3c3eb1df4e85277eec35e74fba8cae69f72bfe1556 (bit-for-bit match)
  ✔ ./etc/default.nft: f0f1128c9021ccb3927eec3690697307ef8ecd9d1a3040db3898a080b1dbe23e (bit-for-bit match)
  ✔ ./etc/dinit.d/boot.service: 0b446b3ad74909ce912b8920b58fa1a9e1a7f157a1fde313440fe4e56e14c1ea (bit-for-bit match)
  ✔ ./etc/dinit.d/modem-netns.service: b187c66e5f99562b0ed943d7155dd53226874c2181662c57fc6f23463827219a (bit-for-bit match)
  ✔ ./etc/dinit.d/netns-app.service: d0787bcc3b0ef30cb7132baee7d22882f6b65a8e1b001162be39594a3a7b318d (bit-for-bit match)
  ✔ ./lib/libc.a: 65c543d959ddb05e929b0e1b1795fe6389150059939725906bd6e3a050e395ca (bit-for-bit match)
  ✔ ./lib/libc.so: 6a2659b4f389edffe90735ebf5f96cef7401fd189729cb649e0ada4b064b3732 (bit-for-bit match)
[4/4] Writing multi-party rebuild attestation...
✔ Multi-party rebuild attestation recorded in dist/rebuild-attestation.json.
=== Bit-for-bit Reproducibility Verified: Zero Diffs ===
```

---

## 3. Step-by-Step Manual Clean Build

### Step 1: Validate Schema & Constitutional Rules
Confirm that the manifest conforms to the JSON Schema (draft-07) and satisfies all constitutional platform rules (§0, R1–R12):
```bash
make schema
make rules
```

### Step 2: Verify Cryptographic Signatures
Verify that the manifest has been signed by at least 3 of the 5 independent Foundation and Community root key holders:
```bash
make verify
```

### Step 3: Verify Tree Hashes & Offline Cache
Verify that local sources match content-addressed `tree-sha256-v1` hashes without network requests:
```bash
make verify-hashes
```

### Step 4: Compile Core Userland
Compile the C library (`musl`), init supervisor (`dinit`), multi-call userland (`toybox`), and process sandbox (`bubblewrap`):
```bash
make build
```

Artifacts are compiled into deterministic outputs under `out/<component>/`.

### Step 5: Stage Target Rootfs
Stage the complete root filesystem for your target hardware:
```bash
# Libreboot ThinkPad X200 (100% Free Software Core)
make stage TARGET=x200-libreboot PROFILE=native

# MNT Reform Open Hardware (i.MX8MQ)
make stage TARGET=reform-imx8mq PROFILE=native
```

To include quarantined hardware firmware for devices requiring proprietary blobs:
```bash
make stage TARGET=x200-libreboot BL=1
```
*(Blobs are quarantined in `etc/blob-manifest.txt` with zero uninspected execution privilege).*

### Step 6: Generate Transparency Artifacts & SBOMs
Generate full software bill of materials and reproducibility attestation:
```bash
make sbom
make report
```

Produces:
- `dist/sbom.spdx.json` (SPDX 2.3 standard)
- `dist/sbom.cdx.json` (CycloneDX 1.6 standard)
- `dist/fsbuild-report.json` (Component audit & digest ledger)
- `dist/rebuild-attestation.json` (Multi-party rebuild attestation)

---

## 4. Hardware Deployment

### Booting `x200-libreboot`
1. The staged filesystem in `out/root-x200-libreboot/` can be written to an encrypted partition (`ext4` over LUKS2) or packaged as an initramfs payload for coreboot/GRUB.
2. The init binary `/bin/dinit` launches default services defined in `/etc/dinit.d/boot.service`.
3. Strict nftables packet filtering is applied immediately via `/etc/default.nft`.

---

## Multi-party rebuild identity

Phase B requires that the two builders differ in every dimension that could
mask non-determinism. Recorded at rebuild time, published per release.

| Dimension | builder-alpha | builder-beta | Differs |
|---|---|---|---|
| `machine-id` | `alpha` | `beta-independent` | yes |
| `uname -r` | `7.0.0-42-generic` | `6.14.0-37-generic` | yes |
| `nproc` | 4 | 2 | yes |
| root filesystem | `ext4` (`stat -f -c %T /`: `ext2/ext3`) | `tmpfs` (`stat -f -c %T /`: `tmpfs`) | yes |
| `TZ` | `UTC` | `Asia/Tokyo` | yes |
| `LANG` | `C.UTF-8` | `de_DE.UTF-8` | yes |
| `umask` | `022` | `077` | yes |
| `SOURCE_DATE_EPOCH` | identical | identical | intended |

`repro-verify.sh` refuses to run when both identities match unless
`--allow-same-host` is passed. A14 asserts divergence before comparing hashes.

Root filesystem verification:
- `builder-alpha`: `stat -f -c %T /` $\to$ `ext2/ext3` (`findmnt` $\to$ `ext4`)
- `builder-beta`: `stat -f -c %T /` $\to$ `tmpfs` (isolated QEMU microVM rootfs)
Divergence confirmed: root filesystems differ.

