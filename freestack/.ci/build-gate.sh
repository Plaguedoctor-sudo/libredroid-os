#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Continuous Integration Quality Gate
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== FreeStack CI Verification Gate ==="
cd "$FS_ROOT" || exit 1

echo "[1/6] Manifest & Rule Conformance..."
python3 tools/fsbuild/fsbuild.py manifest verify
python3 tools/fsbuild/fsbuild.py schema validate
python3 tools/fsbuild/fsbuild.py rules check

echo "[2/6] Hash & Lock Verification..."
python3 tools/fsbuild/fsbuild.py verify-hashes

echo "[3/6] Target Rootfs Staging..."
python3 tools/fsbuild/fsbuild.py stage --target x200-libreboot --profile native

echo "[4/6] Python Integration & Security Tests..."
pytest tests/test_freestack.py

echo "[5/6] Bats Constitutional Rules (R1-R14) & Behavioural (A1-A14) Suites..."
bash tests/run-bats.sh tests/rules.bats
bash tests/run-bats.sh tests/behaviour.bats

# Guard Metrics Verification Stage
ASSERT_COUNT=$(grep -cE '^\s*(assert|run )' tests/rules.bats tests/behaviour.bats | awk -F: '{s+=$2} END {print s}')
REFUTE_COUNT=$(grep -cE 'refute|!\s' tests/behaviour.bats)
echo "    -> Total Assert/Run statements: $ASSERT_COUNT"
echo "    -> Behavioural Negative assertions (refute / !): $REFUTE_COUNT"
if [ "$REFUTE_COUNT" -lt 5 ]; then
    echo "FAIL: Negative assertions count ($REFUTE_COUNT) is below minimum bar 5!" >&2
    exit 1
fi

echo "[6/6] Fuzzing Smoke Triage..."
bash fuzz/soak-triage.sh quick

echo "✔ All FreeStack CI quality gates passed successfully."
