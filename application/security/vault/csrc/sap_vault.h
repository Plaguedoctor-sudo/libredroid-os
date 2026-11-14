#ifndef SAP_VAULT_H
#define SAP_VAULT_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#define SAP_VAULT_PCR_SELECTION_7 0x07 // Secure boot & dm-verity PCR
#define SAP_VAULT_DIGEST_LEN 32        // SHA-256
#define SAP_VAULT_MAX_PAYLOAD 1024
#define SAP_VAULT_SIG_LEN 32           // HMAC-SHA256 / Ed25519 signature
#define SAP_VAULT_NONCE_LEN 32

typedef enum {
    SAP_VAULT_OK = 0,
    SAP_VAULT_ERR_IO = -1,
    SAP_VAULT_ERR_TPM_COMM = -2,
    SAP_VAULT_ERR_PCR_MISMATCH = -3,
    SAP_VAULT_ERR_INVALID_PARAM = -4,
    SAP_VAULT_ERR_CRYPTO_FAIL = -5,
} sap_vault_err_t;

typedef enum {
    SAP_VAULT_BACKEND_HARDWARE_TPM2 = 1,
    SAP_VAULT_BACKEND_SW_ENCLAVE    = 2,
} sap_vault_backend_t;

typedef struct {
    uint32_t pcr_index;
    uint8_t pcr_digest[SAP_VAULT_DIGEST_LEN];
    uint32_t payload_len;
    uint8_t iv[16];
    uint8_t ciphertext[SAP_VAULT_MAX_PAYLOAD];
    uint8_t tag[SAP_VAULT_DIGEST_LEN]; // Auth tag / HMAC
} sap_sealed_object_t;

typedef struct {
    uint32_t pcr_index;
    uint8_t pcr_digest[SAP_VAULT_DIGEST_LEN];
    uint8_t nonce[SAP_VAULT_NONCE_LEN];
    uint64_t timestamp_ms;
    uint8_t quote_mac[SAP_VAULT_SIG_LEN];
    uint8_t ak_pubkey[SAP_VAULT_DIGEST_LEN];
} sap_tpm_quote_t;

// Initialize vault backend: detects /dev/tpmrm0 or initializes hardware-bound software enclave
int sap_vault_init(void);

// Get active backend
sap_vault_backend_t sap_vault_get_backend(void);

// Set or extend PCR value (used during dm-verity measurement registration)
int sap_vault_extend_pcr(uint32_t pcr_index, const uint8_t digest[SAP_VAULT_DIGEST_LEN]);

// Read current PCR value
int sap_vault_read_pcr(uint32_t pcr_index, uint8_t digest_out[SAP_VAULT_DIGEST_LEN]);

// Seal payload strictly to a PCR index and current PCR digest
int sap_vault_seal(uint32_t pcr_index, const uint8_t *payload, size_t payload_len, sap_sealed_object_t *out_obj);

// Unseal payload: enforces PCR equality; returns SAP_VAULT_ERR_PCR_MISMATCH if altered
int sap_vault_unseal(const sap_sealed_object_t *obj, uint8_t *out_payload, size_t max_out_len, size_t *out_len);

// Produce cryptographically signed attestation quote over PCR bank using caller nonce
int sap_vault_quote(uint32_t pcr_index, const uint8_t nonce[SAP_VAULT_NONCE_LEN], sap_tpm_quote_t *out_quote);

// Verify an attestation quote against expected nonce, expected PCR, and attestation key
int sap_vault_verify_quote(const sap_tpm_quote_t *quote, const uint8_t nonce[SAP_VAULT_NONCE_LEN], const uint8_t expected_pcr[SAP_VAULT_DIGEST_LEN]);

// Secure memory zeroize helper
void sap_vault_secure_wipe(void *v, size_t n);

#endif // SAP_VAULT_H
