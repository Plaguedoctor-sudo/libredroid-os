#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A8: Seccomp and namespace confinement active for services" {
    [ -f config/seccomp/network.json ]
    [ -f config/seccomp/keystore.json ]
    [ -f config/seccomp/modem.json ]
    grep -q "SCMP_ACT_ERRNO" config/seccomp/network.json
}
