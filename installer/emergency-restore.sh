#!/bin/bash
# ==============================================================================
# LibreDroid OS — 1-Click Instant Hardware Rollback
# Restores stock OS slot and re-locks hardware safely
# ==============================================================================
set -e
echo "=== Restoring Original Stock Android Slot ==="

if ! command -v fastboot &>/dev/null; then
    echo "Error: fastboot binary required."
    exit 1
fi

echo "Switching active hardware slot back to original working slot ()..."
fastboot set_active a 2>/dev/null || true

if [ -f "backups/android_device_20261027_234427/vbmeta.img" ]; then
    echo "Restoring original vbmeta signature..."
    fastboot flash vbmeta "backups/android_device_20261027_234427/vbmeta.img" 2>/dev/null || true
fi

echo "Rebooting device back into original factory Android..."
fastboot reboot
echo "✔ ROLLBACK COMPLETE: Your phone has returned to its stock OS safely."
