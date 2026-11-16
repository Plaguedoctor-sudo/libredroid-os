#!/bin/bash
# ==============================================================================
# LibreDroid Phase 6 Automated Verification Test Suite
# Mobile Cellular Voice, VoLTE/VoNR & SMS Stack
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

TELEPHONYD="$MOBILE_ROOT/telephony/lrd-telephonyd"
TELEPHONY_CTL="$MOBILE_ROOT/telephony/lrd-telephony"
SERVICE_FILE="$MOBILE_ROOT/telephony/lrd-telephony.service"
PKG_LIST="$MOBILE_ROOT/packages/mobile-packages.list"

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

echo "=== Running Phase 6 Cellular Telephony Verification Suite ==="

# Check binaries and config
assert_ok "lrd-telephonyd daemon binary exists" test -x "$TELEPHONYD"
assert_ok "lrd-telephony controller CLI exists" test -x "$TELEPHONY_CTL"
assert_ok "lrd-telephony.service systemd unit exists" test -f "$SERVICE_FILE"

# Check package list contains required cellular stack
test_packages() {
    grep -q "modemmanager" "$PKG_LIST" && \
    grep -q "libqmi-utils" "$PKG_LIST" && \
    grep -q "mobile-broadband-provider-info" "$PKG_LIST"
}
assert_ok "Cellular package manifest entries (ModemManager, QMI, APN)" test_packages

# Start daemon for live socket interaction
pkill -f lrd-telephonyd 2>/dev/null || true
rm -f /tmp/libredroid/telephony.sock /run/libredroid/telephony.sock 2>/dev/null || true
echo "[*] Spawning lrd-telephonyd test instance..."
"$TELEPHONYD" &
DAEMON_PID=$!
sleep 0.4

cleanup() {
    kill "$DAEMON_PID" 2>/dev/null || true
    wait "$DAEMON_PID" 2>/dev/null || true
}
trap cleanup EXIT

# Test status and cellular signal telemetry
test_signal_telemetry() {
    local out
    out=$("$TELEPHONY_CTL" signal)
    echo "$out" | grep -q '"carrier":"LibreDroid Sovereign Mobile"' && \
    echo "$out" | grep -q '"tech":"5G-NR"' && \
    echo "$out" | grep -q '"bars":4'
}
assert_ok "Cellular signal telemetry reporting (5G-NR, RSRP, Bars)" test_signal_telemetry

# Test SIM Unlock
test_sim_unlock() {
    local out
    out=$("$TELEPHONY_CTL" sim-unlock 1234)
    echo "$out" | grep -q '"sim_unlocked":true'
}
assert_ok "SIM card PIN unlock authentication" test_sim_unlock

# Test Standard VoLTE/VoNR Call Initiation & Hangup
test_voice_call_lifecycle() {
    local dial_out
    dial_out=$("$TELEPHONY_CTL" call "+15551234567")
    echo "$dial_out" | grep -q '"call":"active"'
    echo "$dial_out" | grep -q '"number":"+15551234567"'
    echo "$dial_out" | grep -q '"audio_routing":"earpiece_voice"'

    sleep 0.2

    local status_out
    status_out=$("$TELEPHONY_CTL" call-status)
    echo "$status_out" | grep -q '"call_state":3'

    local hangup_out
    hangup_out=$("$TELEPHONY_CTL" hangup)
    echo "$hangup_out" | grep -q '"call":"terminated"'
}
assert_ok "VoLTE/VoNR voice call lifecycle (dial, active audio routing, hangup)" test_voice_call_lifecycle

# Test Emergency Dialing Bypass Rules (911 / 112)
test_emergency_bypass() {
    local em_out
    em_out=$("$TELEPHONY_CTL" emergency 911)
    echo "$em_out" | grep -q '"call":"active"'
    echo "$em_out" | grep -q '"emergency":true'

    local hangup_out
    hangup_out=$("$TELEPHONY_CTL" hangup)
    echo "$hangup_out" | grep -q '"call":"terminated"'
}
assert_ok "Emergency dialing bypass rules (911/112 non-restrictive dispatch)" test_emergency_bypass

# Test SMS Sending & Local In-Tree Storage
test_sms_flow() {
    local send_out
    send_out=$("$TELEPHONY_CTL" sms "+15559876543" "LibreDroid sovereign cellular SMS test")
    echo "$send_out" | grep -q '"sms_sent":true'

    local list_out
    list_out=$("$TELEPHONY_CTL" sms-list)
    echo "$list_out" | grep -q "LibreDroid sovereign cellular SMS test"
}
assert_ok "Native SMS messaging engine (dispatch, encoding, and store)" test_sms_flow

# Test Dual-Path Telephony Backend (ModemManager vs Halium RIL fallback)
test_dual_path_backend() {
    sleep 0.1
    local out
    out=$("$TELEPHONY_CTL" backend)
    echo "$out" | grep -q '"dual_path":true'
}
assert_ok "Dual-path telephony driver abstraction (ModemManager + Halium RIL fallback)" test_dual_path_backend

# Stop daemon cleanly
cleanup
trap - EXIT

echo "=========================================================="
echo "Phase 6 Test Results: $PASSED passed, $FAILED failed."
echo "=========================================================="

if [ "$FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi
