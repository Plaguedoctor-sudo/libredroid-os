#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Continuous Integration Quality Gate
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== FreeStack CI Verification Gate ==="
cd "$FS_ROOT" || exit 1

echo "[1/7] Manifest & Rule Conformance..."
python3 tools/fsbuild/fsbuild.py manifest verify
python3 tools/fsbuild/fsbuild.py schema validate
python3 tools/fsbuild/fsbuild.py rules check

echo "[2/7] Hash & Lock Verification..."
python3 tools/fsbuild/fsbuild.py verify-hashes

echo "[3/7] Target Rootfs Staging..."
python3 tools/fsbuild/fsbuild.py stage --target x200-libreboot --profile native

echo "[4/7] Python Integration & Security Tests..."
pytest tests/test_freestack.py

echo "[5/7] Bats Constitutional Rules (R1-R14), Behavioural (A1-A15), & Attenuation Suites..."
bash tests/run-bats.sh tests/rules.bats
bash tests/run-bats.sh tests/behaviour.bats
bash tests/run-bats.sh tests/attenuation.bats

# Guard Metrics Verification Stage
ASSERT_COUNT=$(grep -cE '^\s*(assert|run )' tests/rules.bats tests/behaviour.bats tests/attenuation.bats | awk -F: '{s+=$2} END {print s}')
REFUTE_COUNT=$(grep -cE 'refute|!\s' tests/behaviour.bats tests/attenuation.bats | awk -F: '{s+=$2} END {print s}')
echo "    -> Total Assert/Run statements: $ASSERT_COUNT"
echo "    -> Behavioural & Attenuation Negative assertions (refute / !): $REFUTE_COUNT"
if [ "$REFUTE_COUNT" -lt 16 ]; then
    echo "FAIL: Negative assertions count ($REFUTE_COUNT) is below mandatory bar 16!" >&2
    exit 1
fi

echo "[6/7] Fuzzing Smoke Triage..."
bash fuzz/soak-triage.sh quick

echo "[7/7] Multi-Party Independent Reproducibility & Diffoscope Verification..."
bash .ci/repro-verify.sh

echo "✔ All FreeStack CI quality gates passed successfully."
