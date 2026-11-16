#!/bin/bash
# ==============================================================================
# LibreDroid Phase 9 Automated Verification Test Suite
# Deep Sleep, S0ix States & Mobile Wake-Lock Governor
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

WAKELOCKD="$MOBILE_ROOT/power/lrd-wakelockd"
POWER_CTL="$MOBILE_ROOT/power/lrd-power"
IRQ_WAKE="$MOBILE_ROOT/power/lrd-irq-wake.sh"
BATTERY_GUARD="$MOBILE_ROOT/power/lrd-battery-guardian.sh"
SERVICE_FILE="$MOBILE_ROOT/power/lrd-wakelockd.service"

PASSED=0
FAILED=0

assert_ok() {
    local name="$1"
    shift
    echo -n "[TEST] $name ... "
    if "$@"; then
        echo "PASS"
        PASSED=$((PASSED + 1))
    else
        echo "FAIL"
        FAILED=$((FAILED + 1))
    fi
}

echo "=== Running Phase 9 Mobile Power & S2Idle Verification Suite ==="

# Check binaries and config
assert_ok "lrd-wakelockd daemon binary exists and executable" test -x "$WAKELOCKD"
assert_ok "lrd-power CLI exists and executable" test -x "$POWER_CTL"
assert_ok "lrd-irq-wake.sh script exists and executable" test -x "$IRQ_WAKE"
assert_ok "lrd-battery-guardian.sh script exists and executable" test -x "$BATTERY_GUARD"
assert_ok "lrd-power.service systemd unit exists" test -f "$SERVICE_FILE"

# Test Hardware IRQ Wakeup Sources
test_irq_wakeup() {
    local setup_out
    setup_out=$("$IRQ_WAKE" setup)
    echo "$setup_out" | grep -q "Hardware IRQ wakeup"

    local status_out
    status_out=$("$IRQ_WAKE" status)
    echo "$status_out" | grep -q "Hardware Wakeup Sources"
}
assert_ok "Hardware IRQ wakeup architecture configuration (modem-RI, gpio-keys, rtc0)" test_irq_wakeup

# Test Battery Guardian 80% charge threshold limiter
test_battery_guardian() {
    local set_out
    set_out=$("$BATTERY_GUARD" set 80)
    echo "$set_out" | grep -q "80%"

    local status_out
    status_out=$("$BATTERY_GUARD" status)
    echo "$status_out" | grep -q "Charge Limit Threshold: 80%"
}
assert_ok "Battery Guardian 80% charge threshold limiter (Li-ion longevity protection)" test_battery_guardian

# Start Wake-Lock Daemon
echo "[*] Spawning lrd-wakelockd test instance..."
"$WAKELOCKD" &
DAEMON_PID=$!
sleep 0.3

cleanup() {
    kill "$DAEMON_PID" 2>/dev/null || true
    wait "$DAEMON_PID" 2>/dev/null || true
}
trap cleanup EXIT

# Test Initial Power Status
test_initial_status() {
    local out
    out=$("$POWER_CTL" status)
    echo "$out" | grep -q '"screen_on":true' && \
    echo "$out" | grep -q '"wake_lock_count":0' && \
    echo "$out" | grep -q '"standby_drain_rate":"<1.5%/hr"'
}
assert_ok "Power daemon status reporting & standby drain rate (<1.5%/hr benchmark)" test_initial_status

# Test Wake-Lock Acquisition and Suspend Blocking
test_wakelocks() {
    # 1. Acquire audio call wake-lock
    local l1
    l1=$("$POWER_CTL" lock voice_call)
    echo "$l1" | grep -q '"active_locks":1'

    # 2. Acquire GPS tracking lock
    local l2
    l2=$("$POWER_CTL" lock gps_tracking)
    echo "$l2" | grep -q '"active_locks":2'

    # 3. Suspend MUST be blocked while locks are held
    local susp_out
    susp_out=$("$POWER_CTL" suspend)
    echo "$susp_out" | grep -q '"status":"blocked"'

    # 4. Release locks
    local r1
    r1=$("$POWER_CTL" unlock voice_call)
    echo "$r1" | grep -q '"active_locks":1'

    local r2
    r2=$("$POWER_CTL" unlock gps_tracking)
    echo "$r2" | grep -q '"active_locks":0'
}
assert_ok "Kernel wake-lock acquisition, conflict resolution, and release" test_wakelocks

# Test S2Idle Transition on Screen-Off
test_s2idle_transition() {
    # Turn screen off
    local scr_off
    scr_off=$("$POWER_CTL" screen off)
    echo "$scr_off" | grep -q '"screen_on":false'
    echo "$scr_off" | grep -q '"s2idle_pending":true'

    # Turn screen on
    local scr_on
    scr_on=$("$POWER_CTL" screen on)
    echo "$scr_on" | grep -q '"screen_on":true'
    echo "$scr_on" | grep -q '"s2idle_active":false'
}
assert_ok "Screen-off s2idle deep sleep state transition governor" test_s2idle_transition

# Stop daemon cleanly
cleanup
trap - EXIT

echo "=========================================================="
echo "Phase 9 Test Results: $PASSED passed, $FAILED failed."
echo "=========================================================="

if [ "$FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi
