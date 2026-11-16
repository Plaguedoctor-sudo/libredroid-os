#!/usr/bin/env bash
# ==============================================================================
# LibreDroid Mobile OS — Dualboot & A/B Slot Manager
# Target: Seamless Dual-Booting Android and LibreDroid on A/B Devices
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}       LibreDroid Mobile OS — Dual-Boot & A/B Slot Manager            ${NC}"
echo -e "${CYAN}======================================================================${NC}"

if ! command -v fastboot >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] fastboot command not found.${NC}"
    exit 1
fi

DEVICE=$(fastboot devices | head -n 1)
if [ -z "$DEVICE" ]; then
    echo -e "${RED}[ERROR] No device detected in fastboot mode.${NC}"
    echo "Connect device in fastboot/bootloader mode and rerun."
    exit 1
fi

SERIAL=$(echo "$DEVICE" | awk '{print $1}')
echo -e "${GREEN}[+] Device:${NC} $SERIAL"

# Check slot capabilities
SLOT_SUPPORT=$(fastboot getvar has-slot:system 2>&1 | grep "has-slot:system" | awk '{print $2}' || echo "no")
if [ "$SLOT_SUPPORT" != "yes" ]; then
    echo -e "${RED}[!] Device does not support A/B seamless slots.${NC}"
    echo "This device uses traditional single-slot (A-only) partition layout."
    exit 1
fi

CURRENT_SLOT=$(fastboot getvar current-slot 2>&1 | grep "current-slot" | awk '{print $2}' || echo "unknown")
SLOT_A_SUCCESS=$(fastboot getvar slot-successful:a 2>&1 | grep "slot-successful:a" | awk '{print $2}' || echo "unknown")
SLOT_B_SUCCESS=$(fastboot getvar slot-successful:b 2>&1 | grep "slot-successful:b" | awk '{print $2}' || echo "unknown")
SLOT_A_UNBOOT=$(fastboot getvar slot-unbootable:a 2>&1 | grep "slot-unbootable:a" | awk '{print $2}' || echo "unknown")
SLOT_B_UNBOOT=$(fastboot getvar slot-unbootable:b 2>&1 | grep "slot-unbootable:b" | awk '{print $2}' || echo "unknown")

echo -e "\n${BOLD}Partition Slot Telemetry:${NC}"
echo "----------------------------------------"
echo "  Active Slot:         $CURRENT_SLOT"
echo "  Slot [A] Booted OK:  $SLOT_A_SUCCESS (unbootable: $SLOT_A_UNBOOT)"
echo "  Slot [B] Booted OK:  $SLOT_B_SUCCESS (unbootable: $SLOT_B_UNBOOT)"
echo "----------------------------------------"

INACTIVE_SLOT="b"
if [ "$CURRENT_SLOT" = "b" ]; then
    INACTIVE_SLOT="a"
fi

echo -e "\n${BOLD}Available Actions:${NC}"
echo "  1) Switch active slot to A"
echo "  2) Switch active slot to B"
echo "  3) Toggle active slot (switch from $CURRENT_SLOT to $INACTIVE_SLOT)"
echo "  4) Install LibreDroid Mobile OS to INACTIVE slot ($INACTIVE_SLOT) [Dual-boot preservation]"
echo "  5) Reboot device"
echo "  6) Exit"
echo ""

read -rp "Select option [1-6]: " OPTION

case "$OPTION" in
    1)
        echo -e "\n${CYAN}[*] Setting active slot to A...${NC}"
        fastboot --set-active=a
        echo -e "${GREEN}[+] Active slot is now A.${NC}"
        ;;
    2)
        echo -e "\n${CYAN}[*] Setting active slot to B...${NC}"
        fastboot --set-active=b
        echo -e "${GREEN}[+] Active slot is now B.${NC}"
        ;;
    3)
        echo -e "\n${CYAN}[*] Toggling active slot to $INACTIVE_SLOT...${NC}"
        fastboot --set-active="$INACTIVE_SLOT"
        echo -e "${GREEN}[+] Active slot is now $INACTIVE_SLOT.${NC}"
        ;;
    4)
        IMAGE="${MOBILE_DIR}/output/libredroid-mobile-arm64-treble.img"
        if [ ! -f "$IMAGE" ]; then
            if [ -f "${MOBILE_DIR}/treble/output/libredroid-arm64-treble-system.img" ]; then
                IMAGE="${MOBILE_DIR}/treble/output/libredroid-arm64-treble-system.img"
            fi
        fi

        if [ ! -f "$IMAGE" ]; then
            echo -e "${RED}[ERROR] LibreDroid system image not found at $IMAGE.${NC}"
            echo "Build it first with: ${MOBILE_DIR}/build.sh"
            exit 1
        fi

        echo -e "\n${YELLOW}>>> Dual-Boot Safe Installation <<<${NC}"
        echo "This will flash LibreDroid Mobile OS directly to slot: system_${INACTIVE_SLOT}"
        echo "Your current slot (${CURRENT_SLOT}) running stock Android will remain untouched!"
        echo ""
        read -rp "Confirm installation to slot ${INACTIVE_SLOT}? [y/N]: " CF
        if [[ "$CF" =~ ^[Yy]$ ]]; then
            echo -e "\n${CYAN}[*] Flashing system_${INACTIVE_SLOT}...${NC}"
            fastboot flash "system_${INACTIVE_SLOT}" "$IMAGE"
            echo -e "${GREEN}[+] Successfully flashed to system_${INACTIVE_SLOT}.${NC}"
            
            read -rp "Switch active slot to ${INACTIVE_SLOT} and boot LibreDroid now? [y/N]: " SW_BOOT
            if [[ "$SW_BOOT" =~ ^[Yy]$ ]]; then
                fastboot --set-active="$INACTIVE_SLOT"
                fastboot reboot
                echo "Rebooting into LibreDroid Mobile OS on slot ${INACTIVE_SLOT}!"
            else
                echo "Active slot remains ${CURRENT_SLOT}. You can switch anytime."
            fi
        fi
        ;;
    5)
        fastboot reboot
        echo "Rebooting..."
        ;;
    6)
        echo "Exiting."
        exit 0
        ;;
    *)
        echo "Invalid selection."
        exit 1
        ;;
esac
