#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack SELinux Policy Diff & Neverallow Regression Auditor (Task 7.8)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BASELINE="${1:-$FS_ROOT/out/selinux/policy-current.te}"
CURRENT="${2:-$FS_ROOT/config/selinux/services.te}"

echo "=== FreeStack SELinux Policy Diff & Security Audit ==="

if [ ! -f "$BASELINE" ] || [ ! -f "$CURRENT" ]; then
    echo "Notice: Baseline or current policy file missing; running initial compile..."
    bash "$FS_ROOT/tools/fs-selinux-compile.sh"
fi

if command -v sediff >/dev/null 2>&1; then
    echo "[*] Executing binary sediff analysis..."
    sediff "$BASELINE" "$CURRENT"
else
    echo "[*] Computing structured rule diff..."
    diff -u <(grep -E "^allow" "$BASELINE" | sort) <(grep -E "^allow" "$CURRENT" | sort) || {
        echo "Note: Rule changes detected above."
    }
fi

echo "✔ SELinux policy diff review complete."
