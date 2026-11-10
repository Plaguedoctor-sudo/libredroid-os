#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A13: Zero default-on telemetry or background analytics pings" {
    ! grep -rli "telemetry.enabled.*true" config/ 2>/dev/null
}
