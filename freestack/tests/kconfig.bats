#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Kernel Hardening Config Regression Suite (Task 4.4)

setup() {
    export KCONFIG_DIR="$(cd "$BATS_TEST_DIRNAME/../config/kernel" && pwd)"
}

@test "Kernel Hardening: x86_64 fragment exists and enables mandatory protections" {
    [ -f "$KCONFIG_DIR/fragment-x86_64.config" ]
    grep -q "CONFIG_SECURITY_SELINUX=y" "$KCONFIG_DIR/fragment-x86_64.config"
    grep -q "CONFIG_SECCOMP=y" "$KCONFIG_DIR/fragment-x86_64.config"
    grep -q "CONFIG_SECCOMP_FILTER=y" "$KCONFIG_DIR/fragment-x86_64.config"
    grep -q "CONFIG_RANDOMIZE_BASE=y" "$KCONFIG_DIR/fragment-x86_64.config"
    grep -q "CONFIG_FORTIFY_SOURCE=y" "$KCONFIG_DIR/fragment-x86_64.config"
    grep -q "CONFIG_HARDENED_USERCOPY=y" "$KCONFIG_DIR/fragment-x86_64.config"
    grep -q "CONFIG_PAGE_TABLE_ISOLATION=y" "$KCONFIG_DIR/fragment-x86_64.config"
}

@test "Kernel Hardening: Insecure legacy options disabled" {
    grep -q "CONFIG_DEVKMEM is not set" "$KCONFIG_DIR/fragment-x86_64.config"
    grep -q "CONFIG_COMPAT_VDSO is not set" "$KCONFIG_DIR/fragment-x86_64.config"
    grep -q "CONFIG_LEGACY_VSYSCALL_NONE=y" "$KCONFIG_DIR/fragment-x86_64.config"
}
