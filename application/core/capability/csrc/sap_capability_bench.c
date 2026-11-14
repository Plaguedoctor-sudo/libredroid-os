#define _GNU_SOURCE
#include "sap_capability.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <time.h>

static double get_time_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec * 1000.0 + ts.tv_nsec / 1000000.0;
}

static size_t get_peak_rss_kb(void) {
    FILE *fp = fopen("/proc/self/status", "r");
    if (!fp) return 0;
    char line[256];
    size_t peak_rss = 0;
    while (fgets(line, sizeof(line), fp)) {
        if (strncmp(line, "VmHWM:", 6) == 0) {
            sscanf(line + 6, "%zu", &peak_rss);
            break;
        }
    }
    fclose(fp);
    return peak_rss;
}

int main(void) {
    printf("========================================================\n");
    printf("SAP Hardware Capability Token & Lease Invariant Bench\n");
    printf("========================================================\n");

    int rc = sap_capability_init();
    assert(rc == SAP_CAP_OK);
    printf("[PASS] sap_capability_init succeeded\n");

    /* 1. Issue Ephemeral Capability Lease */
    sap_cap_handle_t cap;
    double t0 = get_time_ms();
    rc = sap_capability_issue_lease("hw.camera", "org.sovereign.camera",
                                    SAP_PERM_READ | SAP_PERM_HARDWARE_DIRECT,
                                    5000000000ULL, // 5 seconds
                                    &cap);
    double t_issue = get_time_ms() - t0;
    assert(rc == SAP_CAP_OK);
    printf("[PASS] Capability lease issued in %.3f ms (Resource: %s, Recipient: %s, Perms: 0x%x)\n",
           t_issue, cap.resource_id, cap.recipient, cap.permissions);

    /* 2. Verify Valid Access Request */
    t0 = get_time_ms();
    rc = sap_capability_verify_access(&cap, "org.sovereign.camera", "hw.camera/front", SAP_PERM_READ);
    double t_verify = get_time_ms() - t0;
    assert(rc == SAP_CAP_OK);
    printf("[PASS] Valid access verified in %.3f ms (Prefix match: hw.camera/front)\n", t_verify);

    /* 3. Capability Attenuation (Parent -> Child Derivation) */
    sap_cap_handle_t child_cap;
    t0 = get_time_ms();
    rc = sap_capability_attenuate(&cap, SAP_PERM_READ, "front", &child_cap);
    double t_att = get_time_ms() - t0;
    assert(rc == SAP_CAP_OK);
    assert(child_cap.permissions == SAP_PERM_READ);
    assert(strcmp(child_cap.resource_id, "hw.camera/front") == 0);
    printf("[PASS] Capability attenuated in %.3f ms: %s (Perms: 0x%x)\n",
           t_att, child_cap.resource_id, child_cap.permissions);

    /* 4. Negative Invariant Gate #1: Stolen Token / Cross-App Impersonation */
    printf("--> Testing Negative Token Impersonation Gate...\n");
    rc = sap_capability_verify_access(&cap, "org.hostile.malware", "hw.camera/front", SAP_PERM_READ);
    assert(rc == SAP_CAP_ERR_RECIPIENT_MISMATCH);
    printf("  [PASS] Stolen token rejected (rc = %d, SAP_CAP_ERR_RECIPIENT_MISMATCH)\n", rc);

    /* 5. Negative Invariant Gate #2: Cryptographic Tampering */
    printf("--> Testing Negative Cryptographic Tamper Gate...\n");
    sap_cap_handle_t forged_cap = cap;
    forged_cap.permissions |= SAP_PERM_WRITE; // Attempt privilege escalation without re-signing
    rc = sap_capability_verify_access(&forged_cap, "org.sovereign.camera", "hw.camera/front", SAP_PERM_READ);
    assert(rc == SAP_CAP_ERR_FORGED_SIG);
    printf("  [PASS] Forged token rejected (rc = %d, SAP_CAP_ERR_FORGED_SIG)\n", rc);

    /* 6. Negative Invariant Gate #3: Permission Denial */
    printf("--> Testing Negative Permission Denial Gate...\n");
    rc = sap_capability_verify_access(&child_cap, "org.sovereign.camera", "hw.camera/front", SAP_PERM_WRITE);
    assert(rc == SAP_CAP_ERR_PERM_DENIED);
    printf("  [PASS] Escalated write permission denied on read-only child token (rc = %d)\n", rc);

    /* 7. Revocation Gate */
    printf("--> Testing Dynamic Revocation Gate...\n");
    rc = sap_capability_revoke(cap.id);
    assert(rc == SAP_CAP_OK);
    rc = sap_capability_verify_access(&cap, "org.sovereign.camera", "hw.camera/front", SAP_PERM_READ);
    assert(rc == SAP_CAP_ERR_REVOKED);
    printf("  [PASS] Revoked capability rejected immediately (rc = %d, SAP_CAP_ERR_REVOKED)\n", rc);

    size_t peak_rss = get_peak_rss_kb();
    printf("--> Peak Capability RSS: %zu KB (Budget: <= 4096 KB)\n", peak_rss);
    printf("========================================================\n");
    printf("ALL HARDWARE CAPABILITY INVARIANTS VERIFIED 100%% GREEN\n");
    printf("========================================================\n");
    return 0;
}
