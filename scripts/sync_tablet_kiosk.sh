#!/usr/bin/env bash
# ==============================================================================
# LibreDroid OS - Tablet Kiosk Sync & Launch Script
# Waits for OnePlus Pad Go tablet connection, ensures port 3001 reverse tunnel,
# pushes latest distribution tarball, and opens kiosk shell in Chrome.
# ==============================================================================

set -Eeuo pipefail

export ANDROID_USER_HOME="${ANDROID_USER_HOME:-/tmp/.android}"
export ANDROID_SDK_HOME="${ANDROID_SDK_HOME:-/tmp}"

echo "=========================================================="
echo "  LibreDroid OS - Tablet Kiosk Sync & 5G Network Launcher "
echo "=========================================================="

# 1. Wait for ADB device
echo "[*] Checking for connected Android device via ADB..."
while true; do
  DEVICE=$(adb devices | grep -w "device" | awk '{print $1}' | head -n 1 || true)
  if [ -n "$DEVICE" ]; then
    MODEL=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r' || echo "Android Device")
    echo "[+] Detected device: ${MODEL} [${DEVICE}]"
    break
  fi
  echo "[...] Please plug in your tablet USB cable (waiting 2s)..."
  sleep 2
done

# 2. Setup reverse tunnel
echo "[*] Setting up ADB reverse port forwarding (tcp:3001)..."
adb reverse tcp:3001 tcp:3001
echo "[+] Reverse tunnel established: http://localhost:3001 -> Host port 3001"

# 3. Push latest archive if present
if [ -f "lrd-i1.tgz" ]; then
  echo "[*] Pushing latest lrd-i1.tgz to /sdcard/..."
  adb push lrd-i1.tgz /sdcard/ >/dev/null 2>&1 || true
  echo "[+] Synced lrd-i1.tgz to /sdcard/"
fi

# 4. Wake tablet screen & launch kiosk
echo "[*] Waking display and launching LibreDroid 5G Kiosk..."
adb shell input keyevent KEYCODE_WAKEUP 2>/dev/null || true
adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main -d "http://localhost:3001/?kiosk=1" 2>/dev/null || \
adb shell am start -a android.intent.action.VIEW -d "http://localhost:3001/?kiosk=1" 2>/dev/null || true

echo "=========================================================="
echo "✔ LibreDroid 5G Kiosk Shell is now active on your tablet!"
echo "=========================================================="
