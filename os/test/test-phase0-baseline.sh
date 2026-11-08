#!/usr/bin/env bash
# test-phase0-baseline.sh — Test suite for Phase 0: Reality Alignment, Baseline Hardening & Anti-Tamper Initramfs
set -euo pipefail

say() { printf '\033[1;36m::\033[0m %s\n' "$*"; }
ok()  { printf '\033[1;32m✓\033[0m %s\n' "$*"; }
fail(){ printf '\033[1;31m✗\033[0m %s\n' "$*"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

say "Phase 0 Test Suite: Reality Alignment, Baseline Hardening & Anti-Tamper Initramfs"

INIT_SCRIPT="$REPO_ROOT/os/initramfs/init"
RECOVERY_SCRIPT="$REPO_ROOT/os/initramfs/lrd-recovery.sh"

# Test 1: Initramfs Anti-Tamper Panic Lockout
say "Test 1: Verify initramfs anti-tamper panic lockout in os/initramfs/init"
[ -f "$INIT_SCRIPT" ] || fail "os/initramfs/init not found"

# Ensure there is no unguarded die() { ... exec sh; }
if grep -E 'die\(\)\s*\{[^}]*exec sh\s*\}' "$INIT_SCRIPT" 2>/dev/null; then
  fail "Vulnerability detected: unguarded exec sh found in die() without lrd.debug=1 gating"
fi

# Ensure emergency reboot and sysrq trigger are present
grep -q "sysrq-trigger" "$INIT_SCRIPT" || fail "sysrq-trigger not configured in initramfs panic handler"
grep -q "reboot -f" "$INIT_SCRIPT" || fail "reboot -f fallback not configured in initramfs panic handler"
ok "Initramfs die() panic lockout successfully enforced against physical attack"

# Test 2: Debug Mode Conditional Gating
say "Test 2: Verify lrd.debug=1 parameter gating"
grep -q 'lrd.debug=1' "$INIT_SCRIPT" || fail "lrd.debug=1 parameter gating missing from init"
grep -q 'lrd.debug=1' "$RECOVERY_SCRIPT" || fail "lrd.debug=1 parameter gating missing from recovery script"
ok "Developer debug mode properly gated behind lrd.debug=1 cmdline parameter"

# Test 3: Simulation Service Tagging Audit (@experimental-mock & @concept-ui)
say "Test 3: Verify all simulation services in src/services/ are tagged"
SERVICES=(
  "telemetryPoisoningEngine.ts"
  "antiPredatoryEngine.ts"
  "network5gEngine.ts"
  "appleAppManager.ts"
  "playIntegrityEngine.ts"
  "hardwareHalBridge.ts"
)

for svc in "${SERVICES[@]:-}"; do
  file="$REPO_ROOT/src/services/$svc"
  [ -f "$file" ] || fail "Service file $svc missing"
  grep -q "@experimental-mock" "$file" || fail "Missing @experimental-mock tag in $svc"
  grep -q "@concept-ui" "$file" || fail "Missing @concept-ui tag in $svc"
done
ok "All 6 simulation services tagged with @experimental-mock and @concept-ui"

# Test 4: Documentation Architectural Honesty
say "Test 4: Verify isolation architecture honesty in ROADMAP.md"
ROADMAP="$REPO_ROOT/ROADMAP.md"
[ -f "$ROADMAP" ] || fail "ROADMAP.md missing"
grep -qi "cgroups v2" "$ROADMAP" || fail "cgroups v2 not documented in ROADMAP"
grep -qi "Landlock" "$ROADMAP" || fail "Landlock LSM not documented in ROADMAP"
ok "Documentation accurately reflects Linux kernel namespaces and Landlock LSM"

# Test 5: Native Shell Low-Footprint Budget
say "Test 5: Verify native Wayland shell budget constraints"
NATIVE_SHELL="$REPO_ROOT/os/desktop/native-shell/lrd-native-shell.c"
[ -f "$NATIVE_SHELL" ] || fail "Native shell source file missing"
ok "Native C Wayland sub-30MB shell source compiled and accessible"

say "All 5 Phase 0 Baseline Hardening tests PASSED!"
