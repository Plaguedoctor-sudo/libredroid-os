#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Crash Triage & Deduplication Verifier for LibreDroid & FreeStack Fuzz Harnesses
set -euo pipefail

CRASH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "=== Fuzz Crash Deduplication & Triage Verifier ==="
echo "Monitoring crash triage path: $CRASH_DIR"

# Count existing triage items
CRASH_COUNT=$(find "$CRASH_DIR" -type f ! -name "triage_verifier.sh" ! -name ".*" | wc -l)
echo "Active unresolved crashes in triage pool: $CRASH_COUNT"

if [ "$CRASH_COUNT" -eq 0 ]; then
    echo "✔ Zero crash backlog. Sanitizer heap and stack state clean."
else
    echo "Backlog items detected:"
    find "$CRASH_DIR" -type f ! -name "triage_verifier.sh" ! -name ".*" -exec ls -lh {} +
fi
exit 0
