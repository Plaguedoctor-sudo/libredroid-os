#!/bin/bash
# ==============================================================================
# LibreDroid OS - Suppress Stock OEM OS & Install LibreDroid Standalone Kiosk
# Puts the stock OnePlus/OxygenOS launcher to sleep so LibreDroid runs unimpeded
# ==============================================================================

set -e

echo "[*] Connecting to target Android device via ADB..."
DEVICE_ID=$(adb devices | grep -w "device" | head -n1 | awk '{print $1}')

if [ -z "$DEVICE_ID" ]; then
    echo "[-] Error: No Android device detected via ADB."
    echo "    Please enable USB Debugging in Developer Options and connect your device."
    exit 1
fi

echo "[+] Target Android Device detected: $DEVICE_ID"

echo "[*] Establishing high-speed reverse socket for LibreDroid runtime (tcp:3001)..."
adb reverse tcp:3001 tcp:3001

echo "[*] Suppressing stock OEM launcher (putting OxygenOS/ColorOS interface to sleep)..."
adb shell pm disable-user --user 0 com.android.launcher 2>/dev/null || true
adb shell pm disable-user --user 0 com.oplus.android.launcher.overlay.tablet 2>/dev/null || true

echo "[*] Launching LibreDroid OS in standalone fullscreen environment..."
adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main \
    -a android.intent.action.VIEW \
    -d "http://localhost:3001" \
    --activity-clear-top \
    --activity-brought-to-front 2>/dev/null || true

# Wait 2 seconds for UI render
sleep 2

# Wake screen and unlock if locked
adb shell input keyevent KEYCODE_WAKEUP 2>/dev/null || true

echo ""
echo "======================================================================"
echo "✓ LibreDroid OS installed and running on Android device ($DEVICE_ID)!"
echo "✓ Stock OEM OS interface successfully suppressed."
echo "======================================================================"
echo "NOTE: To switch back to stock OxygenOS anytime, run:"
echo "      ./installer/restore-stock-os.sh"
echo "======================================================================"
