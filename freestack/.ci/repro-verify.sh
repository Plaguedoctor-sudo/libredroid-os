#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Deterministic Bit-for-Bit Reproducibility Validator
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$FS_ROOT" || exit 1
echo "=== FreeStack Bit Reproducibility Verification ==="
bash tests/repro-rebuild.sh
echo "✔ Bit reproducibility check passed."
