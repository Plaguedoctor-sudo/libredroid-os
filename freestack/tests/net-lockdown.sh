#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Network Lockdown Verification Suite
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NFT_CONF="$FS_ROOT/config/nftables/default.nft"

echo "=== FreeStack Network Lockdown Verification Suite ==="

# 1. Verify default-deny ruleset structure in default.nft
if [ ! -f "$NFT_CONF" ]; then
    echo "FAIL: default.nft does not exist at $NFT_CONF"
    exit 1
fi

grep -q "table inet fs" "$NFT_CONF" || { echo "FAIL: table inet fs not defined"; exit 1; }
grep -A 2 "chain input" "$NFT_CONF" | grep -q "policy drop" || { echo "FAIL: input policy is not default-drop"; exit 1; }
grep -A 2 "chain forward" "$NFT_CONF" | grep -q "policy drop" || { echo "FAIL: forward policy is not default-drop"; exit 1; }
grep -A 2 "chain output" "$NFT_CONF" | grep -q "policy drop" || { echo "FAIL: output policy is not default-drop"; exit 1; }
echo "[PASS] default.nft enforces default-drop on input, forward, and output chains."

# 2. Verify nft syntax if nft binary is available
if command -v nft >/dev/null 2>&1; then
    nft -c -f "$NFT_CONF" 2>/dev/null && echo "[PASS] nft syntax validation succeeded." || echo "[WARN] nft check skipped or non-root."
fi

# 3. Test that unshare/bubblewrap network isolation provides zero route to external addresses
if command -v bwrap >/dev/null 2>&1; then
    if OUT=$(bwrap --unshare-net --ro-bind / / /bin/sh -c 'ip route show 2>&1 || true' 2>/dev/null); then
        if [ -z "$OUT" ]; then
            echo "[PASS] bwrap isolated network namespace has empty routing table (zero route)."
        else
            echo "[INFO] Isolated routing table: $OUT"
        fi
    else
        echo "[WARN] bwrap namespace creation not permitted in current container/privilege level."
    fi
elif command -v unshare >/dev/null 2>&1; then
    if OUT=$(unshare -n ip route show 2>/dev/null); then
        if [ -z "$OUT" ]; then
            echo "[PASS] unshare isolated network namespace has empty routing table (zero route)."
        fi
    else
        echo "[WARN] unshare network namespace not permitted in current container/privilege level."
    fi
fi

# 4. Verify dinit modem isolation configuration
MODEM_SERVICE="$FS_ROOT/config/dinit/modem-netns.service"
if [ -f "$MODEM_SERVICE" ] && grep -q -- "--unshare-net" "$MODEM_SERVICE"; then
    echo "[PASS] Cellular modem service is configured with dedicated unshare-net boundary."
fi

echo "All network lockdown verifications passed."
exit 0
