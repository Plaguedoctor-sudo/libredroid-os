#!/bin/bash
# ==============================================================================
# LibreDroid Phase 4 Automated Verification Test Suite
# True Two-Tier Domain Isolation & Ephemeral Auto-Wipe
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

MICROVM="$REPO_ROOT/os/infra/domain/lrd-microvm"
DISPOSABLE="$REPO_ROOT/os/infra/domain/lrd-disposable"
DOMAIN_MGR="$REPO_ROOT/os/infra/domain/lrd-domain-mgr"
MICROVM_SERVICE="$REPO_ROOT/os/build/config/includes.chroot/etc/systemd/system/lrd-microvm@.service"
DOMAIN_SERVICE="$REPO_ROOT/os/build/config/includes.chroot/etc/systemd/system/lrd-domain@.service"

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

echo "=== Running Phase 4 Two-Tier Isolation Verification Suite ==="

# Check scripts and configs exist
assert_ok "lrd-microvm orchestrator exists and executable" test -x "$MICROVM"
assert_ok "lrd-disposable engine exists and executable" test -x "$DISPOSABLE"
assert_ok "lrd-domain-mgr manager exists and executable" test -x "$DOMAIN_MGR"
assert_ok "lrd-microvm@.service systemd unit exists" test -f "$MICROVM_SERVICE"
assert_ok "lrd-domain@.service systemd unit exists" test -f "$DOMAIN_SERVICE"

# Test Tier Classification
test_tier_classification() {
    local t_vault t_tor t_work t_eph
    t_vault=$("$DOMAIN_MGR" vault tier)
    t_tor=$("$DOMAIN_MGR" tor-gateway tier)
    t_work=$("$DOMAIN_MGR" workstation tier)
    t_eph=$("$DOMAIN_MGR" ephemeral tier)

    [ "$t_vault" = "tier2_microvm" ] && \
    [ "$t_tor" = "tier2_microvm" ] && \
    [ "$t_work" = "tier1_container" ] && \
    [ "$t_eph" = "tier1_container" ]
}
assert_ok "Domain tier classification (Tier 1 vs Tier 2 MicroVM)" test_tier_classification

# Test Tier 2 MicroVM Lifecycle
test_microvm_lifecycle() {
    # 1. Start Vault MicroVM
    local out
    out=$("$MICROVM" vault start)
    echo "$out" | grep -q "started successfully"

    # 2. Check Status
    local status_out
    status_out=$("$MICROVM" vault status)
    echo "$status_out" | grep -q "Status: RUNNING"
    echo "$status_out" | grep -q '"tier": 2'

    # 3. Stop Vault MicroVM
    local stop_out
    stop_out=$("$MICROVM" vault stop)
    echo "$stop_out" | grep -q "stopped"

    # 4. Verify Stopped Status
    status_out=$("$MICROVM" vault status)
    echo "$status_out" | grep -q "Status: STOPPED"
}
assert_ok "MicroVM lifecycle (start, status verification, clean stop)" test_microvm_lifecycle

# Test Ephemeral Disposable Domain & Auto-Wipe
test_disposable_autowipe() {
    local test_session="test-wipe-$$"
    local ephemeral_base="/tmp/libredroid/ephemeral/$test_session"

    # Run command inside disposable container that creates a secret file
    "$DISPOSABLE" run "$test_session" bash -c "echo 'SUPER_SECRET_PAYLOAD' > secret.key; test -f secret.key"

    # After exit, the session directory and the secret file MUST be completely destroyed
    if [ -d "$ephemeral_base" ]; then
        echo "Ephemeral directory still exists!"
        return 1
    fi

    # Check wipe receipt
    local wipe_log="/run/libredroid/disposable_wipes.json"
    if [ ! -f "$wipe_log" ]; then
        wipe_log="/tmp/libredroid/disposable_wipes.json"
    fi

    [ -f "$wipe_log" ] && grep -q "$test_session" "$wipe_log" && grep -q '"status":"wiped_clean"' "$wipe_log"
}
assert_ok "Disposable domain auto-wipe (RAM-backed ephemeral destruction & shred)" test_disposable_autowipe

# Test Disposable Status and Wipe-All
test_disposable_status() {
    local out
    out=$("$DISPOSABLE" status)
    echo "$out" | grep -q "LibreDroid Disposable Domain Engine Status"
    echo "$out" | grep -q "Recent Auto-Wipe Receipts"
}
assert_ok "Disposable engine status reporting" test_disposable_status

# Test Unified Domain Manager Dispatch
test_domain_mgr_dispatch() {
    # Test Tier 2 start via domain-mgr
    local start_out
    start_out=$("$DOMAIN_MGR" tor-gateway start)
    echo "$start_out" | grep -q "started successfully"

    # Test status
    local status_out
    status_out=$("$DOMAIN_MGR" tor-gateway status)
    echo "$status_out" | grep -q "tier2_microvm"
    echo "$status_out" | grep -q "RUNNING"

    # Test stop
    local stop_out
    stop_out=$("$DOMAIN_MGR" tor-gateway stop)
    echo "$stop_out" | grep -q "stopped"
}
assert_ok "Unified domain manager dispatching to MicroVM tier" test_domain_mgr_dispatch

echo "=========================================================="
echo "Phase 4 Test Results: $PASSED passed, $FAILED failed."
echo "=========================================================="

if [ "$FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi
