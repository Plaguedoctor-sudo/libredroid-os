#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A1: Zero non-free binary blobs in core tier" {
    grep -q "entrypoint:" manifest/freestack.manifest.yaml
    ! grep -q "tier: \"blob\"" manifest/freestack.manifest.yaml
}
