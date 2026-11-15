# LibreDroid OS — Bare-Metal Installation Guide

This document describes how to deploy, partition, boot, and install **LibreDroid OS** directly onto bare-metal hardware without host dependencies or hypervisors.

---

## 1. Supported Hardware Classes

| Architecture | Boot Mode | Primary Targets | Status |
|---|---|---|---|
| **x86_64** | UEFI (SecureBoot / Open) | Laptops, Desktops, Appliances, Intel/AMD Workstations | **Production Ready** |
| **x86_64** | Legacy BIOS (MBR) | Older x86_64 PC hardware | **Production Ready** |
| **ARM64** | Extlinux / U-Boot | PinePhone Pro, MNT Reform, Raspberry Pi 5 | **Production Ready** |
| **ARM64** | Android Fastboot / Halium | Project Treble GSI (MT6789, SDM845, SM8150) | **Production Ready** |

---

## 2. Generating the Installation Media

### A. Compile the Hybrid Live ISO (x86_64)
Run the automated image builder from repository root:
```bash
./installer/build-iso.sh --version 1.0.0 --out libredroid-universal-x86_64.iso
```
The resulting ISO is a hybrid bootable medium conforming to ISO 9660 + El Torito + GPT/MBR hybrid boot specifications.

### B. Write to USB Installation Media
Write the image directly to a block device (e.g. `/dev/sdX`):
```bash
# Locate USB device
lsblk -o NAME,SIZE,MODEL,TRAN

# Write raw image with sync
sudo dd if=libredroid-universal-x86_64.iso of=/dev/sdX bs=4M status=progress conv=fsync
```

---

## 3. Booting the Live Media

### Prerequisites
1. **Disable Secure Boot**: The v0.1 live ISO is currently unsigned. Secure Boot must be disabled in target UEFI settings.
2. **Flash USB with Full Readback Verification**:
   ```bash
   ISO="out/libredroid-universal-x86_64.iso"
   sha256sum "$ISO"
   sudo dd if="$ISO" of=/dev/sdX bs=4M status=progress conv=fsync
   sync

   # Verify write integrity across exact byte length of the ISO
   sudo head -c "$(stat -c%s "$ISO")" /dev/sdX | sha256sum
   ```
   Both SHA256 hashes must match byte-for-byte.

### Boot Menu Options
1. **LibreDroid Live (safe mode)**:
   Passes `nomodeset systemd.unit=multi-user.target`. Use this option on initial boot to verify hardware initialization without graphics crashes.
   - Reaches text console `login:` on `tty1` / `ttyS0`.
   - Inspect GPU kernel driver binding: `lspci -k | grep -A3 -E 'VGA|3D|Display'`
   - Inspect firmware loading status: `dmesg | grep -iE 'firmware|drm|i915|amdgpu|nouveau' | head -30`
   - Inspect Wi-Fi / Ethernet status: `ip link`
2. **LibreDroid Live**:
   Standard production boot.
   - Graphical kiosk session launches on `tty7` (`cage` + `chromium`).
   - Debug consoles remain accessible via `tty1` (Ctrl+Alt+F1) and serial `ttyS0`.
   - Health check gate ensures bridge responds on port 3001 before Chromium is launched.

Insert the USB drive into target hardware and select it from the BIOS/UEFI boot menu (F11 / F12 / Del).

### Live GRUB2 Boot Menu Options:
1. **LibreDroid OS Universal (Live Session - Try without installing)**:
   - Mounts compressed SquashFS rootfs to RAM via overlayfs.
   - Preserves underlying hard drives untouched.
   - Spawns Wayland compositor and sovereign shell.
2. **LibreDroid OS Universal (Copy to RAM - Fast Live Mode)**:
   - Copies SquashFS entire image into physical RAM (`toram`).
   - Allows unplugging USB stick post-boot.
3. **Install LibreDroid OS to Hard Disk (Guided Installer)**:
   - Boots directly into `lrd-install` automated partitioner and installer.
4. **LibreDroid OS (Safe Graphics Mode - Nomodeset)**:
   - Disables kernel KMS modesetting for legacy or conflicting GPU drivers.

---

## 4. Bare-Metal Hard Disk Installation (`lrd-install`)

From either the live session terminal or by selecting option 3 at boot:
```bash
sudo lrd-install
```

### Partitioning Layouts

#### Option 1: Single Partition Layout (`--layout single`)
Ideal for laptops and standard PCs:
- Partition 1: `ESP` (512 MB, FAT32, `/boot/efi`, flags: `boot,esp`)
- Partition 2: `Rootfs` (Remainder of drive, Ext4, `/`)
- Optional LUKS2 Argon2id encryption on partition 2 (`--luks 1`)

#### Option 2: A/B dm-verity Immutable Partition Layout (`--layout ab`)
Ideal for enterprise, security appliances, and smartphones:
- Partition 1: `ESP` (512 MB, FAT32, `/boot/efi`)
- Partition 2: `system_a` (Read-only SquashFS with dm-verity hash tree)
- Partition 3: `system_b` (Inactive update slot for zero-downtime atomic upgrades)
- Partition 4: `userdata` (LUKS2 encrypted writable state, mounted at `/var`, `/home`)

### Installation Command-Line Examples:
```bash
# Non-interactive automated install with LUKS2 encryption
sudo lrd-install \
  --auto \
  --yes \
  --disk /dev/nvme0n1 \
  --layout single \
  --luks 1 \
  --hostname sovereign-node \
  --username lrd \
  --password "SecurePassphrase123"

# A/B dm-verity deployment on SATA drive
sudo lrd-install \
  --auto \
  --disk /dev/sda \
  --layout ab \
  --recovery 1
```

---

## 5. Post-Installation First Boot & Verification

1. Power off machine, remove installation media, and power on.
2. GRUB / systemd-boot boots directly from target drive into LibreDroid OS.
3. First-boot provisioning service (`lrd-provision`) executes if not pre-configured.
4. Run the automated hardware acceptance and integrity suite:
```bash
# Full acceptance verification test
lrd-verify

# Subsystem diagnostics
lrd-doctor

# Hardware adaptation inspection
lrd-hwcheck
```
