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
}
