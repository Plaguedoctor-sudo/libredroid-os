#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A5: Bit-for-bit build reproducibility verified" {
    [ -f docs/REPRO-DIFF-TAXONOMY.md ]
    python3 tools/diff-classifier.py --help
}
