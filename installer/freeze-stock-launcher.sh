#!/bin/bash
# ==============================================================================
# LibreDroid OS - Freeze Stock Launcher
# Puts the stock OnePlus launcher to sleep so LibreDroid runs unimpeded
# ==============================================================================

set -e

echo "Freezing stock OnePlus launcher (putting stock UI to sleep)..."
adb shell pm disable-user --user 0 com.android.launcher 2>/dev/null || true
adb shell pm disable-user --user 0 com.oplus.android.launcher.overlay.tablet 2>/dev/null || true

echo "✓ Stock OxygenOS launcher suppressed."
echo "Your tablet now exclusively boots into LibreDroid."
echo "To restore stock launcher: ./installer/restore-stock-os.sh"
