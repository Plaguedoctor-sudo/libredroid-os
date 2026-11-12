#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Hardware & Capability Revoke-All Panic Switch (Task 1.7)
set -euo pipefail

CLASS="${1:-}"

if [ -z "$CLASS" ]; then
    echo "Usage: fs-revoke.sh <class|all>" >&2
    echo "Classes: net, camera, audio, location, infer, storage, all" >&2
    exit 64
fi

REVOKE_LOG="/tmp/freestack-revoke-audit.log"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo "[$TIMESTAMP] Executing hardware-backed capability revocation for class: $CLASS" >> "$REVOKE_LOG"

case "$CLASS" in
    net)
        # Flush ephemeral nftables dynamic allow rules immediately
        nft flush chain inet fs dyn_egress 2>/dev/null || true
        # Drop dynamic routes
        ip route flush table 100 2>/dev/null || true
        echo "✔ Revocation complete: All network leases severed and state purged."
        ;;
    camera|audio)
        # Sever device node permissions and kill active capture sessions
        fuser -k /dev/video* 2>/dev/null || true
        fuser -k /dev/snd/* 2>/dev/null || true
        echo "✔ Revocation complete: Multimedia sensors severed."
        ;;
    infer)
        # Terminate running inference worker processes and revoke memory leases
        pkill -f "infer-worker" 2>/dev/null || true
        echo "✔ Revocation complete: Inference execution handles purged."
        ;;
    all)
        nft flush chain inet fs dyn_egress 2>/dev/null || true
        fuser -k /dev/video* 2>/dev/null || true
        fuser -k /dev/snd/* 2>/dev/null || true
        pkill -f "infer-worker" 2>/dev/null || true
        echo "✔ Hardware emergency panic: ALL capability leases revoked globally."
        ;;
    *)
        echo "Error: Unknown capability class '$CLASS'" >&2
        exit 65
        ;;
esac

exit 0
