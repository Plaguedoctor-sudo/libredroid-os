/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * FreeStack Sovereign App-Facing Keystore API (Task 5.9)
 * Clean C API backed by TPM2/SoftHSM2 and local kernel keyring.
 */

#ifndef FREESTACK_KEYSTORE_H
#define FREESTACK_KEYSTORE_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#define FS_KEYSTORE_SOCKET "/run/freestack/keystore.sock"
#define FS_KEYSTORE_MAX_ALIAS_LEN 64
#define FS_KEYSTORE_MAX_SIG_LEN   512
#define FS_KEYSTORE_MAX_BLOB_LEN  4096

typedef enum {
    FS_KEY_SUCCESS = 0,
    FS_KEY_ERR_INVALID_PARAM = -1,
    FS_KEY_ERR_NOT_FOUND = -2,
    FS_KEY_ERR_PERMISSION_DENIED = -3,
    FS_KEY_ERR_CRYPTO_FAILED = -4,
    FS_KEY_ERR_COMMUNICATION = -5,
    FS_KEY_ERR_TPM_SEAL = -6,
    FS_KEY_ERR_ALREADY_EXISTS = -7
} fs_keystore_status_t;

typedef enum {
    FS_ALG_ED25519 = 1,
    FS_ALG_RSA_3072 = 2,
    FS_ALG_ECDSA_P256 = 3,
    FS_ALG_AES_256_GCM = 4
} fs_key_algorithm_t;

typedef enum {
    FS_PURPOSE_SIGN = (1 << 0),
    FS_PURPOSE_VERIFY = (1 << 1),
    FS_PURPOSE_ENCRYPT = (1 << 2),
    FS_PURPOSE_DECRYPT = (1 << 3),
    FS_PURPOSE_ATTEST = (1 << 4)
} fs_key_purpose_t;

typedef struct {
    char alias[FS_KEYSTORE_MAX_ALIAS_LEN];
    fs_key_algorithm_t algorithm;
    uint32_t purpose_mask;
    bool hardware_backed;
    bool user_presence_required;
    uint64_t created_at;
} fs_key_descriptor_t;

typedef struct {
    uint8_t pcr_digest[32];
    uint8_t signature[FS_KEYSTORE_MAX_SIG_LEN];
    size_t sig_len;
    uint64_t timestamp;
} fs_attestation_record_t;

typedef struct fs_keystore_ctx fs_keystore_ctx_t;

/* Lifecycle */
fs_keystore_ctx_t* fs_keystore_open(const char *socket_override);
void fs_keystore_close(fs_keystore_ctx_t *ctx);

/* Key Management */
fs_keystore_status_t fs_keystore_generate_key(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    fs_key_algorithm_t alg,
    uint32_t purpose_mask,
    bool hardware_backed
);

fs_keystore_status_t fs_keystore_get_descriptor(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    fs_key_descriptor_t *out_desc
);

fs_keystore_status_t fs_keystore_delete_key(
    fs_keystore_ctx_t *ctx,
    const char *alias
);

/* Cryptographic Operations */
fs_keystore_status_t fs_keystore_sign(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    const uint8_t *digest,
    size_t digest_len,
    uint8_t *out_sig,
    size_t *out_sig_len
);

fs_keystore_status_t fs_keystore_verify(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    const uint8_t *digest,
    size_t digest_len,
    const uint8_t *sig,
    size_t sig_len,
    bool *out_verified
);

fs_keystore_status_t fs_keystore_encrypt(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    const uint8_t *plaintext,
    size_t pt_len,
    uint8_t *out_ciphertext,
    size_t *out_ct_len
);

fs_keystore_status_t fs_keystore_decrypt(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    const uint8_t *ciphertext,
    size_t ct_len,
    uint8_t *out_plaintext,
    size_t *out_pt_len
);

/* Hardware Attestation */
fs_keystore_status_t fs_keystore_attest(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    const uint8_t *nonce,
    size_t nonce_len,
    fs_attestation_record_t *out_attestation
);

#ifdef __cplusplus
}
#endif

#endif /* FREESTACK_KEYSTORE_H */
