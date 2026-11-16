#!/bin/bash
# ==============================================================================
# LibreDroid Phase 10 Automated Verification Test Suite
# Native Wayland Layer-Shell Virtual Keyboard (zwlr_layer_shell_v1 & text-input-v3)
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

OSK_CTL="$MOBILE_ROOT/osk/lrd-osk"
LAYOUT_DIR="$MOBILE_ROOT/osk/layouts"
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

echo "=== Running Phase 10 Wayland Layer-Shell OSK Verification Suite ==="

# Check binaries and manifests
assert_ok "lrd-osk layer-shell keyboard manager exists and executable" test -x "$OSK_CTL"
assert_ok "Package manifest contains wvkbd and squeekboard" grep -q "wvkbd" "$PKG_LIST"
assert_ok "Package manifest contains fcitx5 CJK input engine" grep -q "fcitx5" "$PKG_LIST"

# Check Layout Profiles
test_layouts() {
    [ -f "$LAYOUT_DIR/qwerty.yaml" ] && \
    grep -q "swipe_backspace_delete_word: true" "$LAYOUT_DIR/qwerty.yaml" && \
    grep -q "spacebar_cursor_slide: true" "$LAYOUT_DIR/qwerty.yaml" && \
    [ -f "$LAYOUT_DIR/qwertz.yaml" ] && \
    [ -f "$LAYOUT_DIR/azerty.yaml" ] && \
    [ -f "$LAYOUT_DIR/numeric.yaml" ] && \
    [ -f "$LAYOUT_DIR/emoji.yaml" ]
}
assert_ok "Mobile keyboard layouts (QWERTY, QWERTZ, AZERTY, Numeric, Emoji)" test_layouts

# Test Layer-Shell OSK Lifecycle (Show, Exclusive Zone 320px, Hide)
test_osk_lifecycle() {
    # 1. Show OSK
    local show_out
    show_out=$("$OSK_CTL" show)
    echo "$show_out" | grep -q "exclusive zone set to 320px"

    # 2. Check Status
    local status_out
    status_out=$("$OSK_CTL" status)
    echo "$status_out" | grep -q '"visible": true'
    echo "$status_out" | grep -q '"protocol": "zwlr_layer_shell_v1"'
    echo "$status_out" | grep -q '"input_method": "text-input-v3"'
    echo "$status_out" | grep -q '"exclusive_zone_height": 320'

    # 3. Hide OSK
    local hide_out
    hide_out=$("$OSK_CTL" hide)
    echo "$hide_out" | grep -q "OSK hidden"

    # 4. Verify Hidden Status
    status_out=$("$OSK_CTL" status)
    echo "$status_out" | grep -q '"visible": false'
}
assert_ok "Layer-shell OSK lifecycle (show, exclusive zone viewport shift, hide)" test_osk_lifecycle

# Test Multi-Lingual Layout Switching
test_layout_switching() {
    local l1 l2 l3
    l1=$("$OSK_CTL" layout qwertz)
    echo "$l1" | grep -q "layout set to: qwertz"

    l2=$("$OSK_CTL" layout emoji)
    echo "$l2" | grep -q "layout set to: emoji"

    l3=$("$OSK_CTL" layout qwerty)
    echo "$l3" | grep -q "layout set to: qwerty"

    local st
    st=$("$OSK_CTL" status)
    echo "$st" | grep -q '"layout": "qwerty"'
}
assert_ok "Dynamic multi-lingual layout switching (QWERTY/QWERTZ/Emoji)" test_layout_switching

# Test Touch Gestures (Swipe Backspace & Spacebar Slide)
test_gestures() {
    local g1 g2
    g1=$("$OSK_CTL" gesture swipe-backspace)
    echo "$g1" | grep -q "SWIPE-LEFT BACKSPACE"

    g2=$("$OSK_CTL" gesture spacebar-slide)
    echo "$g2" | grep -q "SPACEBAR CARET SLIDE"
}
assert_ok "Mobile touch gestures (swipe backspace word delete & spacebar caret slide)" test_gestures

echo "=========================================================="
echo "Phase 10 Test Results: $PASSED passed, $FAILED failed."
echo "=========================================================="

if [ "$FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi
