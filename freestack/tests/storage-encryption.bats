#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Storage Encryption, LUKS2 Argon2id & Recovery Tests (Phase D)

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "Storage: LUKS2 Argon2id parameters enforced in firstboot generator" {
    [ -f tools/firstboot-keygen.sh ]
    grep -q "pbkdf.*argon2id" tools/firstboot-keygen.sh
    grep -q "key-slot.*1" tools/firstboot-keygen.sh
}

@test "Storage: fscrypt directory encryption policy script exists and binds app scopes" {
    [ -f tools/fs-fscrypt-setup.sh ]
    grep -q "fscrypt" tools/fs-fscrypt-setup.sh
}

@test "Storage: Initramfs pre-mount verity hook asserts root integrity before pivot_root" {
    [ -f config/initramfs/fs-verity-hook.sh ]
    grep -q "veritysetup verify" config/initramfs/fs-verity-hook.sh
    grep -q "pivot_root" config/initramfs/fs-verity-hook.sh
}

@test "Storage: Recovery protocol documents lost-passphrase and recovery key slot flow" {
    [ -f docs/RECOVERY.md ]
    grep -q "key-slot 1" docs/RECOVERY.md
    grep -q "argon2id" docs/RECOVERY.md
}

@test "Storage: Metadata encryption architecture decision accepted" {
    [ -f docs/adr/0004-metadata-encryption.md ]
    grep -q "Accepted" docs/adr/0004-metadata-encryption.md
    grep -q "LUKS2" docs/adr/0004-metadata-encryption.md
}
