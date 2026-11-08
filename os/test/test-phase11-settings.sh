#!/bin/bash
# ==============================================================================
# LibreDroid Phase 11 Automated Verification Test Suite
# Native System Settings & Connectivity Suite
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

WIFI_CTL="$REPO_ROOT/os/settings/net/lrd-wifi"
BT_CTL="$REPO_ROOT/os/settings/bluetooth/lrd-bluetooth"
DISPLAY_CTL="$REPO_ROOT/os/settings/display/lrd-display"
SECURITY_CTL="$REPO_ROOT/os/settings/security/lrd-security"
SETTINGS_HUB="$REPO_ROOT/os/settings/lrd-settings"
PKG_LIST="$REPO_ROOT/os/build/config/package-lists/libredroid.list.chroot"

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

echo "=== Running Phase 11 Settings & Connectivity Verification Suite ==="

# Check scripts exist
assert_ok "lrd-wifi script exists and executable" test -x "$WIFI_CTL"
assert_ok "lrd-bluetooth script exists and executable" test -x "$BT_CTL"
assert_ok "lrd-display script exists and executable" test -x "$DISPLAY_CTL"
assert_ok "lrd-security script exists and executable" test -x "$SECURITY_CTL"
assert_ok "lrd-settings hub exists and executable" test -x "$SETTINGS_HUB"
assert_ok "Package manifest contains fprintd and libpam-fprintd" grep -q "fprintd" "$PKG_LIST"
assert_ok "Package manifest contains systemd-timesyncd" grep -q "systemd-timesyncd" "$PKG_LIST"

# Test Wi-Fi Manager
test_wifi() {
    "$WIFI_CTL" scan | grep -q "SSID"
    "$WIFI_CTL" connect "LibreDroid-TestNet" "Secret123" | grep -q "Successfully connected"
    "$WIFI_CTL" portal | grep -q '"captive_portal":false'
    "$WIFI_CTL" hotspot "TestHotspot" "Key999" | grep -q "active on 192.168.43.1"
    "$WIFI_CTL" hotspot-stop | grep -q "deactivated"
}
assert_ok "Wi-Fi scanning, connection, captive portal check, and hotspot tethering" test_wifi

# Test Bluetooth Manager
test_bluetooth() {
    "$BT_CTL" scan | grep -q "Device"
    "$BT_CTL" pair "00:1A:7D:DA:71:13" | grep -q "Successfully paired"
    "$BT_CTL" profile "00:1A:7D:DA:71:13" hfp | grep -q "profile set to: hfp"
    "$BT_CTL" profile "00:1A:7D:DA:71:13" a2dp | grep -q "profile set to: a2dp"
    "$BT_CTL" status | grep -q "a2dp_sink"
}
assert_ok "Bluetooth scanning, trusted pairing, and A2DP/HFP profile selection" test_bluetooth

# Test Wayland HiDPI Display & Scale Controller
test_display() {
    "$DISPLAY_CTL" scale 1.5 | grep -q "Display scale applied: 1.5x"
    "$DISPLAY_CTL" refresh 120 | grep -q "Refresh rate switched: 120Hz"
    local st
    st=$("$DISPLAY_CTL" status)
    echo "$st" | grep -q '"scale": 1.5'
    echo "$st" | grep -q '"refresh_hz": 120'
}
assert_ok "Wayland HiDPI display scaling (1.5x) and mobile refresh rate (120Hz)" test_display

# Test Security, Time & Biometrics
test_security() {
    "$SECURITY_CTL" time-sync | grep -q "NTP time synchronization active"
    "$SECURITY_CTL" set-pin 9876 | grep -q "PIN successfully set"
    local pin_verify
    pin_verify=$("$SECURITY_CTL" verify-pin 9876)
    echo "$pin_verify" | grep -q '"authenticated":true'
    "$SECURITY_CTL" enroll-fprint right-index | grep -q "enrolled successfully"
    local fprint_verify
    fprint_verify=$("$SECURITY_CTL" verify-fprint)
    echo "$fprint_verify" | grep -q '"authenticated":true'
}
assert_ok "NTP timesync, lockscreen PIN verification, and fingerprint authentication" test_security

# Test Unified Settings Hub
test_hub() {
    local hub_out
    hub_out=$("$SETTINGS_HUB" status)
    echo "$hub_out" | grep -q "LibreDroid Wi-Fi Status"
    echo "$hub_out" | grep -q "LibreDroid Bluetooth Status"
    echo "$hub_out" | grep -q "LibreDroid Wayland HiDPI Display Status"
    echo "$hub_out" | grep -q "LibreDroid Security & Biometrics Status"
}
assert_ok "Unified lrd-settings hub status aggregation" test_hub

echo "=========================================================="
echo "Phase 11 Test Results: $PASSED passed, $FAILED failed."
echo "=========================================================="

if [ "$FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi
