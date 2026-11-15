# LibreDroid OS — Bare-Metal & Hardware Installer Suite

The `installer/` directory provides production deployment tools for flashing and installing **LibreDroid OS** across bare-metal workstations, laptops (x86_64 UEFI/BIOS), and mobile handsets (Project Treble ARM64 & Android Halium).

---

## Tool Index

### 1. Bare-Metal x86_64 Installation
| Script | Description |
|---|---|
| [`build-iso.sh`](build-iso.sh) | Assembles the hybrid UEFI + BIOS dual-bootable live ISO (`libredroid-universal-x86_64.iso`) with SquashFS rootfs, Linux kernel, and GRUB2 bootloader. |
| [`bare-metal-safety-guard.sh`](bare-metal-safety-guard.sh) | Hardware safety validator: checks battery reserves, validates CPU architecture, performs pre-flash partition backups, and guarantees anti-rollback (ARB) safety. |
| [`emergency-restore.sh`](emergency-restore.sh) | Disaster recovery and unbrick utility to revert any device to baseline stock firmware. |

### 2. Mobile & Project Treble Flashing
| Script | Description |
|---|---|
| [`flash-treble-device.sh`](flash-treble-device.sh) | Universal Project Treble flasher: dynamically resizes partitions, disables dm-verity, and flashes system/boot images to the inactive slot. |
| [`flash-hardened-gsi.sh`](flash-hardened-gsi.sh) | Flashes security-hardened GSI images with zero Google Play services. |
| [`flash-samsung-m14.sh`](flash-samsung-m14.sh) | Tailored installer for Samsung Exynos/MediaTek devices using ODIN/LOKE protocol. |
| [`flash-fresh-stock-os.sh`](flash-fresh-stock-os.sh) | Flashes a fresh, unpolluted stock ROM directly from official firmware images. |
| [`restore-stock-os.sh`](restore-stock-os.sh) | Fast slot switcher returning the device to slot A with factory firmware. |
| [`listen-for-hardware.sh`](listen-for-hardware.sh) | Event-driven hardware detector that triggers automated provisioning upon USB attachment in bootloader/fastboot/EDL mode. |

### 3. Runtime Hardening & Container Setup
| Script | Description |
|---|---|
| [`degoogle-android.sh`](degoogle-android.sh) | Uninstalls 100+ telemetry packages, Google Mobile Services (GMS), and carrier spyware via ADB/pm. |
| [`freeze-stock-launcher.sh`](freeze-stock-launcher.sh) | Freezes OEM stock launchers and sets LibreDroid Sovereign Shell as default. |
| [`setup-kiosk-suppression.sh`](setup-kiosk-suppression.sh) | Locks device into dedicated sovereign kiosk mode, suppressing navigation bars and notification drawers. |
| [`setup-play-integrity-widevine.sh`](setup-play-integrity-widevine.sh) | Provisions PIF fingerprint spoofing and DRM keybox translation for certified app compatibility. |
| [`waydroid-setup.sh`](waydroid-setup.sh) | Configures the Waydroid LXC container bridge with binder IPC on Linux hosts. |

---

## Quick Start: Bare-Metal Live ISO Build & Installation

### Step 1: Build the Hybrid Live ISO
```bash
./installer/build-iso.sh --version 1.0.0 --out libredroid-universal-x86_64.iso
```

### Step 2: Write to USB Installation Drive
```bash
# Verify target drive node carefully (e.g. /dev/sdX)
sudo dd if=libredroid-universal-x86_64.iso of=/dev/sdX bs=4M status=progress conv=fsync
```

### Step 3: Boot on Target Machine
Boot the target x86_64 laptop or PC in either UEFI or Legacy BIOS mode:
- **Live Session**: Boots into live SquashFS RAM desktop without modifying disk.
- **Guided Bare-Metal Installer**: Select *"Install LibreDroid OS to Hard Disk"* in the GRUB menu or execute `sudo lrd-install` in the terminal to partition disk (single or A/B dm-verity), enable LUKS2 encryption, and install GRUB EFI/BIOS.
