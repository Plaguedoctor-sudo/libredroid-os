#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A10: Hardware keystore isolation with TPM2 PCR sealing" {
    [ -f keystore/include/fskeystore.h ]
    [ -f tools/firstboot-keygen.sh ]
    grep -q "tpm2_createpolicy" tools/firstboot-keygen.sh

    # Real keystore daemon IPC verification
    SOCK="/tmp/fskeystore-test-$$.sock"
    rm -f "$SOCK"
    ./keystore/fskeystored "$SOCK" &
    DAEMON_PID=$!
    sleep 0.3
    run ./keystore/test_keystore "$SOCK"
    kill $DAEMON_PID 2>/dev/null || true
    rm -f "$SOCK"
    [ "$status" -eq 0 ]
    [[ "$output" =~ "ALL KEYSTORE TESTS PASSED" ]]
}
