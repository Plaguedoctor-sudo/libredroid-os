#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Weekly Reproducibility Random Spot-Check (§21.2)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== FreeStack Weekly Random Reproducibility Spot-Check ==="

cd "$FS_ROOT" || exit 1
# Randomly select 2 components from locked manifest and rebuild
COMPONENTS=("musl" "toybox" "dinit" "bubblewrap")
SELECTED_INDEX=$((RANDOM % ${#COMPONENTS[@]}))
SELECTED="${COMPONENTS[$SELECTED_INDEX]}"

echo "[*] Randomly selected component for verification: $SELECTED"
python3 tools/fsbuild/fsbuild.py verify-hashes --component "$SELECTED"
echo "✔ Spot-check passed: $SELECTED matches tree hash ledger."
