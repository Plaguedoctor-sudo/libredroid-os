#!/usr/bin/env bash
# test-phase15-ota-rollback.sh — Test suite for Phase 15: Dual-Slot A/B OTA, Boot Counter Watchdog & Anti-Rollback
set -euo pipefail

say() { printf '\033[1;36m::\033[0m %s\n' "$*"; }
ok()  { printf '\033[1;32m✓\033[0m %s\n' "$*"; }
fail(){ printf '\033[1;31m✗\033[0m %s\n' "$*"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

TEST_DIR="$(mktemp -d /tmp/lrd-test-phase15-XXXXXX)"
cleanup() {
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

say "Phase 15 Test Suite: A/B Dual-Slot OTA & Cryptographic Rollback Protection"

BOOTCOUNT="$REPO_ROOT/os/boot/lrd-bootcount"
SLOT_CLI="$REPO_ROOT/os/boot/lrd-slot"
VERITY_CHECK="$REPO_ROOT/os/verity/lrd-verity-check"
UPDATE_CLI="$REPO_ROOT/os/update/lrd-update"

export LRD_MISC="$TEST_DIR/misc.bin"
export LRD_BOOTCOUNT_BIN="$BOOTCOUNT"
export LRD_STORE="$TEST_DIR/store"
export LRD_PERMIT_NONROOT=1
export LRD_NO_REBOOT=1
export LRD_SLOT="_a"

mkdir -p "$TEST_DIR/store/updates" "$TEST_DIR/keys" "$TEST_DIR/var/lib/lrd" "$TEST_DIR/run/lrd" "$TEST_DIR/run/libredroid"
export LRD_ROLLBACK_STORE="$TEST_DIR/var/lib/lrd/rollback_counter"
export LRD_VAR_LIB_DIR="$TEST_DIR/var/lib/lrd"
export LRD_RUN_DIR="$TEST_DIR/run"

# Test 1: Binary Existence & Basic Compilation
say "Test 1: Verify lrd-bootcount binary sanity"
[ -x "$BOOTCOUNT" ] || fail "lrd-bootcount binary not found or not executable"
status_out="$("$BOOTCOUNT" --status)"
echo "$status_out" | grep -q "slots:    2" || fail "Expected 2 slots in bootcount output"
ok "lrd-bootcount binary functional and reporting slots"

# Test 2: JSON Reporting
say "Test 2: Verify lrd-bootcount --json schema"
json_out="$("$BOOTCOUNT" --status --json)"
echo "$json_out" | jq -e '.slots == 2 and .current == "a"' >/dev/null || fail "Invalid JSON structure from --json"
ok "JSON schema conforms to lrdd requirements"

# Test 3: Arming Inactive Slot
say "Test 3: Arm inactive slot (slot b) with 3 tries"
"$BOOTCOUNT" --arm b 3
armed_json="$("$BOOTCOUNT" --status --json)"
echo "$armed_json" | jq -e '.slots_info[] | select(.slot=="b") | .tries == 3 and .success == 0' >/dev/null \
  || fail "Slot b not armed with 3 tries"
ok "Slot b successfully armed with tries=3 success=0"

# Test 4: Decrementing countdown
say "Test 4: Decrement countdown from 3 to 1"
"$BOOTCOUNT" --decrement b
"$BOOTCOUNT" --decrement b
dec_json="$("$BOOTCOUNT" --status --json)"
echo "$dec_json" | jq -e '.slots_info[] | select(.slot=="b") | .tries == 1 and .success == 0' >/dev/null \
  || fail "Slot b not decremented to tries=1"
ok "Slot b countdown decrements cleanly without premature trigger"

# Test 5: Fallback on countdown exhaustion
say "Test 5: Exhaust retries on slot b -> automatic fallback to slot a"
set +e
"$BOOTCOUNT" --decrement b
ret=$?
set -e
[ "$ret" -eq 10 ] || fail "Expected exit code 10 on retry exhaustion, got $ret"
ok "Boot retry exhaustion triggered automatic rollback mechanism"

# Test 6: Mark success
say "Test 6: Mark success on slot a"
"$BOOTCOUNT" --mark-success a
succ_json="$("$BOOTCOUNT" --status --json)"
echo "$succ_json" | jq -e '.slots_info[] | select(.slot=="a") | .success == 1 and .tries == 0' >/dev/null \
  || fail "Slot a not marked success=1"
ok "Slot a marked successful, countdown locked"

# Test 7: lrd-slot CLI
say "Test 7: Verify lrd-slot commands (show, other, json)"
[ -x "$SLOT_CLI" ] || fail "lrd-slot not executable"
other_out="$("$SLOT_CLI" other)"
[ "$other_out" = "b" ] || fail "Expected other slot to be b, got $other_out"
slot_json="$("$SLOT_CLI" json)"
echo "$slot_json" | jq -e '.slots == 2' >/dev/null || fail "lrd-slot json failed"
ok "lrd-slot helper functions operate correctly"

# Test 8: DM-Verity Verification & Cryptographic Metadata
say "Test 8: Verify DM-Verity root hash verification"
# Create test private & public keys
openssl genrsa -out "$TEST_DIR/keys/verity.key" 2048 2>/dev/null
openssl rsa -in "$TEST_DIR/keys/verity.key" -pubout -out "$TEST_DIR/keys/verity.pub.pem" 2>/dev/null
export LRD_VERITY_KEY="$TEST_DIR/keys/verity.pub.pem"

cat <<EOF > "$TEST_DIR/store/lrd-verity_a.json"
{
  "layout": "luks2+verity-inside",
  "rootHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "buildId": "libredroid-2026.11.08",
  "monotonicCounter": 100,
  "dataBlocks": 1048576,
  "tier": 2
}
EOF
openssl dgst -sha256 -sign "$TEST_DIR/keys/verity.key" -out "$TEST_DIR/store/lrd-verity_a.json.sig" "$TEST_DIR/store/lrd-verity_a.json"
export LRD_VERITY_META="$TEST_DIR/store/lrd-verity_a.json"

"$VERITY_CHECK" --check
v_out="$("$VERITY_CHECK" --status)"
echo "$v_out" | jq -e '.verified == true and .monotonicCounter == 100' >/dev/null || fail "Verity check failed"
ok "DM-Verity signature and rootHash validated"

# Test 9: Monotonic Anti-Rollback Protection
say "Test 9: Monotonic anti-rollback protection against downgrade"
# Current counter is 100 in LRD_ROLLBACK_STORE
cat <<EOF > "$TEST_DIR/store/lrd-verity_downgrade.json"
{
  "layout": "luks2+verity-inside",
  "rootHash": "bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0",
  "buildId": "libredroid-2025.01.01",
  "monotonicCounter": 50,
  "dataBlocks": 1048576,
  "tier": 1
}
EOF
openssl dgst -sha256 -sign "$TEST_DIR/keys/verity.key" -out "$TEST_DIR/store/lrd-verity_downgrade.json.sig" "$TEST_DIR/store/lrd-verity_downgrade.json"
export LRD_VERITY_META="$TEST_DIR/store/lrd-verity_downgrade.json"

set +e
"$VERITY_CHECK" --check 2>/dev/null
ret=$?
set -e
[ "$ret" -eq 3 ] || fail "Expected anti-rollback rejection exit code 3, got $ret"
ok "Anti-rollback prevented downgrade attack (50 < 100)"

# Test 10: OTA Check & Manifest
say "Test 10: OTA manifest check"
cat <<EOF > "$TEST_DIR/store/updates/lrd-update_1.1.0.json"
{
  "version": "1.1.0",
  "buildId": "libredroid-1.1.0",
  "channel": "stable",
  "date": "2026-11-08T18:00:00Z",
  "monotonicCounter": 105
}
EOF
openssl dgst -sha256 -sign "$TEST_DIR/keys/verity.key" -out "$TEST_DIR/store/updates/lrd-update_1.1.0.json.sig" "$TEST_DIR/store/updates/lrd-update_1.1.0.json"

check_out="$("$UPDATE_CLI" check)"
echo "$check_out" | grep -q "available OTA: 1.1.0" || fail "lrd-update check failed to detect 1.1.0"
ok "lrd-update check validated signed update manifest"

# Test 11: OTA Staging
say "Test 11: OTA payload staging to inactive slot (slot b)"
# Generate dummy rootfs & boot image with checksums
echo "dummy rootfs payload" > "$TEST_DIR/store/updates/lrd-rootfs_1.1.0.raw"
(cd "$TEST_DIR/store/updates" && sha256sum lrd-rootfs_1.1.0.raw > lrd-rootfs_1.1.0.raw.sha256)
echo "dummy boot payload" > "$TEST_DIR/store/updates/lrd-boot_1.1.0.img"
(cd "$TEST_DIR/store/updates" && sha256sum lrd-boot_1.1.0.img > lrd-boot_1.1.0.img.sha256)

cat <<EOF > "$TEST_DIR/store/updates/lrd-verity_b.json"
{
  "layout": "luks2+verity-inside",
  "rootHash": "111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0000",
  "buildId": "libredroid-1.1.0",
  "monotonicCounter": 105
}
EOF

"$UPDATE_CLI" download
"$UPDATE_CLI" stage

[ -f "$TEST_DIR/store/lrd-rootfs_b.raw" ] || fail "Inactive slot b rootfs not staged"
[ -f "$TEST_DIR/store/lrd-boot_b.img" ] || fail "Inactive slot b boot image not staged"
[ "$(cat "$TEST_DIR/store/lrd-version_b")" = "1.1.0" ] || fail "Staged version mismatch"
ok "Payload staged to inactive slot b without altering active slot a"

# Test 12: OTA Apply & Status
say "Test 12: OTA arming and status reporting"
"$UPDATE_CLI" apply 3
status_json="$("$UPDATE_CLI" status --json)"
echo "$status_json" | jq -e '.staged_version == "1.1.0" and .pending == true' >/dev/null \
  || fail "Pending update status not reflected in lrd-update status"
ok "OTA update successfully armed with watchdog for inactive slot b"

say "All 12 Phase 15 OTA, Boot Counter & Rollback tests PASSED!"
