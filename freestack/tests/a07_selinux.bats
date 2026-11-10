#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A7: Per-service SELinux confinement and neverallow guards" {
    [ -f config/selinux/services.te ]
    [ -f config/selinux/file_contexts ]
    [ -f config/selinux/neverallow.te ]
    grep -q "fs_network_t" config/selinux/services.te
    grep -q "neverallow.*fs_network_t" config/selinux/neverallow.te
}
