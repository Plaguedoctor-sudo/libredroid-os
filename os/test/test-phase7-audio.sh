#!/bin/bash
# ==============================================================================
# LibreDroid Phase 7 Automated Verification Test Suite
# Hardware Audio Routing & ALSA UCM2 Mobile Matrix
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

AUDIO_CTL="$REPO_ROOT/os/audio/lrd-audio"
UCM_ENTRY="$REPO_ROOT/os/build/config/includes.chroot/usr/share/alsa/ucm2/conf.d/LibreDroidMobile/LibreDroidMobile.conf"
UCM_MAIN="$REPO_ROOT/os/build/config/includes.chroot/usr/share/alsa/ucm2/LibreDroidMobile/LibreDroidMobile.conf"
UCM_HIFI="$REPO_ROOT/os/build/config/includes.chroot/usr/share/alsa/ucm2/LibreDroidMobile/HiFi.conf"
UCM_VOICE="$REPO_ROOT/os/build/config/includes.chroot/usr/share/alsa/ucm2/LibreDroidMobile/VoiceCall.conf"
PW_ECHO="$REPO_ROOT/os/build/config/includes.chroot/etc/pipewire/pipewire.conf.d/50-libredroid-echo-cancel.conf"
WP_POLICY="$REPO_ROOT/os/build/config/includes.chroot/etc/wireplumber/wireplumber.conf.d/60-libredroid-mobile-policy.conf"

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

echo "=== Running Phase 7 Mobile Audio Matrix Verification Suite ==="

# Check files exist
assert_ok "lrd-audio routing controller exists and executable" test -x "$AUDIO_CTL"
assert_ok "UCM2 conf.d entrypoint exists" test -f "$UCM_ENTRY"
assert_ok "UCM2 main profile definition exists" test -f "$UCM_MAIN"
assert_ok "UCM2 HiFi media profile exists" test -f "$UCM_HIFI"
assert_ok "UCM2 VoiceCall matrix exists" test -f "$UCM_VOICE"
assert_ok "PipeWire WebRTC echo cancel config exists" test -f "$PW_ECHO"
assert_ok "WirePlumber mobile audio focus policy exists" test -f "$WP_POLICY"

# Test UCM2 Profile 5 Acoustic Paths
test_ucm2_paths() {
    # Check Earpiece
    grep -q 'SectionDevice."Earpiece"' "$UCM_VOICE" && \
    # Check Loudspeaker
    grep -q 'SectionDevice."Speaker"' "$UCM_HIFI" && \
    # Check Primary Bottom Mic
    grep -q 'SectionDevice."Mic"' "$UCM_HIFI" && \
    # Check Top Noise Reduction Mic
    grep -q 'SectionDevice."TopMic"' "$UCM_HIFI" && \
    # Check 3.5mm Headphone Jack
    grep -q 'SectionDevice."Headphones"' "$UCM_HIFI"
}
assert_ok "ALSA UCM2 5-path mobile matrix (Earpiece, Speaker, Mic, TopMic, Headphones)" test_ucm2_paths

# Test PipeWire WebRTC AEC & Noise Suppression Configuration
test_pw_aec() {
    grep -q "libpipewire-module-echo-cancel" "$PW_ECHO" && \
    grep -q "webrtc.noise_suppression = true" "$PW_ECHO" && \
    grep -q "webrtc.extended_filter = true" "$PW_ECHO"
}
assert_ok "PipeWire WebRTC Echo Cancellation & Noise Suppression setup" test_pw_aec

# Test WirePlumber Focus Ducking and Bluetooth HFP
test_wp_policy() {
    grep -q "duck-level = 0.2" "$WP_POLICY" && \
    grep -q "hfp_hf" "$WP_POLICY" && \
    grep -q "enable-msbc = true" "$WP_POLICY"
}
assert_ok "WirePlumber audio focus ducking (0.2) and Bluetooth HFP/mSBC policy" test_wp_policy

# Test Dynamic Routing Switching
test_audio_routing() {
    "$AUDIO_CTL" route earpiece | grep -q "EARPIECE"
    local s1
    s1=$("$AUDIO_CTL" status)
    echo "$s1" | grep -q "Active Acoustic Route: earpiece"

    "$AUDIO_CTL" route speaker | grep -q "LOUDSPEAKER"
    local s2
    s2=$("$AUDIO_CTL" status)
    echo "$s2" | grep -q "Active Acoustic Route: speaker"

    "$AUDIO_CTL" route headset | grep -q "HEADSET"
    local s3
    s3=$("$AUDIO_CTL" status)
    echo "$s3" | grep -q "Active Acoustic Route: headset"

    "$AUDIO_CTL" route bluetooth | grep -q "BLUETOOTH"
    local s4
    s4=$("$AUDIO_CTL" status)
    echo "$s4" | grep -q "Active Acoustic Route: bluetooth"
}
assert_ok "Dynamic acoustic transducer route switching (Earpiece/Speaker/Headset/BT)" test_audio_routing

# Test Audio Focus Ducking State Toggle
test_ducking_toggle() {
    "$AUDIO_CTL" duck on | grep -q "DUCKING ACTIVE"
    local s1
    s1=$("$AUDIO_CTL" status)
    echo "$s1" | grep -q "Audio Focus Ducking:   true"

    "$AUDIO_CTL" duck off | grep -q "DUCKING RELEASED"
    local s2
    s2=$("$AUDIO_CTL" status)
    echo "$s2" | grep -q "Audio Focus Ducking:   false"
}
assert_ok "Audio focus ducking state toggle (voice call prioritization)" test_ducking_toggle

echo "=========================================================="
echo "Phase 7 Test Results: $PASSED passed, $FAILED failed."
echo "=========================================================="

if [ "$FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi
