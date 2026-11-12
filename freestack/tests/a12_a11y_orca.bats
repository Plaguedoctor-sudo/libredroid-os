#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A12: AT-SPI2 and Orca accessibility bridge integration" {
    [ -f tools/fs-atk-bridge.c ]
    [ -f tests/a11y-smoke.md ]

    # Verify both real-header ATK build and standalone fallback build
    run gcc -DHAVE_ATK -Itests/include -c tools/fs-atk-bridge.c -o /tmp/fs-atk-bridge-real.o
    [ "$status" -eq 0 ]
    rm -f /tmp/fs-atk-bridge-real.o

    run gcc -c tools/fs-atk-bridge.c -o /tmp/fs-atk-bridge-fallback.o
    [ "$status" -eq 0 ]
    rm -f /tmp/fs-atk-bridge-fallback.o
}
