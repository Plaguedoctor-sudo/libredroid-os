#!/bin/bash
# ==============================================================================
# LibreDroid OS - Restore Stock OxygenOS / ColorOS
# Re-enables the stock launcher and returns your tablet to normal
# ==============================================================================

set -e

echo "Restoring stock OnePlus OxygenOS interface..."
adb shell pm enable com.android.launcher 2>/dev/null || true
adb shell pm enable com.oplus.android.launcher.overlay.tablet 2>/dev/null || true

# Re-launch stock launcher
adb shell am start -a android.intent.action.MAIN -c android.intent.category.HOME 2>/dev/null || true

echo "✓ Stock OxygenOS launcher re-enabled and active."
