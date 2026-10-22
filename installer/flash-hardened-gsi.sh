#!/bin/bash
# ==============================================================================
# LibreDroid OS - Generic System Image (GSI) Hardened AOSP Flasher
# Guides & flashes a de-Googled Treble GSI to replace stock vendor Android.
# ==============================================================================

set -e

echo "=== LibreDroid De-Googled AOSP / GSI Flashing Tool ==="

# 1. Verify Fastboot / ADB state
if ! command -v fastboot &>/dev/null; then
    echo "Error: fastboot binary not found. Please install android-tools-fastboot."
    exit 1
fi

echo "Checking connected device bootloader state..."
LOCKED_STATE=$(adb shell getprop ro.boot.flash.locked 2>/dev/null | tr -d '\r')

if [ "$LOCKED_STATE" = "1" ]; then
    echo "=================================================================="
    echo "ATTENTION: Device Bootloader is currently [LOCKED]."
    echo ""
    echo "To flash a de-Googled AOSP ROM / GSI onto bare hardware, follow these"
    echo "prerequisite steps first:"
    echo "  1. On your OnePlus Pad: Settings -> About -> Tap 'Build Number' 7 times."
    echo "  2. Go to Settings -> Developer Options -> Enable 'OEM Unlocking'."
    echo "  3. Reboot into fastboot: adb reboot bootloader"
    echo "  4. Run: fastboot flashing unlock"
    echo "  5. Confirm unlock on device screen with Volume keys (Wipes user data)."
    echo "=================================================================="
    exit 1
fi

echo "Device is unlocked. Checking for Fastboot connection..."
if fastboot devices | grep -q "fastboot"; then
    echo "Device detected in Fastboot mode."
    
    GSI_IMAGE="$1"
    if [ -z "$GSI_IMAGE" ] || [ ! -f "$GSI_IMAGE" ]; then
        echo "Usage: $0 <path_to_degoogled_gsi_system.img>"
        echo "Example: $0 ./system-arm64-ab-vanilla.img"
        exit 1
    fi

    echo "Flashing Hardened De-Googled GSI to system partition..."
    fastboot flash system "$GSI_IMAGE"
    fastboot --disable-verity --disable-verification flash vbmeta vbmeta.img || true
    fastboot reboot
    echo "✓ Flashing complete! Rebooting into de-googled AOSP."
else
    echo "No fastboot device found. Run: adb reboot bootloader"
fi
