#ifndef SAP_STORAGE_H
#define SAP_STORAGE_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#define SAP_STORAGE_MAX_APP_ID 64
#define SAP_STORAGE_MAX_PATH 512
#define SAP_STORAGE_KEY_LEN 32

typedef enum {
    SAP_STORAGE_OK = 0,
    SAP_STORAGE_ERR_IO = -1,
    SAP_STORAGE_ERR_INVALID_PARAM = -2,
    SAP_STORAGE_ERR_TAMPERED = -3,
    SAP_STORAGE_ERR_KEY_MISMATCH = -4,
    SAP_STORAGE_ERR_POLICY_FAILED = -5,
} sap_storage_err_t;

typedef struct {
    char app_id[SAP_STORAGE_MAX_APP_ID];
    char vault_path[SAP_STORAGE_MAX_PATH];
    uint8_t master_key_identifier[16];
    bool fscrypt_kernel_enforced;
    uint32_t quota_bytes;
} sap_app_vault_t;

// Initialize storage subsystem with base vault root directory
int sap_storage_init(const char *base_vault_root);

// Provision or open hermetic encrypted vault for an application ID
int sap_storage_provision_vault(const char *app_id, uint32_t quota_bytes, sap_app_vault_t *out_vault);

// Write an authenticated encrypted private file into application's vault
int sap_storage_write_encrypted(const char *app_id, const char *filename, const uint8_t *data, size_t len);

// Read and authenticate an encrypted private file from application's vault
int sap_storage_read_encrypted(const char *app_id, const char *filename, uint8_t *out_data, size_t max_len, size_t *out_len);

// Destroy application vault securely (purges directory)
int sap_storage_destroy_vault(const char *app_id);

#endif // SAP_STORAGE_H
