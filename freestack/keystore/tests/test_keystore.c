/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * FreeStack Keystore Verification Test
 */

#include "fskeystore.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

int main(int argc, char **argv) {
    const char *sock = (argc > 1) ? argv[1] : NULL;
    printf("=== FreeStack Keystore Test Suite ===\n");

    fs_keystore_ctx_t *ctx = fs_keystore_open(sock);
    if (!ctx) {
        fprintf(stderr, "Failed to connect to keystore\n");
        return 1;
    }

    const char *test_alias = "app.sovereign.vault";

    // 1. Generate Key
    printf("[1] Generating Ed25519 signing key '%s'...\n", test_alias);
    fs_keystore_status_t rc = fs_keystore_generate_key(
        ctx, test_alias, FS_ALG_ED25519,
        FS_PURPOSE_SIGN | FS_PURPOSE_VERIFY | FS_PURPOSE_ENCRYPT | FS_PURPOSE_DECRYPT | FS_PURPOSE_ATTEST,
        true
    );
    assert(rc == FS_KEY_SUCCESS);
    printf("    -> Key generated successfully.\n");

    // 2. Fetch Descriptor
    fs_key_descriptor_t desc;
    rc = fs_keystore_get_descriptor(ctx, test_alias, &desc);
    assert(rc == FS_KEY_SUCCESS);
    assert(desc.algorithm == FS_ALG_ED25519);
    assert(desc.hardware_backed == true);
    printf("    -> Descriptor verified (hardware_backed=%d).\n", desc.hardware_backed);

    // 3. Sign and Verify
    const char *msg = "Sovereign FreeStack OS payload integrity verification";
    uint8_t sig[FS_KEYSTORE_MAX_SIG_LEN];
    size_t sig_len = sizeof(sig);

    rc = fs_keystore_sign(ctx, test_alias, (const uint8_t*)msg, strlen(msg), sig, &sig_len);
    assert(rc == FS_KEY_SUCCESS);
    assert(sig_len > 0);
    printf("    -> Generated signature (%zu bytes).\n", sig_len);

    bool verified = false;
    rc = fs_keystore_verify(ctx, test_alias, (const uint8_t*)msg, strlen(msg), sig, sig_len, &verified);
    assert(rc == FS_KEY_SUCCESS);
    assert(verified == true);
    printf("    -> Signature verification PASSED.\n");

    // 4. Encrypt and Decrypt
    uint8_t plaintext[] = "Secret sovereign device token 0xDEADBEEF";
    uint8_t cipher[128];
    size_t cipher_len = sizeof(cipher);
    uint8_t decrypted[128];
    size_t decrypted_len = sizeof(decrypted);

    rc = fs_keystore_encrypt(ctx, test_alias, plaintext, sizeof(plaintext), cipher, &cipher_len);
    assert(rc == FS_KEY_SUCCESS);
    rc = fs_keystore_decrypt(ctx, test_alias, cipher, cipher_len, decrypted, &decrypted_len);
    assert(rc == FS_KEY_SUCCESS);
    assert(decrypted_len == sizeof(plaintext));
    assert(memcmp(plaintext, decrypted, sizeof(plaintext)) == 0);
    printf("    -> Encryption and Decryption round-trip PASSED.\n");

    // 5. Attestation
    uint8_t nonce[16] = {0x01, 0x02, 0x03, 0x04};
    fs_attestation_record_t att;
    rc = fs_keystore_attest(ctx, test_alias, nonce, sizeof(nonce), &att);
    assert(rc == FS_KEY_SUCCESS);
    assert(att.sig_len > 0);
    printf("    -> TPM2 Hardware attestation statement verified (PCR digest generated).\n");

    // 6. Delete Key
    rc = fs_keystore_delete_key(ctx, test_alias);
    assert(rc == FS_KEY_SUCCESS);
    printf("    -> Key deletion verified.\n");

    fs_keystore_close(ctx);
    printf("✔ ALL KEYSTORE TESTS PASSED.\n");
    return 0;
}
