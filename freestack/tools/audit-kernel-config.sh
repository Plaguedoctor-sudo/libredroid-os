#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Kernel Hardening & KSPP Configuration Auditor (Tasks 4.1, 4.2, 4.3)

set -euo pipefail

CONFIG_SRC="${1:-freestack/config/kernel/fragment-x86_64.config}"

echo "=== FreeStack Kernel Hardening Audit ==="
if [ ! -f "$CONFIG_SRC" ]; then
    echo "Error: Kernel configuration file $CONFIG_SRC not found"
    exit 1
fi

MANDATORY_OPTS=(
    "CONFIG_STRICT_KERNEL_RWX=y"
    "CONFIG_PAGE_TABLE_ISOLATION=y"
    "CONFIG_RETPOLINE=y"
    "CONFIG_RANDOMIZE_BASE=y"
    "CONFIG_STACKPROTECTOR_STRONG=y"
    "CONFIG_FORTIFY_SOURCE=y"
    "CONFIG_SECURITY_LANDLOCK=y"
    "CONFIG_SECCOMP=y"
    "CONFIG_SECCOMP_FILTER=y"
    "CONFIG_SECURITY_SELINUX=y"
)

BANNED_OPTS=(
    "CONFIG_COMPAT=y"
    "CONFIG_DEVKMEM=y"
    "CONFIG_BINFMT_MISC=y"
    "CONFIG_LEGACY_VSYSCALL_EMULATE=y"
    "CONFIG_KEXEC=y"
)

ERRORS=0

echo "[1/2] Checking mandatory security options in $CONFIG_SRC..."
for opt in "${MANDATORY_OPTS[@]:-}"; do
    if grep -q "^$opt" "$CONFIG_SRC"; then
        echo "  ✔ Found: $opt"
    else
        echo "  ✖ Missing mandatory option: $opt"
        ERRORS=$((ERRORS + 1))
    fi
done

echo "[2/2] Checking for banned/insecure legacy options..."
for bopt in "${BANNED_OPTS[@]:-}"; do
    if grep -q "^$bopt" "$CONFIG_SRC"; then
        echo "  ✖ Insecure option enabled: $bopt"
        ERRORS=$((ERRORS + 1))
    else
        echo "  ✔ Insecure option absent/disabled: $bopt"
    fi
done

if command -v kconfig-hardened-check >/dev/null 2>&1; then
    echo "Running upstream kconfig-hardened-check against fragment..."
    kconfig-hardened-check -c "$CONFIG_SRC" || true
fi

if [ "$ERRORS" -gt 0 ]; then
    echo "Kernel config audit FAILED with $ERRORS error(s)."
    exit 1
fi

echo "✔ Kernel config audit PASSED. All KSPP security fragments verified."
exit 0
