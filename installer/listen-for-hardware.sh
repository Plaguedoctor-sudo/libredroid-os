#!/bin/bash
# ==============================================================================
# LibreDroid OS — Active Hardware Connection Listener
# Continuously listens on USB ports for Android / Fastboot handshakes.
# Useful for devices with broken screens or charging up from deep discharge.
# ==============================================================================

set -euo pipefail

export ANDROID_USER_HOME=/tmp/.android
export ANDROID_SDK_HOME=/tmp
export HOME=/tmp

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}==================================================================${NC}"
echo -e "${GREEN}${BOLD}  LibreDroid Active Hardware Listener (Broken Screen / Low Power)${NC}"
echo -e "${BLUE}${BOLD}==================================================================${NC}"
echo -e "Leave this running while your phone is plugged in or charging."
echo -e "As soon as the motherboard receives power, it will be detected.\n"

COUNT=0
while true; do
    COUNT=$((COUNT + 1))
    
    # Check Fastboot
    if fastboot devices 2>/dev/null | grep -q "fastboot"; then
        DEVICE_ID=$(fastboot devices | awk '{print $1}' | head -n 1)
        echo -e "\n\a${GREEN}${BOLD}✔ FASTBOOT HARDWARE DETECTED: [${DEVICE_ID}]${NC}"
        echo -e "Phone is in Fastboot mode and ready for Bare-Metal Flash!"
        echo -e "Run: ${YELLOW}./installer/flash-treble-device.sh${NC}"
        exit 0
    fi
    
    # Check ADB
    if timeout 2 adb devices 2>/dev/null | grep -w "device" >/dev/null; then
        DEVICE_ID=$(timeout 2 adb devices | grep -w "device" | awk '{print $1}' | head -n 1)
        echo -e "\n\a${GREEN}${BOLD}✔ ANDROID ADB HARDWARE DETECTED: [${DEVICE_ID}]${NC}"
        echo -e "Rebooting phone into Fastboot mode automatically..."
        timeout 5 adb reboot bootloader || true
        sleep 4
        echo -e "Now run: ${YELLOW}./installer/flash-treble-device.sh${NC}"
        exit 0
    fi
    
    # Check raw USB enumeration for Qualcomm / MediaTek / Samsung
    USB_MATCH=$(lsusb 2>/dev/null | grep -iE "google|samsung|qualcomm|mediatek|xiaomi|oneplus|android|05c6|04e8|18d1" || true)
    if [ -n "$USB_MATCH" ]; then
        echo -e "\n\a${GREEN}✔ USB Chipset Signal Detected:${NC} $USB_MATCH"
        sleep 2
    fi
    
    echo -ne "  ⏳ Monitoring USB ports... (Cycle #${COUNT})\r"
    sleep 2
done
