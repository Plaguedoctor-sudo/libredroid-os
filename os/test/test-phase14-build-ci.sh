#!/bin/bash
# ==============================================================================
# LibreDroid Phase 14 Automated Verification Test Suite
# Unified Production Build Harness (lrd-make) & Automated QEMU CI Matrix
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

LRD_MAKE="$REPO_ROOT/os/build/lrd-make"
QEMU_TEST="$REPO_ROOT/os/test/lrd-qemu-test"
CI_WORKFLOW="$REPO_ROOT/os/ci/build-and-ci.yml"
if [ ! -f "$CI_WORKFLOW" ]; then
    CI_WORKFLOW="$REPO_ROOT/.github/workflows/build-and-ci.yml"
fi

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

echo "=== Running Phase 14 Unified Build & CI Verification Suite ==="

# Check files exist
assert_ok "lrd-make build harness exists and executable" test -x "$LRD_MAKE"
assert_ok "lrd-qemu-test runner exists and executable" test -x "$QEMU_TEST"
test_lrd_install() { "$REPO_ROOT/os/install/lrd-install" --help >/dev/null; }
assert_ok "Universal bare-metal installer exists and supports --help" test_lrd_install
assert_ok "GitHub Actions CI workflow exists" test -f "$CI_WORKFLOW"

# Test CI Workflow Configuration Structure
test_ci_workflow() {
    python3 -c '
import sys
content = open(sys.argv[1]).read()
assert "name: LibreDroid OS Build & Automated QEMU CI Matrix" in content
assert "lint-and-audit:" in content
assert "test-matrix:" in content
assert "build-targets:" in content
assert "Phase 1 - lrdd Daemon" in content
assert "Phase 14 - Unified Build & CI" in content
' "$CI_WORKFLOW"
}
assert_ok "GitHub Actions CI workflow job matrix (Phases 1-14 + build verification)" test_ci_workflow

# Test lrd-make multi-target build harness (Dry-Run Mode)
test_lrd_make_targets() {
    # 1. Target: x86_64-iso
    local iso_out
    iso_out=$("$LRD_MAKE" x86_64-iso --dry-run)
    echo "$iso_out" | grep -q "building production x86_64 UEFI+BIOS Live ISO"
    echo "$iso_out" | grep -q "lrd-make finished successfully"

    # 2. Target: halium-arm64
    local halium_out
    halium_out=$("$LRD_MAKE" halium-arm64 --dry-run)
    echo "$halium_out" | grep -q "building Halium / Droidian rootfs"

    # 3. Target: aosp-ota
    local aosp_out
    aosp_out=$("$LRD_MAKE" aosp-ota --dry-run)
    echo "$aosp_out" | grep -q "building Signed AOSP flashable OTA update zip"

    # 4. Target: clean
    local clean_out
    clean_out=$("$LRD_MAKE" clean)
    echo "$clean_out" | grep -q "cleaning build artifacts"
}
assert_ok "lrd-make multi-target dispatcher (x86_64-iso, halium-arm64, aosp-ota, clean)" test_lrd_make_targets

# Test lrd-qemu-test script syntax
test_qemu_script_syntax() {
    bash -n "$QEMU_TEST"
}
assert_ok "Automated headless QEMU test runner script syntax (bash -n)" test_qemu_script_syntax

echo "=========================================================="
echo "Phase 14 Test Results: $PASSED passed, $FAILED failed."
echo "=========================================================="

if [ "$FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi
