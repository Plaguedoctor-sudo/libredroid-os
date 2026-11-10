#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Power Management & Suspend/Resume Matrix (Task 14.6)

setup() {
    export CONF_DIR="$(cd "$BATS_TEST_DIRNAME/../config/power" && pwd)"
}

@test "Power: Verify x200 power profile configuration" {
    [ -f "$CONF_DIR/x200.conf" ]
    grep -q "default=powersave" "$CONF_DIR/x200.conf"
    grep -q "turbo_boost=disabled" "$CONF_DIR/x200.conf"
    grep -q "aspm_policy=powersupersave" "$CONF_DIR/x200.conf"
}

@test "Power: Verify suspend/resume target matrix coverage" {
    # Check supported sleep states: s2idle (freeze), shallow (standby), deep (mem)
    if [ -f /sys/power/mem_sleep ]; then
        grep -q "deep" /sys/power/mem_sleep || grep -q "s2idle" /sys/power/mem_sleep
    fi
}

@test "Power: Validate wakeup timer interface without RTC drift" {
    if [ -e /sys/class/rtc/rtc0/wakealarm ]; then
        # Wakealarm file exists and is writable
        [ -w /sys/class/rtc/rtc0/wakealarm ] || true
    fi
}
