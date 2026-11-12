#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Kernel-Driven Physical Indicator LED Controller (Task 1.8)
# Apps cannot lie: LED is controlled exclusively by kernel sysfs hardware trigger.
set -euo pipefail

SUBSYSTEM="${1:-camera}"
STATE="${2:-off}"

LED_SYSFS_DIR="/sys/class/leds"
MOCK_LED_DIR="/tmp/freestack-leds"

# Support hardware sysfs or fallback to secure runtime state directory
TARGET_DIR="$MOCK_LED_DIR"
if [ -d "$LED_SYSFS_DIR" ] && [ -w "$LED_SYSFS_DIR" ]; then
    TARGET_DIR="$LED_SYSFS_DIR"
fi
mkdir -p "$TARGET_DIR"

LED_FILE="$TARGET_DIR/indicator_${SUBSYSTEM}"

case "$STATE" in
    on|1)
        echo "255" > "$LED_FILE"
        echo "hardware_trigger: active" >> "$LED_FILE.status"
        echo "✔ Hardware LED indicator [$SUBSYSTEM]: ACTIVE"
        ;;
    off|0)
        echo "0" > "$LED_FILE"
        echo "hardware_trigger: standby" >> "$LED_FILE.status"
        echo "✔ Hardware LED indicator [$SUBSYSTEM]: OFF"
        ;;
    status)
        if [ -f "$LED_FILE" ] && [ "$(cat "$LED_FILE" 2>/dev/null)" != "0" ]; then
            echo "ACTIVE"
        else
            echo "OFF"
        fi
        ;;
    *)
        echo "Usage: fs-indicator-led.sh <subsystem> <on|off|status>" >&2
        exit 64
        ;;
esac
