#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A3: Default-deny network egress policy enforced" {
    [ -f config/nftables/default.nft ]
    grep -q "policy drop" config/nftables/default.nft
}
