#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Root Fuzzing Dispatcher for LibreDroid & FreeStack Sovereign Security Testing
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== LibreDroid & FreeStack Security Fuzzing Harness ==="
echo "Executing fuzzer suites..."

if [ -f "$ROOT_DIR/freestack/fuzz/soak-triage.sh" ]; then
    bash "$ROOT_DIR/freestack/fuzz/soak-triage.sh" "${1:-quick}"
fi

echo "✔ Root fuzzing suite run completed successfully."
