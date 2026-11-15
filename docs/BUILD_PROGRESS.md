# LibreDroid OS — Build Progress Register

**Last Updated:** 2026-11-15 23:49 UTC+10
**Release Baseline:** v0.1 (Debian Trixie amd64 snapshot `20251101T000000Z`, glibc, systemd, Cage, Chromium kiosk)

---

## 1. Architectural Alignment
- **ADR 0004:** Recorded in [`docs/adr/0004-v0.1-debian-glibc-stack.md`](file:///home/nitin/fkgugal/docs/adr/0004-v0.1-debian-glibc-stack.md). Resolved the documentation vs implementation divergence:
  - **v0.1 Release:** Debian Trixie + glibc + systemd (working Node/React shell and Chromium/Cage graphics).
  - **v1.0 Target:** musl libc + dinit supervisor + toybox + native Wayland shell.
- **Blob Tier Itemized:** [`docs/BLOBS.md`](file:///home/nitin/fkgugal/docs/BLOBS.md) documents non-free packages (`firmware-iwlwifi`, `intel-microcode`) under quarantine rules.
- **Architecture Overview:** Updated in [`docs/ARCHITECTURE.md`](file:///home/nitin/fkgugal/docs/ARCHITECTURE.md).

---

## 2. Infrastructure & Build Scripts
- **Package Inventory:**
  - [`os/build/package-lists/libredroid.list.chroot`](file:///home/nitin/fkgugal/os/build/package-lists/libredroid.list.chroot)
  - [`os/build/config/package-lists/libredroid.list.chroot`](file:///home/nitin/fkgugal/os/build/config/package-lists/libredroid.list.chroot)
- **Hooks:**
  - [`os/build/hooks/policy-rc.d.chroot`](file:///home/nitin/fkgugal/os/build/hooks/policy-rc.d.chroot)
  - [`os/build/hooks/90-setup.chroot`](file:///home/nitin/fkgugal/os/build/hooks/90-setup.chroot)
  - [`os/build/hooks/customize00-setup.sh`](file:///home/nitin/fkgugal/os/build/hooks/customize00-setup.sh)
- **Pipeline Scripts:**
  - [`os/build/01-bootstrap.sh`](file:///home/nitin/fkgugal/os/build/01-bootstrap.sh) (Debian snapshot bootstrap, trixie-security normalization, L0 verification)
  - [`os/build/02-overlay.sh`](file:///home/nitin/fkgugal/os/build/02-overlay.sh) (rsync includes, dist, server.js, enable `lrd-bridge.service`)
  - [`os/build/03-initramfs.sh`](file:///home/nitin/fkgugal/os/build/03-initramfs.sh) (mounts dev/proc/sys, auto-configures `initramfs.conf` with `COMPRESS=gzip`, updates initramfs)
  - [`os/build/04-squashfs.sh`](file:///home/nitin/fkgugal/os/build/04-squashfs.sh) (zstd-19 compression, SOURCE_DATE_EPOCH timestamp, copies kernel + initrd from rootfs, adjusts permissions)
  - [`os/build/05-iso.sh`](file:///home/nitin/fkgugal/os/build/05-iso.sh) (grub configuration, hybrid ISO generation via `grub-mkrescue`)
  - [`os/build/06-qemu-test.sh`](file:///home/nitin/fkgugal/os/build/06-qemu-test.sh) (KVM accelerated QEMU boot test with serial console)
- **CI Gate:**
  - [`.ci/build-gate.sh`](file:///home/nitin/fkgugal/.ci/build-gate.sh) (Enforces squashfs size >= 700 MB)

---

## 3. Verification Ladder Status
| Rung | Milestone | Status | Details |
|:---:|:---|:---:|:---|
| **L0** | Rootfs bootstrap (`libc`, `sh`, `init`, `node`, `cage`, `chromium`, `vmlinuz`) | ✅ **PASSED** | Size: **1.5 GB** (`out/rootfs`). Verified real packages & systemd kiosk units. |
| **L0.5** | SquashFS image generation >= 800 MB (Gate >= 700 MB) | ⏳ **Ready** | Script `03-initramfs.sh` patched with valid `COMPRESS=gzip`. Ready to package. |
| **L1** | QEMU boot to login prompt | ⏳ **Pending** | `05-iso.sh` & `06-qemu-test.sh` ready. |
| **L2** | `lrd-bridge.service` active | ⏳ **Pending** | Unit wired in `02-overlay.sh`. |
| **L3** | Chromium renders shell | ⏳ **Pending** | Wayland cage + kiosk wired. |
| **L4** | Metal / USB boot | ⏳ **Pending** | Hybrid GPT/MBR boot structure. |
