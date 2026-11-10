#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A6: Platform core conforms to GPL-3.0-or-later copyleft" {
    grep -q "General Public License" LICENSE
    grep -q "GPL-3.0-or-later" AGENTS.md
}
