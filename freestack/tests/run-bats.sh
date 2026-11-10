#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Test Runner for .bats files (with or without bats binary installed)

set -uo pipefail

SUITE="${1:-}"

if command -v bats >/dev/null 2>&1; then
    exec bats "$@"
fi

if [ -z "$SUITE" ]; then
    echo "Usage: $0 <test-file.bats>"
    exit 1
fi

BATS_TEST_DIRNAME="$(cd "$(dirname "$SUITE")" && pwd)"
export BATS_TEST_DIRNAME

# Extract setup function if present
SETUP_FUNC=$(awk '
    /^setup\(\)[[:space:]]*\{/ { flag=1 }
    flag { print }
    flag && /^}/ { flag=0 }
' "$SUITE")

echo "Running test suite: $SUITE (via builtin runner)"

TOTAL=0
PASS=0
FAIL=0

while IFS= read -r line; do
    if [[ "$line" =~ ^@test[[:space:]]+\"([^\"]+)\" ]]; then
        TEST_NAME="${BASH_REMATCH[1]}"
        TOTAL=$((TOTAL + 1))
        
        TEST_CODE=$(awk -v name="$TEST_NAME" '
            $0 ~ "^@test \"" name "\"" { flag=1; next }
            flag && /^@test/ { exit }
            flag && /^}/ { flag=0; exit }
            flag { print }
        ' "$SUITE")
        
        # Run setup and test code inside subshell with run emulation
        if (
            run() {
                output=$("$@" 2>&1)
                status=$?
                return 0
            }
            eval "$SETUP_FUNC" 2>/dev/null || true
            if declare -f setup >/dev/null 2>&1; then setup; fi
            eval "$TEST_CODE"
        ) >/dev/null 2>&1; then
            echo "  ✔ ok $TOTAL - $TEST_NAME"
            PASS=$((PASS + 1))
        else
            echo "  ❌ not ok $TOTAL - $TEST_NAME"
            FAIL=$((FAIL + 1))
        fi
    fi
done < "$SUITE"

echo "----------------------------------------"
echo "Results: $PASS / $TOTAL passed"
if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
