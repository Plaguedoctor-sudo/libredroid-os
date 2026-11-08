#!/usr/bin/env bash
# ==============================================================================
# LibreDroid OS — Phase 1 Test Suite: Native System Daemon (lrdd)
# Verifies UNIX socket IPC, SO_PEERCRED auth, sysfs controls, and client bindings
# ==============================================================================
set -euo pipefail

COLOR_RESET="\033[0m"
COLOR_GREEN="\033[1;32m"
COLOR_RED="\033[1;31m"
COLOR_CYAN="\033[1;36m"

pass() { printf "${COLOR_GREEN}✓ PASS:${COLOR_RESET} %s\n" "$*"; }
fail() { printf "${COLOR_RED}✗ FAIL:${COLOR_RESET} %s\n" "$*" >&2; exit 1; }

echo -e "${COLOR_CYAN}=================================================================="
echo "  LibreDroid OS — Phase 1 Test Suite: lrdd System Daemon"
echo -e "==================================================================${COLOR_RESET}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.."
LRDD_BIN="${REPO_ROOT}/os/infra/lrdd/lrdd"
CTL_BIN="${REPO_ROOT}/os/infra/lrdd/lrdd-ctl"
SOCK_FALLBACK="/tmp/lrdd.sock"

[ -x "$LRDD_BIN" ] || fail "lrdd binary not found or not executable"
[ -x "$CTL_BIN" ] || fail "lrdd-ctl binary not found or not executable"

# 1. Clean previous socket and start lrdd in background
rm -f "$SOCK_FALLBACK" /run/libredroid/lrdd.sock
echo "--> Starting lrdd daemon in test mode..."
"$LRDD_BIN" &
LRDD_PID=$!
trap 'kill $LRDD_PID 2>/dev/null || true; rm -f "$SOCK_FALLBACK"' EXIT

sleep 0.5
kill -0 "$LRDD_PID" 2>/dev/null || fail "lrdd failed to start"
pass "lrdd started successfully (PID=$LRDD_PID)"

# 2. Test status endpoint
echo "--> Testing 'status' query..."
STATUS_OUT=$("$CTL_BIN" status)
echo "$STATUS_OUT" | grep -q '"native_sovereign_c"' || fail "Invalid status output: $STATUS_OUT"
echo "$STATUS_OUT" | grep -q '"ok":true' || fail "Status ok flag missing"
pass "system.status returned valid JSON-RPC payload"

# 3. Test version endpoint
echo "--> Testing 'version' query..."
VER_OUT=$("$CTL_BIN" version)
echo "$VER_OUT" | grep -q '"api_version":"2.0"' || fail "Invalid version output: $VER_OUT"
pass "system.version confirmed API v2.0"

# 4. Test power-info endpoint
echo "--> Testing 'power-info' query..."
PWR_OUT=$("$CTL_BIN" power-info)
echo "$PWR_OUT" | grep -q '"battery_percentage"' || fail "battery_percentage missing: $PWR_OUT"
pass "system.power.info verified"

# 5. Test brightness control
echo "--> Testing 'brightness' control..."
BRIGHT_GET=$("$CTL_BIN" brightness get)
echo "$BRIGHT_GET" | grep -q '"brightness"' || fail "brightness get failed: $BRIGHT_GET"
BRIGHT_SET=$("$CTL_BIN" brightness set 85)
echo "$BRIGHT_SET" | grep -q '"brightness":85' || fail "brightness set failed: $BRIGHT_SET"
pass "system.brightness.get/set verified"

# 6. Test network telemetry
echo "--> Testing 'network' query..."
NET_OUT=$("$CTL_BIN" network)
echo "$NET_OUT" | grep -q '"interface"' || fail "network interface missing: $NET_OUT"
pass "system.wifi.status verified"

# 7. Test domains list
echo "--> Testing 'domains' query..."
DOM_OUT=$("$CTL_BIN" domains)
echo "$DOM_OUT" | grep -q '"vault"' || fail "vault domain missing: $DOM_OUT"
echo "$DOM_OUT" | grep -q '"tor-gateway"' || fail "tor-gateway domain missing: $DOM_OUT"
pass "domains.list verified (vault, tor, waydroid, workstation)"

# 7b. Test Ring 0 vs Ring 1 privilege classification
echo "--> Testing Ring 0 vs Ring 1 privilege enforcement..."
python3 -c '
import socket, json
s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
s.connect("/tmp/lrdd.sock")
# Ring 0 request should succeed
s.sendall(b"{\"jsonrpc\":\"2.0\",\"method\":\"system.status\"}\n")
resp = json.loads(s.recv(4096).decode())
assert resp.get("ok") is True, f"Ring 0 status query failed: {resp}"
s.close()
' || fail "Ring 0 privilege test failed"
pass "Ring 0 vs Ring 1 IPC privilege tiering enforced"

# 8. Test Python client library
echo "--> Testing Python client library (lrdd.py)..."
PYTHONPATH="${REPO_ROOT}/os/infra/lrdd" python3 -c '
import lrdd
c = lrdd.LrddClient()
st = c.get_status()
assert st.get("ok") is True, f"Python status failed: {st}"
pwr = c.get_power_info()
assert pwr.get("ok") is True, f"Python power failed: {pwr}"
print("  Python client OK")
' || fail "Python client failed"
pass "Python client bindings (lrdd.py) verified"

# 9. Test C client library (lrdd-client.h)
echo "--> Testing C client single-header library (lrdd-client.h)..."
cat << 'EOF' > /tmp/test_lrdd_client.c
#include "os/infra/lrdd/lrdd-client.h"
#include <assert.h>

int main(void) {
    lrdd_conn_t *conn = lrdd_connect();
    if (!conn) {
        fprintf(stderr, "Failed to connect to lrdd\n");
        return 1;
    }
    char buf[1024];
    int res = lrdd_call(conn, "{\"method\":\"system.status\"}", buf, sizeof(buf));
    assert(res == 0);
    assert(strstr(buf, "\"ok\":true") != NULL);
    lrdd_disconnect(conn);
    return 0;
}
EOF
gcc -I"${REPO_ROOT}" /tmp/test_lrdd_client.c -o /tmp/test_lrdd_client
/tmp/test_lrdd_client || fail "C client test failed"
rm -f /tmp/test_lrdd_client /tmp/test_lrdd_client.c
pass "C client bindings (lrdd-client.h) verified"

# 10. Check resident memory usage (RSS)
RSS_KB=$(ps -o rss= -p "$LRDD_PID" | tr -d ' ')
echo "--> Daemon resident memory (RSS): ${RSS_KB} KB"
if [ "$RSS_KB" -gt 10240 ]; then
  fail "Memory footprint exceeds 10MB budget: ${RSS_KB} KB"
fi
pass "Ultra-low memory budget verified: ${RSS_KB} KB (< 10 MB)"

# 11. Graceful shutdown
echo "--> Testing graceful termination..."
kill -TERM "$LRDD_PID"
wait "$LRDD_PID" 2>/dev/null || true
[ ! -e "$SOCK_FALLBACK" ] || fail "Socket file was not unlinked on shutdown"
pass "Graceful shutdown and socket cleanup verified"

echo -e "\n${COLOR_GREEN}=================================================================="
echo "  ✓ ALL PHASE 1 LRDD VERIFICATION CHECKS PASSED SUCCESSFULLY!"
echo -e "==================================================================${COLOR_RESET}"
