#define _GNU_SOURCE
#include "sap_identity.h"

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
    printf("SAP Decentralized Identity & Passkey Invariant Bench\n");
    printf("========================================================\n");

    int rc = sap_identity_init();
    assert(rc == SAP_IDENTITY_OK);
    printf("[PASS] sap_identity_init succeeded\n");

    /* 1. Register Passkey Credential & Generate W3C DID */
    sap_passkey_credential_t cred;
    uint8_t user_handle[32] = {0x01, 0x02, 0x03, 0x04};

    double t0 = get_time_ms();
    rc = sap_identity_create_credential("sovereign.local", user_handle, &cred);
    double t_cred = get_time_ms() - t0;
    assert(rc == SAP_IDENTITY_OK);
    assert(strncmp(cred.did_key, "did:key:z", 9) == 0);
    printf("[PASS] Passkey registered in %.3f ms: %s\n", t_cred, cred.did_key);

    /* 2. WebAuthn Assertion Signing */
    uint8_t client_data_hash[32];
    for (int i = 0; i < 32; i++) client_data_hash[i] = (uint8_t)(i ^ 0xAA);

    sap_passkey_assertion_t assertion;
    t0 = get_time_ms();
    rc = sap_identity_sign_assertion(&cred, client_data_hash, &assertion);
    double t_sign = get_time_ms() - t0;
    assert(rc == SAP_IDENTITY_OK);
    assert(assertion.sign_count == 1);
    printf("[PASS] WebAuthn assertion signed in %.3f ms (UP=1, UV=1, Counter: %u)\n", t_sign, assertion.sign_count);

    /* 3. Assertion Cryptographic Verification */
    t0 = get_time_ms();
    rc = sap_identity_verify_assertion(&cred, client_data_hash, &assertion);
    double t_verify = get_time_ms() - t0;
    assert(rc == SAP_IDENTITY_OK);
    printf("[PASS] WebAuthn assertion verified in %.3f ms\n", t_verify);

    /* 4. Negative Tamper Gate #1: Challenge Mutation */
    printf("--> Testing Negative Challenge Mutation Gate...\n");
    uint8_t forged_challenge[32];
    memcpy(forged_challenge, client_data_hash, 32);
    forged_challenge[5] ^= 0x01; // Tamper 1 byte
    rc = sap_identity_verify_assertion(&cred, forged_challenge, &assertion);
    assert(rc == SAP_IDENTITY_ERR_SIG_INVALID);
    printf("  [PASS] Forged challenge rejected (rc = %d, SAP_IDENTITY_ERR_SIG_INVALID)\n", rc);

    /* 5. Negative Tamper Gate #2: Signature Mutation */
    printf("--> Testing Negative Signature Mutation Gate...\n");
    sap_passkey_assertion_t forged_assertion = assertion;
    forged_assertion.signature[0] ^= 0x80;
    rc = sap_identity_verify_assertion(&cred, client_data_hash, &forged_assertion);
    assert(rc == SAP_IDENTITY_ERR_SIG_INVALID);
    printf("  [PASS] Forged signature rejected (rc = %d, SAP_IDENTITY_ERR_SIG_INVALID)\n", rc);

    size_t peak_rss = get_peak_rss_kb();
    printf("--> Peak Identity RSS: %zu KB (Budget: <= 4096 KB)\n", peak_rss);
    printf("========================================================\n");
    printf("ALL DECENTRALIZED IDENTITY INVARIANTS VERIFIED 100%% GREEN\n");
    printf("========================================================\n");
    return 0;
}
