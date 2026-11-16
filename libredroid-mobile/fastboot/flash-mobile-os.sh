#!/usr/bin/env bash
# ==============================================================================
# LibreDroid Mobile OS — Fastboot Flashing Utility
# Target: ARM64 Project Treble Devices (Qualcomm, MediaTek, Exynos, Tensor)
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"
IMAGE_PATH="${1:-${MOBILE_DIR}/output/libredroid-mobile-arm64-treble.img}"

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}    LibreDroid Mobile OS — Fastboot Flash Tool (Android Successor)   ${NC}"
echo -e "${CYAN}======================================================================${NC}"

# 1. Dependency check
if ! command -v fastboot >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] 'fastboot' utility is not installed.${NC}"
    echo "Install via: sudo apt install android-tools-fastboot (or platform-tools)"
    exit 1
fi

# 2. Check for image
if [ ! -f "$IMAGE_PATH" ]; then
    # Fallback to treble directory if output does not exist
    if [ -f "${MOBILE_DIR}/treble/output/libredroid-arm64-treble-system.img" ]; then
        IMAGE_PATH="${MOBILE_DIR}/treble/output/libredroid-arm64-treble-system.img"
    elif [ -f "${MOBILE_DIR}/build/libredroid-mobile-arm64-treble.img" ]; then
        IMAGE_PATH="${MOBILE_DIR}/build/libredroid-mobile-arm64-treble.img"
    else
        echo -e "${YELLOW}[!] Image not found at: $IMAGE_PATH${NC}"
        echo "Run '${MOBILE_DIR}/build.sh' first to compile the OS system image."
        exit 1
    fi
fi

echo -e "${GREEN}[+] System image located: ${IMAGE_PATH}${NC}"
IMAGE_SIZE=$(du -h "$IMAGE_PATH" | cut -f1)
echo "    Size: $IMAGE_SIZE"

# 3. Detect connected fastboot device
echo -e "\n${CYAN}[*] Searching for fastboot devices...${NC}"
DEVICE=$(fastboot devices | head -n 1)
if [ -z "$DEVICE" ]; then
    echo -e "${RED}[ERROR] No device detected in fastboot mode.${NC}"
    echo "Instructions:"
    echo "  1. Turn off your device."
    echo "  2. Hold [Volume Down] + [Power] to enter Fastboot / Bootloader mode."
    echo "  3. Connect via high-quality USB-C cable."
    echo "  4. (For dynamic partitions / fastbootd): Run 'fastboot reboot fastboot'"
    exit 1
fi

SERIAL=$(echo "$DEVICE" | awk '{print $1}')
echo -e "${GREEN}[+] Device detected:${NC} Serial: $SERIAL"

# 4. Check device properties
echo -e "\n${CYAN}[*] Querying device partition topology...${NC}"
SLOT_A_B=$(fastboot getvar has-slot:system 2>&1 | grep "has-slot:system" | awk '{print $2}' || echo "no")
CURRENT_SLOT=$(fastboot getvar current-slot 2>&1 | grep "current-slot" | awk '{print $2}' || echo "")
IS_FASTBOOTD=$(fastboot getvar is-userspace 2>&1 | grep "is-userspace" | awk '{print $2}' || echo "no")
PRODUCT_NAME=$(fastboot getvar product 2>&1 | grep "product" | awk '{print $2}' || echo "unknown")

echo "    Product:      $PRODUCT_NAME"
echo "    Fastbootd:    $IS_FASTBOOTD"
echo "    A/B Slots:    $SLOT_A_B"
if [ -n "$CURRENT_SLOT" ]; then
    echo "    Current Slot: $CURRENT_SLOT"
fi

if [ "$IS_FASTBOOTD" != "yes" ]; then
    echo -e "${YELLOW}[!] Warning: Device is in Bootloader mode, not fastbootd (userspace fastboot).${NC}"
    echo "    On Android 10+ devices with Dynamic Partitions (super), flashing to 'system'"
    echo "    requires fastbootd. If flashing fails, execute:"
    echo "    fastboot reboot fastboot"
fi

# 5. Determine target partition
TARGET_PARTITION="system"
if [ "$SLOT_A_B" = "yes" ] && [ -n "$CURRENT_SLOT" ]; then
    TARGET_PARTITION="system_${CURRENT_SLOT}"
fi

echo -e "\n${YELLOW}>>> PRE-FLASH CONFIRMATION <<<${NC}"
echo "    Target partition: $TARGET_PARTITION"
echo "    Image to flash:   $IMAGE_PATH"
echo "    Device Serial:    $SERIAL"
echo ""

read -rp "Proceed with flashing LibreDroid Mobile OS? [y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Flashing cancelled."
    exit 0
fi

# 6. Android Verified Boot (AVB) / Verity Check
echo -e "\n${CYAN}[*] Step 1: Disabling Android Verified Boot (AVB 2.0 / DM-Verity)...${NC}"
if [ -f "${MOBILE_DIR}/avb/vbmeta.img" ]; then
    echo "    Flashing custom vbmeta with disabled verification..."
    fastboot flash --disable-verity --disable-verification vbmeta "${MOBILE_DIR}/avb/vbmeta.img" || true
else
    echo "    Applying --disable-verity / --disable-verification flags if supported..."
fi

# 7. Flash system image
echo -e "\n${CYAN}[*] Step 2: Flashing LibreDroid Mobile OS image to ${TARGET_PARTITION}...${NC}"
fastboot flash "$TARGET_PARTITION" "$IMAGE_PATH"

# 8. Userdata wipe option (Factory reset for clean OS transition)
echo -e "\n${CYAN}[*] Step 3: Storage Formatting${NC}"
read -rp "Perform wipe of userdata/cache for clean boot? [recommended: Y] [y/N]: " WIPE_CONFIRM
if [[ "$WIPE_CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Formatting userdata..."
    fastboot -w || {
        echo "fastboot -w failed, trying manual wipe..."
        fastboot erase userdata || true
        fastboot erase cache || true
    }
fi

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}    Flashing Complete! LibreDroid Mobile OS is installed.            ${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo ""
read -rp "Reboot device into LibreDroid Mobile OS now? [Y/n]: " REBOOT_CONFIRM
if [[ ! "$REBOOT_CONFIRM" =~ ^[Nn]$ ]]; then
    fastboot reboot
    echo "Rebooting device..."
fi
