#ifndef SAP_CAPABILITY_H
#define SAP_CAPABILITY_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#define SAP_CAP_ID_LEN 32
#define SAP_CAP_RES_MAX 128
#define SAP_CAP_ENTITY_MAX 64
#define SAP_CAP_SIG_LEN 32

/* Capability Bitmask Permissions */
#define SAP_PERM_READ            (1U << 0)
#define SAP_PERM_WRITE           (1U << 1)
#define SAP_PERM_EXECUTE         (1U << 2)
#define SAP_PERM_LEASE_EPHEMERAL (1U << 3)
#define SAP_PERM_HARDWARE_DIRECT (1U << 4)

typedef enum {
    SAP_CAP_OK = 0,
    SAP_CAP_ERR_INVALID_PARAM = -1,
    SAP_CAP_ERR_EXPIRED       = -2,
    SAP_CAP_ERR_RES_MISMATCH  = -3,
    SAP_CAP_ERR_PERM_DENIED   = -4,
    SAP_CAP_ERR_FORGED_SIG    = -5,
    SAP_CAP_ERR_REVOKED       = -6,
    SAP_CAP_ERR_RECIPIENT_MISMATCH = -7,
} sap_cap_err_t;

typedef struct {
    uint8_t id[SAP_CAP_ID_LEN];
    char resource_id[SAP_CAP_RES_MAX];
    char issuer[SAP_CAP_ENTITY_MAX];
    char recipient[SAP_CAP_ENTITY_MAX];
    uint32_t permissions;
    uint64_t issued_at_ns;
    uint64_t expires_at_ns;
    uint8_t auth_signature[SAP_CAP_SIG_LEN];
} sap_cap_handle_t;

// Initialize capability authority
int sap_capability_init(void);

// Issue cryptographically signed ephemeral capability lease
int sap_capability_issue_lease(const char *resource_id, const char *recipient, uint32_t permissions, uint64_t duration_ns, sap_cap_handle_t *out_handle);

// Verify that a capability handle grants requested permissions to calling recipient
int sap_capability_verify_access(const sap_cap_handle_t *handle, const char *caller_recipient, const char *resource_id, uint32_t requested_perm);

// Attenuate parent capability to child with strictly reduced permissions or sub-resource
int sap_capability_attenuate(const sap_cap_handle_t *parent, uint32_t child_perms, const char *sub_resource, sap_cap_handle_t *out_child);

// Revoke capability by ID
int sap_capability_revoke(const uint8_t id[SAP_CAP_ID_LEN]);

#endif // SAP_CAPABILITY_H
