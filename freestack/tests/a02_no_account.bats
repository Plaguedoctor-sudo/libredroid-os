#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A2: First-boot setup requires zero online accounts" {
    python3 tools/fs-setup.py --help | grep -q -- "--offline"
    python3 tools/fs-setup.py --test-headless
}
