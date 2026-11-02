#!/bin/bash
set -e

export ANDROID_USER_HOME="${ANDROID_USER_HOME:-/tmp/.android}"
export ANDROID_SDK_HOME="${ANDROID_SDK_HOME:-/tmp}"

echo "[*] Ensuring ADB reverse tunnel on port 3001..."
adb reverse tcp:3001 tcp:3001

echo "[*] Checking device encryption status..."
while true; do
    STATE=$(adb shell dumpsys user 2>/dev/null | grep -E "Started users state:" || true)
    if echo "$STATE" | grep -q "RUNNING_UNLOCKED"; then
        echo "[+] Device credential storage UNLOCKED!"
        break
    fi
    echo "[...] Waiting for user to unlock tablet screen (currently RUNNING_LOCKED)..."
    sleep 2
done

sleep 1

echo "[*] Establishing reverse port forward tcp:3001..."
adb reverse tcp:3001 tcp:3001

echo "[*] Launching LibreDroid Shell in browser on tablet..."
adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main -d "http://localhost:3001" 2>/dev/null || \
adb shell am start -a android.intent.action.VIEW -d "http://localhost:3001" 2>/dev/null || \
adb shell am start -n com.brave.browser/com.google.android.apps.chrome.Main -d "http://localhost:3001" 2>/dev/null || true

echo "[+] Done! LibreDroid Shell launched on screen."
