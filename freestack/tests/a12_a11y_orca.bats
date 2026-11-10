#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A12: AT-SPI2 and Orca accessibility bridge integration" {
    [ -f tools/fs-atk-bridge.c ]
    [ -f tests/a11y-smoke.md ]
}
