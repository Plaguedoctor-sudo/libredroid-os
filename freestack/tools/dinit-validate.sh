#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Minimal Syntax and Semantic Validator for FreeStack Dinit Service Definitions
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FREESTACK_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_DIR="${1:-$FREESTACK_DIR/config/dinit}"

echo "=== FreeStack Dinit Service Validator ==="
echo "Target directory: $CONFIG_DIR"

SERVICES=("$CONFIG_DIR"/*.service)
if [ ! -e "${SERVICES[0]}" ]; then
    echo "FAIL: No service definitions found in $CONFIG_DIR" >&2
    exit 1
fi

COUNT=0
for svc in "${SERVICES[@]:-}"; do
    COUNT=$((COUNT + 1))
    NAME="$(basename "$svc")"
    
    # Assert presence of required 'type' and 'command' directives
    TYPE=$(grep -E '^[[:space:]]*type[[:space:]]*=' "$svc" | head -n 1 | cut -d= -f2- | tr -d '[:space:]')
    COMMAND=$(grep -E '^[[:space:]]*command[[:space:]]*=' "$svc" | head -n 1 | cut -d= -f2-)
    
    if [ -z "$TYPE" ]; then
        echo "FAIL: $NAME is missing mandatory 'type =' directive" >&2
        exit 1
    fi
    
    case "$TYPE" in
        process|staged|scripted|bgprocess) ;;
        *)
            echo "FAIL: $NAME has invalid type '$TYPE' (expected process|staged|scripted|bgprocess)" >&2
            exit 1
            ;;
    esac
    
    if [ -z "$COMMAND" ]; then
        echo "FAIL: $NAME is missing mandatory 'command =' directive" >&2
        exit 1
    fi
    
    echo "  ✔ $NAME: type=$TYPE, command verified"
done

echo "✔ All $COUNT Dinit service units syntactically verified."
exit 0
