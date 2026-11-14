#ifndef SAP_IDENTITY_H
#define SAP_IDENTITY_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#define SAP_DID_MAX_LEN 128
#define SAP_RP_ID_MAX 64
#define SAP_CRED_ID_LEN 32

typedef enum {
    SAP_IDENTITY_OK = 0,
    SAP_IDENTITY_ERR_INVALID_PARAM = -1,
    SAP_IDENTITY_ERR_SIG_INVALID = -2,
    SAP_IDENTITY_ERR_CRED_NOT_FOUND = -3,
    SAP_IDENTITY_ERR_CRYPTO_FAIL = -4,
} sap_identity_err_t;

typedef struct {
    uint8_t credential_id[SAP_CRED_ID_LEN];
    char rp_id[SAP_RP_ID_MAX]; // Relying Party ID (e.g. "sovereign.local", "matrix.org")
    uint8_t user_handle[32];
    uint8_t ed25519_pubkey[32];
    uint8_t private_seed[32];   // Sealed to hardware vault
    char did_key[SAP_DID_MAX_LEN];
    uint32_t sign_count;
} sap_passkey_credential_t;

typedef struct {
    uint8_t auth_data[37]; // 32-byte rp_id_hash + 1 byte flags + 4 bytes sign_count
    uint8_t signature[64]; // Detached signature
    uint32_t sign_count;
} sap_passkey_assertion_t;

// Initialize identity subsystem
int sap_identity_init(void);

// Generate canonical W3C did:key from Ed25519 public key using Base58BTC
int sap_identity_pubkey_to_did(const uint8_t ed25519_pubkey[32], char *out_did, size_t max_len);

// Register a hardware-bound Passkey credential for a relying party
int sap_identity_create_credential(const char *rp_id, const uint8_t user_handle[32], sap_passkey_credential_t *out_cred);

// Sign a WebAuthn / FIDO2 authentication assertion (challenge response)
int sap_identity_sign_assertion(sap_passkey_credential_t *cred, const uint8_t client_data_hash[32], sap_passkey_assertion_t *out_assertion);

// Verify a WebAuthn / FIDO2 authentication assertion
int sap_identity_verify_assertion(const sap_passkey_credential_t *cred, const uint8_t client_data_hash[32], const sap_passkey_assertion_t *assertion);

#endif // SAP_IDENTITY_H
