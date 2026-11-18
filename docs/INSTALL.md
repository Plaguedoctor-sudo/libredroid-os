# LibreMobile OS — Installation & Flashing Guide

**Release Version:** 1.0-RC  
**Supported Platforms:** Volla Phone X23 (`vidofnir`), OnePlus Pad Go (`OP5DA6L1`)

---

## 1. Prerequisites

Before flashing LibreMobile OS, ensure your host computer has the necessary fastboot and USB tools installed:

```bash
# Debian / Ubuntu / Linux Mint
sudo apt install android-tools-fastboot android-tools-adb xz-utils jq

# Fedora
sudo dnf install android-tools xz jq

# Arch Linux
sudo pacman -S android-tools xz jq
```

### OEM Bootloader Unlock
1. On your device running stock Android, navigate to:
   **Settings → About Phone → Tap 'Build Number' 7 times** to unlock Developer Options.
2. Go to **Settings → System → Developer Options**:
   - Enable **OEM Unlocking**.
   - Enable **USB Debugging**.
3. Connect the device via USB to your host computer.
4. Reboot into Fastboot mode:
   ```bash
   adb reboot bootloader
   ```
5. Confirm fastboot communication:
   ```bash
   fastboot devices
   ```
6. Unlock the bootloader:
   ```bash
   fastboot flashing unlock
   # Confirm on device screen using Volume Up + Power
   ```

---

## 2. Flashing LibreMobile OS

### Automated Factory Flashing
Extract the release bundle for your target device and run the universal installer:

```bash
# For Volla Phone X23
tar -xf libremobile-1.0-rc-vidofnir.tar.xz
cd vidofnir
./flash.sh

# For OnePlus Pad Go
tar -xf libremobile-1.0-rc-OP5DA6L1.tar.xz
cd OP5DA6L1
./flash.sh
```

### Dry-Run Pre-Flight Check
To simulate the flashing process without modifying any device partitions:

```bash
./flash.sh --dry-run
```

### Manual Fastboot Flashing Steps
If you prefer flashing partition by partition:

```bash
# Determine active slot (usually 'a' or 'b')
fastboot getvar current-slot

# Flash Halium kernel and initramfs to active slot (e.g., slot a)
fastboot flash boot_a boot.img

# Flash vendor boot partition (contains display panel DTB and kernel drivers)
fastboot flash vendor_boot_a vendor_boot.img

# Set slot active and reboot
fastboot set_active a
fastboot reboot
```

---

## 3. Emergency MTK BROM Unbrick Recovery

If an interrupted flash causes the device not to boot into fastboot, recovery is guaranteed via the MediaTek BROM safety harness:

1. Power off device completely.
2. Run the recovery tool:
   ```bash
   ./scripts/mtk-brom-recovery.sh restore-stock OP5DA6L1
   ```
3. Hold **Volume Up + Volume Down** simultaneously and plug in the USB cable.
4. The BROM harness bypasses Android bootloader security and flashes factory firmware directly to eMMC/UFS storage.
