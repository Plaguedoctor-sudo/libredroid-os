#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A14: Transparent A/B update attestation with Rekor / cosign" {
    [ -f docs/MIRRORS.md ]
    grep -q "rekor" docs/MIRRORS.md || grep -q "cosign" docs/MIRRORS.md
}
