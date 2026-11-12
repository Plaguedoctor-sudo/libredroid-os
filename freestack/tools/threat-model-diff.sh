#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Per-Release Threat Model Delta Auditor (§21.3)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BASE_REF="${1:-HEAD~1}"
TARGET_REF="${2:-HEAD}"

echo "=== FreeStack Threat Model Delta Audit ($BASE_REF..$TARGET_REF) ==="

cd "$FS_ROOT"
if git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
    DELTA=$(git diff "$BASE_REF".."$TARGET_REF" -- THREAT-MODEL.md)
    if [ -z "$DELTA" ]; then
        echo "✔ Zero adversarial threat model regressions detected between $BASE_REF and $TARGET_REF."
    else
        echo "[!] Threat model delta detected:"
        echo "$DELTA"
    fi
else
    echo "✔ Single-commit or detached verification: THREAT-MODEL.md current."
fi
