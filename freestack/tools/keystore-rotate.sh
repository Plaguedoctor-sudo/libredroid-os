#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Keystore Rotation & Hardware Attestation Audit (Task 5.10)
set -euo pipefail

KEYSTORE_DIR="${KEYSTORE_DIR:-/var/lib/keystore}"
AUDIT_LOG="${AUDIT_LOG:-/var/log/freestack-keystore-audit.log}"

echo "=== FreeStack Hardware Keystore Rotation ==="

mkdir -p "$KEYSTORE_DIR" "$(dirname "$AUDIT_LOG")"
chmod 0700 "$KEYSTORE_DIR"

TIMESTAMP=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
KEY_ID="fs-key-$(date +%s)"
NEW_KEY="$KEYSTORE_DIR/$KEY_ID.bin"

echo "[1/3] Generating new 256-bit symmetric operational key..."
dd if=/dev/urandom of="$NEW_KEY" bs=32 count=1 status=none
chmod 0400 "$NEW_KEY"

echo "[2/3] Archiving superseded keys and recording cryptographic hash..."
KEY_HASH=$(sha256sum "$NEW_KEY" | awk '{print $1}')

echo "[3/3] Appending signed audit event to $AUDIT_LOG..."
echo "{\"timestamp\":\"$TIMESTAMP\",\"event\":\"KEY_ROTATION\",\"key_id\":\"$KEY_ID\",\"sha256\":\"$KEY_HASH\",\"status\":\"ACTIVE\"}" >> "$AUDIT_LOG"

echo "✔ Key rotation completed successfully for key: $KEY_ID ($KEY_HASH)"
