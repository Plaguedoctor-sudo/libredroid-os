#!/bin/bash
# ==============================================================================
# LibreDroid Phase 3 Automated Verification Test Suite
# Kernel & Network Telemetry Defenses
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

DNSD="$REPO_ROOT/os/security/net/lrd-dnsd"
POISONER="$REPO_ROOT/os/security/net/lrd-poisoner"
LANDLOCK="$REPO_ROOT/os/security/harden/lrd-landlock"
VDEV="$REPO_ROOT/os/security/harden/lrd-virtual-devices.sh"
DEFENSE_MGR="$REPO_ROOT/os/security/net/lrd-telemetry-defense"
NFT_RULES="$REPO_ROOT/os/build/config/includes.chroot/etc/nftables.d/lrd-telemetry.nft"
SERVICE_FILE="$REPO_ROOT/os/build/config/includes.chroot/etc/systemd/system/lrd-telemetry-defense.service"

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

echo "=== Running Phase 3 Telemetry Defenses Verification Suite ==="

# Check binaries exist
assert_ok "lrd-dnsd compiled binary exists" test -x "$DNSD"
assert_ok "lrd-poisoner compiled binary exists" test -x "$POISONER"
assert_ok "lrd-landlock compiled binary exists" test -x "$LANDLOCK"
assert_ok "lrd-virtual-devices script exists" test -x "$VDEV"
assert_ok "lrd-telemetry-defense script exists" test -x "$DEFENSE_MGR"
assert_ok "nftables telemetry rule file exists" test -f "$NFT_RULES"
assert_ok "systemd service unit exists" test -f "$SERVICE_FILE"

# Test Landlock execution
test_landlock_execution() {
    local out
    out=$("$LANDLOCK" /tmp /bin/echo "LANDLOCK_SANDBOX_ACTIVE")
    echo "$out" | grep -q "LANDLOCK_SANDBOX_ACTIVE"
}
assert_ok "lrd-landlock sandboxed process execution" test_landlock_execution

# Test Virtual Devices manager
test_vdev_status() {
    local out
    out=$("$VDEV" status)
    echo "$out" | grep -q "LibreDroid Virtual Devices Status"
}
assert_ok "lrd-virtual-devices status command" test_vdev_status

test_vdev_start() {
    local out
    out=$("$VDEV" start)
    echo "$out" | grep -q "Virtual"
}
assert_ok "lrd-virtual-devices start command" test_vdev_start

# Test Telemetry Poisoner HTTP server
test_poisoner_server() {
    # Start poisoner in background
    "$POISONER" &
    local p_pid=$!
    sleep 0.3

    # Send mock analytics ping via python with ProxyHandler({}) to bypass environment proxy
    local response
    response=$(python3 -c '
import urllib.request, json
handler = urllib.request.ProxyHandler({})
opener = urllib.request.build_opener(handler)
req = urllib.request.Request("http://127.0.0.1:8088/api/v1/event", data=b"{\"event\":\"app_open\",\"advertising_id\":\"target-id\"}", headers={"Content-Type": "application/json"})
try:
    with opener.open(req, timeout=2) as resp:
        print(resp.read().decode())
except Exception as e:
    print(f"ERROR: {e}")
')

    kill "$p_pid" 2>/dev/null || true
    wait "$p_pid" 2>/dev/null || true

    echo "$response" | grep -q '"poisoned":true'
}
assert_ok "lrd-poisoner synthetic attribution feed (HTTP 200 JSON)" test_poisoner_server

# Test DNS Sinkhole (lrd-dnsd)
test_dnsd_sinkhole() {
    # Start lrd-dnsd in background
    "$DNSD" &
    local d_pid=$!
    sleep 0.3

    # Query tracker domain via python DNS UDP query to 127.0.0.1:5353
    local resolved_ip
    resolved_ip=$(python3 -c '
import socket, struct

def build_dns_query(domain):
    # Transaction ID = 0x1234, Flags = 0x0100 (standard query)
    header = struct.pack(">HHHHHH", 0x1234, 0x0100, 1, 0, 0, 0)
    qname = b"".join(bytes([len(part)]) + part.encode() for part in domain.split(".")) + b"\x00"
    qtype_qclass = struct.pack(">HH", 1, 1) # Type A, Class IN
    return header + qname + qtype_qclass

def parse_dns_response(data):
    # Check flags and answer count
    ancount = struct.unpack(">H", data[6:8])[0]
    if ancount == 0:
        return "NO_ANSWER"
    # Find last 4 bytes for IPv4 address
    ip = socket.inet_ntoa(data[-4:])
    return ip

s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.settimeout(2.0)
query = build_dns_query("firebase-settings.crashlytics.com")
s.sendto(query, ("127.0.0.1", 5353))
try:
    data, _ = s.recvfrom(512)
    print(parse_dns_response(data))
except Exception as e:
    print(f"ERROR: {e}")
finally:
    s.close()
')

    kill "$d_pid" 2>/dev/null || true
    wait "$d_pid" 2>/dev/null || true

    # Tracker domain must be sinkholed to 127.0.0.2
    [ "$resolved_ip" = "127.0.0.2" ]
}
assert_ok "lrd-dnsd surveillance domain sinkholing (127.0.0.2)" test_dnsd_sinkhole

# Test DoH/DoT egress blocking in nftables
test_doh_dot_nft_rules() {
    grep -q "tcp dport 853 counter reject" "$NFT_RULES" && \
    grep -q "udp dport 853 counter drop" "$NFT_RULES" && \
    grep -q "doh_resolvers" "$NFT_RULES"
}
assert_ok "nftables DoH (443) and DoT (853) egress neutralization rules" test_doh_dot_nft_rules

# Test Telemetry Defense manager script
test_telemetry_mgr() {
    "$DEFENSE_MGR" start > /dev/null
    sleep 0.4
    "$DEFENSE_MGR" status | grep -q "DNS Sinkhole (lrd-dnsd): RUNNING"
    "$DEFENSE_MGR" stop > /dev/null
}
assert_ok "lrd-telemetry-defense start/status/stop cycle" test_telemetry_mgr

echo "=========================================================="
echo "Phase 3 Test Results: $PASSED passed, $FAILED failed."
echo "=========================================================="

if [ "$FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi
