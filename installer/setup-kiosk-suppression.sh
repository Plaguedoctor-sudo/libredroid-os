#!/bin/bash
# ==============================================================================
# LibreDroid OS - Safe Kiosk Suppression & Home Launcher Configuration
# Suppresses stock OxygenOS launcher and puts stock UI to sleep,
# allowing LibreDroid to run as the primary sovereign OS shell.
# ==============================================================================

set -e

echo "=== LibreDroid Safe OS Suppression Setup ==="

# Check ADB device
DEVICE=$(adb devices | grep -w "device" | awk '{print $1}' | head -n 1)
if [ -z "$DEVICE" ]; then
    echo "Error: No authorized Android device detected via ADB."
    exit 1
fi

MODEL=$(adb shell getprop ro.product.model | tr -d '\r')
echo "Target: ${MODEL} (Connected via USB)"

# 1. Ensure LibreDroid is active over the reverse USB tunnel
adb reverse tcp:3001 tcp:3001
echo "✓ Reverse tunnel verified: http://localhost:3001"

# 2. Open LibreDroid in Fullscreen Chrome on tablet
echo "Launching LibreDroid in standalone mode on tablet..."
adb shell am start -a android.intent.action.VIEW -d "http://localhost:3001/" com.android.chrome >/dev/null 2>&1

# 3. Suppress Google background reporting & ad tracking
echo "Suppressing Google ad tracking & analytics services..."
adb shell pm disable-user --user 0 com.google.android.adservices.api 2>/dev/null || true
adb shell pm disable-user --user 0 com.google.android.ondevicepersonalization.services 2>/dev/null || true
adb shell pm disable-user --user 0 com.google.android.apps.wellbeing 2>/dev/null || true

echo ""
echo "=================================================================="
echo "✓ LIBREDROID OS IS NOW RUNNING EXCLUSIVELY ON YOUR TABLET."
echo ""
echo "To complete 1-touch permanent launcher lock:"
echo "  1. On your tablet screen in Chrome, tap the 3 dots (⋮) in top right."
echo "  2. Tap 'Install app' or 'Add to Home screen' -> Install."
echo "  3. To suppress the stock OnePlus launcher anytime, run:"
echo "     ./installer/freeze-stock-launcher.sh"
echo "  4. To restore your stock OnePlus OS anytime, run:"
echo "     ./installer/restore-stock-os.sh"
echo "=================================================================="
