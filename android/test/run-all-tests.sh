#!/usr/bin/env bash
# ==============================================================================
# LibreDroid Mobile OS — Master Verification Test Runner
# Verifies all mobile subsystems: Telephony, Sensors, Power, OSK, Translation
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOTAL=0
PASSED=0

echo "======================================================================"
echo "    LibreDroid Mobile OS — Subsystem Verification Test Harness       "
echo "======================================================================"

for test_script in \
    "$SCRIPT_DIR/test-telephony.sh" \
    "$SCRIPT_DIR/test-sensors.sh" \
    "$SCRIPT_DIR/test-power.sh" \
    "$SCRIPT_DIR/test-osk.sh" \
    "$SCRIPT_DIR/test-arm-translation.sh"; do
    if [ -x "$test_script" ]; then
        TOTAL=$((TOTAL + 1))
        echo ""
        echo ">>> Executing $(basename "$test_script")..."
        if "$test_script"; then
            PASSED=$((PASSED + 1))
        else
            echo "FAILED: $(basename "$test_script")"
        fi
    fi
done

echo ""
echo "======================================================================"
echo "Mobile OS Test Verification Summary: $PASSED / $TOTAL test suites passed."
echo "======================================================================"

if [ "$PASSED" -eq "$TOTAL" ]; then
    echo "✔ ALL MOBILE SUBSYSTEMS VERIFIED AND OPERATIONAL."
    exit 0
else
    echo "❌ Some mobile test suites failed."
    exit 1
fi
