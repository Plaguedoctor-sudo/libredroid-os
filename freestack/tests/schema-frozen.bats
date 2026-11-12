#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later
# Test suite for frozen Cap'n Proto schema ordinals (ADR 0001 & ADR 0003)

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "SchemaFreeze: All 20 subsystem schemas match frozen ordinal snapshot" {
    run python3 tools/schema-freeze.py check interface/ordinals.snapshot
    [ "$status" -eq 0 ]
    [[ "$output" =~ "schema freeze check passed" ]]
}

@test "Policy: capabilities.toml parses and conforms to Cap declarations" {
    run python3 tools/fs-policy.py validate policy/capabilities.toml
    [ "$status" -eq 0 ]
    [[ "$output" =~ "policy ok" ]]
}
