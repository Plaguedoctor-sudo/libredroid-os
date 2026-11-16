#!/bin/bash
# ==============================================================================
# LibreDroid Phase 8 Automated Verification Test Suite
# Camera ISP Pipeline (libcamera) & Linux IIO Sensor Suite
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SENSORD="$MOBILE_ROOT/sensors/lrd-sensord"
SENSOR_CTL="$MOBILE_ROOT/sensors/lrd-sensor"
CAM_CTL="$MOBILE_ROOT/camera/lrd-cam"
HAPTICS_CTL="$MOBILE_ROOT/hardware/lrd-haptics"
SERVICE_FILE="$MOBILE_ROOT/sensors/lrd-sensord.service"
TUNING_DIR="$MOBILE_ROOT/camera/tuning"

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

echo "=== Running Phase 8 Camera ISP & Sensor Suite Verification Suite ==="

# Check binaries and config
assert_ok "lrd-sensord daemon binary exists and executable" test -x "$SENSORD"
assert_ok "lrd-sensor CLI exists and executable" test -x "$SENSOR_CTL"
assert_ok "lrd-cam camera manager exists and executable" test -x "$CAM_CTL"
assert_ok "lrd-haptics vibrator controller exists and executable" test -x "$HAPTICS_CTL"
assert_ok "lrd-sensors.service systemd unit exists" test -f "$SERVICE_FILE"

# Check camera tuning profiles
test_camera_tuning() {
    [ -f "$TUNING_DIR/imx-sensor.yaml" ] && \
    grep -q "Sony IMX Mobile Sensor" "$TUNING_DIR/imx-sensor.yaml" && \
    [ -f "$TUNING_DIR/isocell-sensor.yaml" ] && \
    grep -q "Samsung ISOCELL Mobile Sensor" "$TUNING_DIR/isocell-sensor.yaml"
}
assert_ok "Libcamera MIPI-CSI2 sensor tuning profiles (IMX & ISOCELL 3A calibration)" test_camera_tuning

# Test lrd-cam listing and synthetic frame capture
test_cam_capture() {
    local list_out
    list_out=$("$CAM_CTL" list)
    echo "$list_out" | grep -q "Sensors"

    local cap_file="/tmp/libredroid/test_frame.jpg"
    rm -f "$cap_file" "${cap_file%.jpg}.ppm"
    "$CAM_CTL" capture "$cap_file" >/dev/null
    [ -f "$cap_file" ] || [ -f "${cap_file%.jpg}.ppm" ]
}
assert_ok "Camera controller status and frame capture pipeline" test_cam_capture

# Start Sensor Daemon
echo "[*] Spawning lrd-sensord test instance..."
"$SENSORD" &
DAEMON_PID=$!
sleep 0.3

cleanup() {
    kill "$DAEMON_PID" 2>/dev/null || true
    wait "$DAEMON_PID" 2>/dev/null || true
}
trap cleanup EXIT

# Test Sensor Daemon initial status
test_sensor_initial_status() {
    local out
    out=$("$SENSOR_CTL" status)
    echo "$out" | grep -q '"orientation":"normal"' && \
    echo "$out" | grep -q '"ambient_light"' && \
    echo "$out" | grep -q '"compass"'
}
assert_ok "Linux IIO Sensor Daemon status reporting" test_sensor_initial_status

# Test Accelerometer Auto-Rotation
test_auto_rotation() {
    local r1 r2 r3
    r1=$("$SENSOR_CTL" rotate left-up)
    echo "$r1" | grep -q '"orientation":"left-up"'

    r2=$("$SENSOR_CTL" rotate bottom-up)
    echo "$r2" | grep -q '"orientation":"bottom-up"'

    r3=$("$SENSOR_CTL" rotate normal)
    echo "$r3" | grep -q '"orientation":"normal"'
}
assert_ok "Accelerometer dynamic display auto-rotation matrix" test_auto_rotation

# Test Proximity Sensor Ear Screen-Blanking
test_proximity_blanking() {
    # Near ear (held to ear during call) -> Screen Blanked
    local p_near
    p_near=$("$SENSOR_CTL" proximity near)
    echo "$p_near" | grep -q '"proximity_near":true'
    echo "$p_near" | grep -q '"screen_blanked":true'

    # Far from ear -> Screen Restored
    local p_far
    p_far=$("$SENSOR_CTL" proximity far)
    echo "$p_far" | grep -q '"proximity_near":false'
    echo "$p_far" | grep -q '"screen_blanked":false'
}
assert_ok "Proximity sensor ear detection & screen blanking safety switch" test_proximity_blanking

# Test Ambient Light Sensor (ALS) Auto-Brightness
test_als_brightness() {
    # Dark room (< 15 lux) -> 15% brightness
    local b_dark
    b_dark=$("$SENSOR_CTL" lux 5)
    echo "$b_dark" | grep -q '"brightness_pct":15'

    # Bright outdoors (1000 lux) -> 80% brightness
    local b_bright
    b_bright=$("$SENSOR_CTL" lux 1000)
    echo "$b_bright" | grep -q '"brightness_pct":80'
}
assert_ok "Ambient Light Sensor (ALS) smooth auto-brightness scaling" test_als_brightness

# Test Magnetometer Compass
test_compass() {
    local comp_out
    comp_out=$("$SENSOR_CTL" compass 270)
    echo "$comp_out" | grep -q '"heading_deg":270'
}
assert_ok "Magnetometer azimuth heading calculation (compass)" test_compass

# Stop daemon cleanly
cleanup
trap - EXIT

# Test Haptics Controller
test_haptics() {
    "$HAPTICS_CTL" tap | grep -q "Haptic pulse dispatched"
    "$HAPTICS_CTL" status | grep -q "Last Haptic Event:      tap"

    "$HAPTICS_CTL" ring | grep -q "Haptic pulse dispatched"
    "$HAPTICS_CTL" status | grep -q "Last Haptic Event:      ring"
}
assert_ok "Haptic Feedback & Vibrator HAL (virtual typing tap & call rhythm)" test_haptics

echo "=========================================================="
echo "Phase 8 Test Results: $PASSED passed, $FAILED failed."
echo "=========================================================="

if [ "$FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi
