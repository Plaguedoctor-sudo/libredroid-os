# LibreDroid OS — Mobile Installer & OTA Distribution Tools

The `installer/mobile/` directory contains tools dedicated to mobile hardware deployment (ARM64 smartphones and tablets) using Halium, Droidian, and AOSP OTA packages.

---

## Tool Overview

### 1. [`install-halium-droidian.sh`](install-halium-droidian.sh)
- **Purpose:** Deploys a GNU/Linux Halium and Droidian root filesystem onto an Android device.
- **Workflow:**
  1. Detects connected ADB/fastboot device and identifies the active slot (`_a` or `_b`).
  2. Pushes Debian/Droidian rootfs tarball to the device.
  3. Mounts `userdata` or logical partitions.
  4. Extracts rootfs while preserving Android vendor blobs and HAL drivers in `/vendor` and `/odm`.
  5. Configures systemd services for the LibreDroid sovereign desktop shell.

### 2. [`package-aosp-ota.sh`](package-aosp-ota.sh)
- **Purpose:** Compiles and packages standard AOSP/LineageOS-compatible OTA update ZIP archives.
- **Workflow:**
  1. Bundles `boot.img`, `system.new.dat.br`, `vendor.new.dat.br`, and updater-script.
  2. Generates cryptographic metadata and SHA-256 manifests.
  3. Signs the OTA archive with test-keys or production private keys using `signapk.jar`.
  4. Compatible with TWRP, OrangeFox, and standard AOSP recovery engines.

---

## Usage Examples

```bash
# Deploy Halium / Droidian rootfs to connected fastboot device
./installer/mobile/install-halium-droidian.sh --rootfs path/to/droidian-rootfs.tar.xz

# Package signed OTA update zip from build artifacts
./installer/mobile/package-aosp-ota.sh --version 1.0.0 --out libredroid-ota-1.0.0.zip
```
