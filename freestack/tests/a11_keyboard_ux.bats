#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A11: Keyboard-only navigation across all surfaces" {
    [ -f docs/KEYBOARD-NAV.md ]
    grep -q "Super" docs/KEYBOARD-NAV.md
}
