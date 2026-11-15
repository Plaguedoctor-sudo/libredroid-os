# LibreDroid OS Build & CI Specification

## Overview
LibreDroid v0.1 uses a Debian Trixie (glibc + systemd) baseline to deliver an immediate, reliable kiosk shell hosting the React Vite SPA on Cage and Chromium. Musl + dinit remains the target for LibreDroid v1.0 (see [ADR 0004](docs/adr/0004-v0.1-debian-glibc-stack.md)).

## Build Pipeline
All stages must be invoked through the unified subuid namespace wrapper `os/build/00-run.sh` to ensure unprivileged builds retain correct root ownership on root-only and private paths:

```bash
bash os/build/00-run.sh bash os/build/01-bootstrap.sh
bash os/build/00-run.sh bash os/build/02-overlay.sh
bash os/build/00-run.sh bash os/build/03-initramfs.sh
bash os/build/00-run.sh bash os/build/04-squashfs.sh
bash os/build/05-iso.sh
```

### Stage Summary
1. `00-run.sh`: Maps root and subordinate UIDs (`unshare --map-auto --map-root-user --mount --pid --fork`).
2. `01-bootstrap.sh`: Minimal Debian Trixie base via `mmdebstrap` using snapshot mirror `20251101T000000Z`, including DFSG-free packages plus non-free firmware (`firmware-iwlwifi`, `firmware-realtek`, `intel-microcode`, `amd64-microcode`, itemized in [docs/BLOBS.md](docs/BLOBS.md)). Output: `out/rootfs` (~1.5GB uncompressed).
3. `02-overlay.sh`: Copies `/opt/libredroid` artifacts (Vite SPA `dist/`, bridge `server.js`), installs `lrd-shell-start` healthcheck gate, configures `tty7` kiosk session, and enables `lrd-bridge.service`.
4. `03-initramfs.sh`: Configures `MODULES=most` and `COMPRESS=gzip`, generating modular bootable initramfs. Includes `9991-netbase-dir.sh` to ensure `/root/etc/network` is ready without shadowing Debian packages.
5. `04-squashfs.sh`: Compresses rootfs into `out/iso/live/filesystem.squashfs` with `mksquashfs -comp zstd -Xcompression-level 19`.
6. `05-iso.sh`: Builds hybrid BIOS + UEFI bootable ISO image (`out/libredroid-universal-x86_64.iso`) with `grub-mkrescue` and serial console output.
7. `06-qemu-test.sh`: Automated QEMU VM boot verification runner (`-enable-kvm -cpu host -m 4096`).

## CI Build Gate & Integrity Assertions
The build gate is enforced by [.ci/build-gate.sh](.ci/build-gate.sh).

```bash
bash .ci/build-gate.sh out/iso/live/filesystem.squashfs
```

1. **Path Assertions:** Ensures `usr/bin/cage`, `usr/bin/chromium`, `usr/bin/node`, `usr/sbin/init`, `etc/shadow`, and `root` exist in the SquashFS image.
2. **Package Database Sanity:** Verifies at least 250 packages installed in `/var/lib/dpkg/status` (current build contains 400+).
3. **Size Regression Floor:** 600 MB floor prevents partial or aborted bootstraps (with zstd level 19 ultra-compression on 1.5GB rootfs, normal size is ~637 MB). This floor will be raised as OS features are added.
4. **Ownership Verification:**
  - `unsquashfs -l out/iso/live/filesystem.squashfs | grep -cE '^squashfs-root/(root/|etc/credstore|var/lib/private)' >= 6`
  - `grep -c '^live:' <(unsquashfs -cat out/iso/live/filesystem.squashfs etc/shadow) == 1`

## Verification Ladder
- **L0:** Binaries present in rootfs (`bin/sh`, `libc.so.6`, `init`, `node`, `cage`, `chromium`, `vmlinuz`).
- **L0.5:** SquashFS is fully populated without empty or hollow stub directories.
- **L1:** Boots to shell autologin on `tty1` and serial `ttyS0`.
- **L2:** LibreDroid bridge active on port 3001 (`http://127.0.0.1:3001`).
- **L3:** LibreDroid kiosk shell rendered via Cage + Chromium on `tty7`, gated by `lrd-shell-start` waiting on bridge availability (`curl -fsS http://127.0.0.1:3001/`), verified by `NRestarts=0`, monotonic journal ordering, and QEMU `screendump` committed to `dist/l3-proof.png`.
- **L4:** Bare-metal boot on real x86_64 hardware.
