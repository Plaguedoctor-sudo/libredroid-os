#!/usr/bin/env bash
set -e

export ANDROID_USER_HOME="/home/nitin/fkgugal/.adb"
export ANDROID_SDK_HOME="/home/nitin/fkgugal/.adb"
export HOME="/home/nitin/fkgugal/.adb"

echo "=== Fastboot Auto-Rescue Listener Active ==="
echo "Waiting for device to connect in Fastboot mode..."

while true; do
  DEV=$(fastboot devices 2>/dev/null | awk '{print $1}' | head -n 1)
  if [ -n "$DEV" ]; then
    echo "Device detected: $DEV"
    echo "Checking current slot..."
    fastboot getvar current-slot || true
    echo "Switching active slot back to slot b (Stock Android)..."
    fastboot set_active b || true
    echo "Checking slot again..."
    fastboot getvar current-slot || true
    echo "Rebooting device into stock OS..."
    fastboot reboot || true
    echo "SUCCESS: Device set to slot b and rebooted!"
    exit 0
  fi
  sleep 0.5
done
