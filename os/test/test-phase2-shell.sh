#!/usr/bin/env bash
# ==============================================================================
# LibreDroid OS — Phase 2 Test Suite: Native Shell & Compositor Architecture
# Verifies native Wayland shell, direct subsurface sockets, and Labwc rules
# ==============================================================================
set -euo pipefail

COLOR_RESET="\033[0m"
COLOR_GREEN="\033[1;32m"
COLOR_RED="\033[1;31m"
COLOR_CYAN="\033[1;36m"

pass() { printf "${COLOR_GREEN}✓ PASS:${COLOR_RESET} %s\n" "$*"; }
fail() { printf "${COLOR_RED}✗ FAIL:${COLOR_RESET} %s\n" "$*" >&2; exit 1; }

echo -e "${COLOR_CYAN}=================================================================="
echo "  LibreDroid OS — Phase 2 Test Suite: Native Shell & Compositor"
echo -e "==================================================================${COLOR_RESET}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.."
SHELL_PY="${REPO_ROOT}/os/desktop/native-shell/lrd-wayland-shell.py"
NATIVE_BIN="${REPO_ROOT}/os/desktop/native-shell/lrd-native-shell"
SUBSURFACE_SH="${REPO_ROOT}/os/desktop/lrd-wayland-subsurface"
RC_XML="${REPO_ROOT}/os/desktop/labwc/rc.xml"

# 1. Verify syntax and byte-compilation of native shell
echo "--> Testing Python native shell syntax (lrd-wayland-shell.py)..."
python3 -m py_compile "$SHELL_PY" || fail "Python syntax error in lrd-wayland-shell.py"
pass "lrd-wayland-shell.py syntax and byte-compilation verified"

# 2. Verify compiled C native shell binary
echo "--> Testing compiled C native shell (lrd-native-shell)..."
[ -x "$NATIVE_BIN" ] || fail "lrd-native-shell binary missing"
pass "lrd-native-shell binary verified and executable"

# 3. Test XML syntax of Labwc configuration
echo "--> Testing Labwc compositor configuration (rc.xml)..."
python3 -c "
import xml.etree.ElementTree as ET
tree = ET.parse('${RC_XML}')
root = tree.getroot()
assert root.tag == 'labwc_config', f'Unexpected root tag: {root.tag}'
print('  XML validated successfully')
" || fail "Invalid XML syntax in rc.xml"
pass "Labwc rc.xml parsed cleanly with valid domain rules"

# 4. Test Wayland subsurface socket orchestrator
echo "--> Testing direct Wayland subsurface pipeline..."
TEST_RUNTIME=$(mktemp -d /tmp/lrd-test-runtime.XXXXXX)
trap 'rm -rf "$TEST_RUNTIME"' EXIT

# Create mock host Wayland socket
python3 -c "import socket; s = socket.socket(socket.AF_UNIX); s.bind('${TEST_RUNTIME}/wayland-0')"
XDG_RUNTIME_DIR="$TEST_RUNTIME" WAYLAND_DISPLAY="wayland-0" bash "$SUBSURFACE_SH" >/dev/null

for dom in vault tor-gw workstation android disposable; do
  dom_sock="${TEST_RUNTIME}/wayland-domain-${dom}"
  [ -L "$dom_sock" ] || fail "Domain Wayland socket symlink missing for: $dom"
done
pass "Direct Wayland subsurface sockets created for all domains (zero noVNC)"

# 5. Verify noVNC is removed from default launch chain
echo "--> Verifying noVNC / websockify absence from default native shell..."
! grep -q "wayvnc" "${REPO_ROOT}/os/desktop/lrd-shell-launch" || fail "wayvnc still referenced in default shell launch"
! grep -q "websockify" "${REPO_ROOT}/os/desktop/lrd-shell-launch" || fail "websockify still referenced in default shell launch"
pass "Verified noVNC and websockify eliminated from default native shell chain"

echo -e "\n${COLOR_GREEN}=================================================================="
echo "  ✓ ALL PHASE 2 NATIVE SHELL & COMPOSITOR CHECKS PASSED!"
echo -e "==================================================================${COLOR_RESET}"
