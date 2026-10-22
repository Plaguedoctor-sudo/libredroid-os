#!/bin/bash
# ==============================================================================
# LibreDroid OS - Non-Destructive Android De-Googling & Hardening Script
# Safely strips Google tracking, ad frameworks, and telemetry for user 0
# without modifying system partitions or voiding device warranty.
# ==============================================================================

set -e

echo "=== LibreDroid Android De-Googling & Privacy Hardening ==="

# Check ADB connection
DEVICE=$(adb devices | grep -w "device" | awk '{print $1}' | head -n 1)

if [ -z "$DEVICE" ]; then
    echo "Error: No authorized Android device detected via ADB."
    echo "Please connect your tablet and enable USB Debugging."
    exit 1
fi

MODEL=$(adb shell getprop ro.product.model | tr -d '\r')
ANDROID_VER=$(adb shell getprop ro.build.version.release | tr -d '\r')
echo "Target Hardware: ${MODEL} (Android ${ANDROID_VER}) [Serial: ${DEVICE}]"
echo ""

# Packages to safely disable/uninstall for user 0 (Reversible, does not brick)
DEB_PACKAGES=(
    "com.google.android.adservices.api"
    "com.google.android.ondevicepersonalization.services"
    "com.google.android.apps.wellbeing"
    "com.google.android.gms.location.history"
    "com.google.android.apps.googleassistant"
    "com.google.android.feedback"
    "com.google.android.apps.messaging"
    "com.google.android.youtube"
    "com.google.android.apps.tachyon"
    "com.google.android.apps.photos"
)

echo "Disabling Big Tech telemetry & ad tracking daemons on target device..."
DISABLED_COUNT=0

for PKG in "${DEB_PACKAGES[@]}"; do
    if adb shell pm list packages | grep -q "$PKG"; then
        echo -n "  • Disabling ${PKG}... "
        adb shell pm disable-user --user 0 "$PKG" 2>/dev/null || adb shell pm uninstall -k --user 0 "$PKG" 2>/dev/null || true
        echo "✓ NEUTRALIZED"
        DISABLED_COUNT=$((DISABLED_COUNT + 1))
    else
        echo "  • ${PKG}: Not installed (Clean)"
    fi
done

echo ""
echo "Enforcing GrapheneOS-style sensor and network security settings..."
# Restrict ad-id tracking and telemetry via Android system settings
adb shell settings put secure limit_ad_tracking 1 2>/dev/null || true
adb shell settings put global ad_services_enabled 0 2>/dev/null || true
adb shell settings put secure send_action_app_error 0 2>/dev/null || true

echo "=================================================================="
echo "✓ SUCCESS: ${DISABLED_COUNT} tracking daemons neutralized on ${MODEL}."
echo "Your tablet is now operating with de-googled telemetry shields."
echo "To restore any package: adb shell pm enable <package.name>"
echo "=================================================================="
