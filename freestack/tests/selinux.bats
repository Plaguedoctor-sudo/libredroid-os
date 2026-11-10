#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack SELinux Policy & Denial Regression Corpus (Task 1.12)

setup() {
    export SEC_DIR="$(cd "$BATS_TEST_DIRNAME/../config/selinux" && pwd)"
}

@test "SELinux: Minimal policy and services definitions exist" {
    [ -f "$SEC_DIR/minimal.te" ]
    [ -f "$SEC_DIR/services.te" ]
    [ -f "$SEC_DIR/file_contexts" ]
    [ -f "$SEC_DIR/neverallow.te" ]
}

@test "SELinux: Check for mandatory domain types" {
    grep -q "type fs_network_t" "$SEC_DIR/services.te"
    grep -q "type fs_keystore_t" "$SEC_DIR/services.te"
    grep -q "type fs_modem_t" "$SEC_DIR/services.te"
    grep -q "type fs_display_t" "$SEC_DIR/services.te"
    grep -q "type fs_app_t" "$SEC_DIR/services.te"
}

@test "SELinux: Enforce strict neverallow barriers" {
    # No service may write to block storage
    grep -q "neverallow.*blk_file" "$SEC_DIR/neverallow.te"
    # Unprivileged apps cannot transition to init or keystore
    grep -q "neverallow fs_app_t { fs_init_t fs_lrdd_t fs_keystore_t }:process transition" "$SEC_DIR/neverallow.te"
    # Only keystore domain may access keystore secrets
    grep -q "neverallow ~{ fs_keystore_t fs_init_t } fs_keystore_data_t:file" "$SEC_DIR/neverallow.te"
    # Vault domain has no network sockets
    grep -q "neverallow fs_vault_t \*:tcp_socket \*" "$SEC_DIR/neverallow.te"
}

@test "SELinux: Verify file contexts cover essential paths" {
    grep -q "/usr/bin/fs-keystore" "$SEC_DIR/file_contexts"
    grep -q "/var/lib/keystore" "$SEC_DIR/file_contexts"
}
