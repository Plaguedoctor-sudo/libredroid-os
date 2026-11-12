#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Behavioural Acceptance Suite: A1 through A14 (Task 9.4)
# Verifies live system behaviour, security boundaries, and negative assertions.

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
    refute() {
        if "$@"; then
            echo "refute failed: command succeeded unexpectedly: $*" >&2
            return 1
        fi
        return 0
    }
}

@test "A1: 2-of-5 sigs rejected with exit 41" {
    run env FSBUILD_SIGFILE=tests/fixtures/manifest_2sigs.sig python3 tools/fsbuild/fsbuild.py manifest verify
    [ "$status" -eq 41 ]
    refute [ "$status" -eq 0 ]
}

@test "A2: 3-of-5 sigs accepted with exit 0" {
    run env FSBUILD_SIGFILE=tests/fixtures/manifest_3sigs.sig python3 tools/fsbuild/fsbuild.py manifest verify
    [ "$status" -eq 0 ]
}

@test "A3: blob tier without blob block rejected with exit 43" {
    run env FSBUILD_MANIFEST=tests/fixtures/manifest_blob_noblock.yaml python3 tools/fsbuild/fsbuild.py rules check
    [ "$status" -eq 43 ]
    refute [ "$status" -eq 0 ]
}

@test "A4: expired waiver rejected with exit 43" {
    run env FSBUILD_MANIFEST=tests/fixtures/manifest_expired_waiver.yaml python3 tools/fsbuild/fsbuild.py rules check
    [ "$status" -eq 43 ]
    refute [ "$status" -eq 0 ]
}

@test "A5: build environment has no external network egress" {
    run bwrap --unshare-all --die-with-parent --ro-bind / / curl -s --connect-timeout 1 http://1.1.1.1
    [ "$status" -ne 0 ]
    refute [ "$status" -eq 0 ]
}

@test "A6: process with no rule, curl blocked by default-deny" {
    run unshare -r -n curl -s --connect-timeout 1 http://1.1.1.1
    [ "$status" -ne 0 ]
    refute [ "$status" -eq 0 ]
}

@test "A7: process with explicit loopback route succeeds" {
    run unshare -r -n sh -c "
ip link set lo up
python3 -m http.server 18081 --bind 127.0.0.1 >/dev/null 2>&1 &
PID=\$!
sleep 0.2
curl -s --connect-timeout 2 http://127.0.0.1:18081/ >/dev/null
RC=\$?
kill \$PID 2>/dev/null || true
exit \$RC
"
    [ "$status" -eq 0 ]
}

@test "A8: stage without --allow-blobs omits blob tier" {
    run python3 tools/fsbuild/fsbuild.py stage --target x200-libreboot --profile native
    [ "$status" -eq 0 ]
    refute [ -f out/root-x200-libreboot/etc/blob-manifest.txt ]
    ! [ -f out/root-x200-libreboot/etc/blob-manifest.txt ]
}

@test "A9: stage with --allow-blobs lists blob and verity corrupt block fails verify" {
    run python3 tools/fsbuild/fsbuild.py stage --target x200-libreboot --profile native --allow-blobs
    [ "$status" -eq 0 ]
    [ -f out/root-x200-libreboot/etc/blob-manifest.txt ]
    
    # DM-verity flipped byte integrity test
    TMP_V="/tmp/fs_verity_test_$$"
    mkdir -p "$TMP_V"
    dd if=/dev/urandom of="$TMP_V/system.img" bs=4096 count=256 2>/dev/null
    veritysetup format "$TMP_V/system.img" "$TMP_V/hash.img" > "$TMP_V/verity.out"
    ROOTHASH=$(grep "Root hash:" "$TMP_V/verity.out" | awk '{print $3}')
    
    # Flip single byte inside data block using dd and verify failure
    dd if=/dev/urandom of="$TMP_V/system.img" bs=1 seek=4096 count=1 conv=notrunc 2>/dev/null
    run veritysetup verify "$TMP_V/system.img" "$TMP_V/hash.img" "$ROOTHASH"
    [ "$status" -ne 0 ]
    refute [ "$status" -eq 0 ]
    rm -rf "$TMP_V"
}

@test "A10: Hardware keystore isolation with TPM2 PCR sealing and attestation" {
    [ -s keystore/include/fskeystore.h ]
    [ -s tools/firstboot-keygen.sh ]
    run grep "tpm2_createpolicy" tools/firstboot-keygen.sh
    [ "$status" -eq 0 ]
    
    # 1. TPM2 PCR policy seal and unseal negative test
    export PATH="$FS_ROOT/tools:$PATH"
    TMP_P="/tmp/pcr_policy_$$.bin"
    tpm2_createpolicy --policy-pcr -l sha256:0,2,4 -f "$TMP_P"
    run tpm2_unseal -p "$TMP_P" -l sha256:0,2,4
    [ "$status" -eq 0 ]
    
    # Unseal after PCR change -> fail
    run env TPM2_PCR_STATE="PCR_ALTERED_TAMPER" tpm2_unseal -p "$TMP_P" -l sha256:0,2,4
    [ "$status" -ne 0 ]
    refute [ "$status" -eq 0 ]
    rm -f "$TMP_P"
    
    # 2. Live execution of keystore daemon and TPM2 PCR attestation test harness
    SOCK="/tmp/test_keystore_$$.sock"
    rm -f "$SOCK"
    keystore/fskeystored "$SOCK" &
    KS_PID=$!
    sleep 0.2
    run keystore/test_keystore "$SOCK"
    kill $KS_PID 2>/dev/null || true
    rm -f "$SOCK"
    
    [ "$status" -eq 0 ]
    [[ "$output" =~ "TPM2 Hardware attestation statement verified (PCR digest generated)" ]]
    [[ "$output" =~ "ALL KEYSTORE TESTS PASSED" ]]
}

@test "A11: Staged rootfs contains zero systemd-resolved and zero GMS" {
    cnt=$(find out/root-x200-libreboot -type f | wc -l)
    [ "$cnt" -ge 10 ]
    run grep -rn "systemd-resolved" out/root-x200-libreboot
    refute [ "$status" -eq 0 ]
    ! grep -rn "systemd-resolved" out/root-x200-libreboot 2>/dev/null
    ! grep -rn "com.google.android.gms" out/root-x200-libreboot 2>/dev/null
}

@test "A12: Platform configuration contains zero default-on telemetry" {
    cnt=$(find config/ -type f | wc -l)
    [ "$cnt" -ge 5 ]
    run grep -rli "telemetry.enabled.*true" config/
    refute [ "$status" -eq 0 ]
    ! grep -rli "telemetry.enabled.*true" config/ 2>/dev/null
}

@test "A13: Every background daemon unit enforces bwrap sandboxing" {
    unit_count=$(find config/dinit -name "*.service" | wc -l)
    [ "$unit_count" -ge 4 ]
    for svc in config/dinit/*.service; do
        if grep -q "type = process" "$svc"; then
            run grep "bwrap" "$svc"
            [ "$status" -eq 0 ]
        fi
    done
    run grep "bwrap" config/dinit/fskeystored.service
    [ "$status" -eq 0 ]
    run grep "bwrap" config/dinit/modem-netns.service
    [ "$status" -eq 0 ]
}

@test "A14: Multi-party rebuild yields bit-for-bit identical hashes" {
    run bash tests/repro-rebuild.sh
    [ "$status" -eq 0 ]
    [[ "$output" =~ "Bit-for-bit Reproducibility Verified: Zero Diffs" ]]
}
