#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later
# Test suite for fsctl machine-interface CLI (ADR 0003 & FSCtl.md)

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/../.." && pwd)"
    export PATH="$FS_ROOT/tools:$PATH"
}

@test "fsctl net status returns valid JSON envelope" {
    run fsctl net status --json
    [ "$status" -eq 0 ]
    [[ "$output" =~ "schemaVersion" ]]
    [[ "$output" =~ "defaultDeny" ]]
}

@test "fsctl power profile setting is idempotent and supports --dry-run" {
    run fsctl power setProfile saver --dry-run --json
    [ "$status" -eq 0 ]
    [[ "$output" =~ "dryRun" ]]

    run fsctl power setProfile saver --json
    [ "$status" -eq 0 ]
    [[ "$output" =~ "saver" ]]
}

@test "fsctl perm grant distributes capability with scope" {
    run fsctl perm grant com.example.app netDns example.org --json
    [ "$status" -eq 0 ]
    [[ "$output" =~ "com.example.app" ]]
    [[ "$output" =~ "netDns" ]]
    [[ "$output" =~ "granted" ]]
}

@test "fsctl update check returns structured version and slot state" {
    run fsctl update check --json
    [ "$status" -eq 0 ]
    [[ "$output" =~ "activeSlot" ]]
}

@test "fsctl unknown command returns code 66 (notFound)" {
    run fsctl non_existent_subsystem foo --json
    [ "$status" -eq 66 ]
    [[ "$output" =~ "Unknown subsystem group" ]]
}
