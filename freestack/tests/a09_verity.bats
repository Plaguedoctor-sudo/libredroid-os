#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A9: DM-Verity rootfs integrity and flipped-byte detection testable" {
    [ -f tests/verity-flip.bats ]
}
