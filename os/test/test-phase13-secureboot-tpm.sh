#!/bin/bash
# ==============================================================================
# LibreDroid Phase 13 Automated Verification Test Suite
# UEFI Secure Boot (Shim) & Hardware TPM 2.0 Auto-Unlock
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

SECUREBOOT_CTL="$REPO_ROOT/os/security/secureboot/lrd-secureboot"
TPM_CTL="$REPO_ROOT/os/security/tpm/lrd-tpm-enroll"
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

echo "=== Running Phase 13 Secure Boot & TPM 2.0 Verification Suite ==="

# Check scripts and packages
assert_ok "lrd-secureboot script exists and executable" test -x "$SECUREBOOT_CTL"
assert_ok "lrd-tpm-enroll script exists and executable" test -x "$TPM_CTL"
assert_ok "Package manifest contains shim-signed" grep -q "shim-signed" "$PKG_LIST"
assert_ok "Package manifest contains grub-efi-amd64-signed" grep -q "grub-efi-amd64-signed" "$PKG_LIST"
assert_ok "Package manifest contains tpm2-tools" grep -q "tpm2-tools" "$PKG_LIST"

# Test UEFI Secure Boot Tree Provisioning
test_secureboot_tree() {
    local test_esp="/tmp/libredroid/test-esp-$$"
    rm -rf "$test_esp"

    "$SECUREBOOT_CTL" setup "$test_esp" > /dev/null

    [ -f "$test_esp/EFI/BOOT/BOOTX64.EFI.meta" ] && \
    [ -f "$test_esp/EFI/BOOT/grubx64.efi.meta" ] && \
    [ -f "$test_esp/EFI/BOOT/mmx64.efi.meta" ] && \
    [ -f "$test_esp/EFI/BOOT/grub.cfg" ] && \
    grep -q "lockdown=integrity" "$test_esp/EFI/BOOT/grub.cfg"

    rm -rf "$test_esp"
}
assert_ok "Signed UEFI Secure Boot directory hierarchy & GRUB lockdown config" test_secureboot_tree

# Test Secure Boot Trust Chain Verification
test_trust_chain() {
    local out
    out=$("$SECUREBOOT_CTL" verify-chain)
    echo "$out" | grep -q "Microsoft Corporation UEFI CA" && \
    echo "$out" | grep -q "lockdown mode = integrity" && \
    echo "$out" | grep -q "Chain Verdict: VALID"
}
assert_ok "Secure Boot end-to-end cryptographic trust chain verification" test_trust_chain

# Test TPM 2.0 Hardware Bound LUKS2 Enrollment & Sealed Policy
test_tpm_enrollment() {
    local test_dev="/dev/mapper/lrd_test_volume"
    local enroll_out
    enroll_out=$("$TPM_CTL" enroll "$test_dev")
    echo "$enroll_out" | grep -q "Hardware TPM 2.0 enrollment complete"

    local status_out
    status_out=$("$TPM_CTL" status)
    echo "$status_out" | grep -q '"bound_pcrs": \[0, 4, 7, 9\]'
    echo "$status_out" | grep -q '"auto_unlock": "enabled"'
}
assert_ok "TPM 2.0 PCR 0+4+7+9 hardware-bound cryptographic sealing" test_tpm_enrollment

# Test Clean vs Tampered TPM Unseal Logic
test_tpm_unseal() {
    # 1. Clean boot with matching PCR 0+7 -> Automatic Passwordless Unlock
    local clean_unseal
    clean_unseal=$("$TPM_CTL" test-unseal clean)
    echo "$clean_unseal" | grep -q '"auto_unlock":true'
    echo "$clean_unseal" | grep -q '"pcr_match":true'

    # 2. Tampered boot (Firmware modified or Secure Boot turned off) -> Prompt Recovery Passphrase
    local tampered_unseal
    tampered_unseal=$("$TPM_CTL" test-unseal tampered)
    echo "$tampered_unseal" | grep -q '"auto_unlock":false'
    echo "$tampered_unseal" | grep -q '"tamper_detected":true'
    echo "$tampered_unseal" | grep -q '"action":"prompt_recovery_passphrase"'
}
assert_ok "TPM 2.0 automatic passwordless unseal and anti-tamper recovery prompt" test_tpm_unseal

echo "=========================================================="
echo "Phase 13 Test Results: $PASSED passed, $FAILED failed."
echo "=========================================================="

if [ "$FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi
