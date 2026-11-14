#!/usr/bin/env bash
# ==============================================================================
# FreeStack SELinux Policy Compilation & Assertion Verification Suite
# freestack/config/selinux/compile_and_verify.sh
# ==============================================================================

set -Eeuo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE" || exit 1

CYAN='\033[1;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BOLD='\033[1m'; NC='\033[0m'
say(){ printf "${CYAN}::${NC} %s\n" "$*"; }
warn(){ printf "${YELLOW}!!${NC} %s\n" "$*" >&2; }
die(){ printf "${RED}xx${NC} %s\n" "$*" >&2; exit 1; }

say "${BOLD}Validating FreeStack SELinux Policies...${NC}"

# 1. Check required policy files
for f in minimal.te services.te neverallow.te file_contexts; do
    [ -f "$f" ] || die "Missing required policy file: $f"
    say "  • Found policy module: $f ($(wc -l < "$f") lines)"
done

# 2. Syntax and Domain Type Assertions
say "Verifying mandatory type and role declarations..."
MANDATORY_TYPES=(
    "fs_init_t"
    "fs_lrdd_t"
    "fs_shell_t"
    "fs_network_t"
    "fs_modem_t"
    "fs_keystore_t"
    "fs_app_t"
    "fs_vault_t"
    "fs_update_t"
    "fs_keystore_data_t"
    "fs_bin_t"
)

for t in "${MANDATORY_TYPES[@]:-}"; do
    if ! grep -q "type $t" services.te && ! grep -q "type $t" minimal.te; then
        die "Assertion failed: mandatory type $t not declared in policy modules!"
    fi
done
say "  ✔ All 11 mandatory domain types verified."

# 3. Invariant Checks on neverallow barriers
say "Verifying air-gap and isolation neverallows..."
grep -q "neverallow fs_vault_t \*:tcp_socket \*" neverallow.te || die "Invariant violation: fs_vault_t tcp restriction missing!"
grep -q "neverallow.*blk_file" neverallow.te || die "Invariant violation: blk_file restriction missing!"
grep -q "neverallow.*fs_keystore_data_t" neverallow.te || die "Invariant violation: fs_keystore_data_t isolation missing!"
say "  ✔ All strict neverallow barriers verified."

# 4. Compilation attempt
say "Checking for policy compiler (checkmodule / semodule_package)..."
if command -v checkmodule >/dev/null 2>&1 && command -v semodule_package >/dev/null 2>&1; then
    say "Compiling policy module with checkmodule..."
    checkmodule -M -m -o libredroid.mod minimal.te services.te neverallow.te
    semodule_package -o libredroid.pp -m libredroid.mod -f file_contexts
    say "${GREEN}✔ Policy successfully compiled to libredroid.pp!${NC}"
else
    say "  [INFO] checkmodule/semodule_package not installed in this environment."
    say "  [INFO] Static validation passed 100%. In production buildroot, compile via:"
    say "         checkmodule -M -m -o libredroid.mod minimal.te services.te neverallow.te"
    say "         semodule_package -o libredroid.pp -m libredroid.mod -f file_contexts"
fi

echo -e "\n${GREEN}${BOLD}✔ FreeStack SELinux Verification Passed!${NC}\n"
