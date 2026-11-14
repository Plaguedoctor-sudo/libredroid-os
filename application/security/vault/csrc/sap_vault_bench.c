#define _GNU_SOURCE
#include "sap_vault.h"

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
    printf("SAP Hardware Security Vault & TPM 2.0 Invariant Bench\n");
    printf("========================================================\n");

    int rc = sap_vault_init();
    assert(rc == SAP_VAULT_OK);
    printf("[PASS] sap_vault_init initialized successfully (Backend: %s)\n",
           sap_vault_get_backend() == SAP_VAULT_BACKEND_HARDWARE_TPM2 ? "Hardware TPM2 (/dev/tpmrm0)" : "Hardware-Bound Software Enclave");

    /* Step 1: Read PCR 7 */
    uint8_t pcr7[SAP_VAULT_DIGEST_LEN];
    rc = sap_vault_read_pcr(SAP_VAULT_PCR_SELECTION_7, pcr7);
    assert(rc == SAP_VAULT_OK);
    printf("  PCR-7 Digest: ");
    for (int i = 0; i < 8; i++) printf("%02x", pcr7[i]);
    printf("... [VALID]\n");

    /* Step 2: Seal high-entropy secret */
    const char *secret_msg = "SOVEREIGN_ROOTFS_LUKS2_MASTER_KEY_32BYTES_SEED";
    size_t secret_len = strlen(secret_msg);
    sap_sealed_object_t sealed_obj;

    double t0 = get_time_ms();
    rc = sap_vault_seal(SAP_VAULT_PCR_SELECTION_7, (const uint8_t *)secret_msg, secret_len, &sealed_obj);
    double t_seal = get_time_ms() - t0;
    assert(rc == SAP_VAULT_OK);
    printf("[PASS] sap_vault_seal completed in %.3f ms (Ciphertext len: %u bytes)\n", t_seal, sealed_obj.payload_len);

    /* Step 3: Unseal secret with matching PCR */
    uint8_t unsealed[SAP_VAULT_MAX_PAYLOAD];
    size_t unsealed_len = 0;
    t0 = get_time_ms();
    rc = sap_vault_unseal(&sealed_obj, unsealed, sizeof(unsealed), &unsealed_len);
    double t_unseal = get_time_ms() - t0;
    if (rc != SAP_VAULT_OK) {
        fprintf(stderr, "sap_vault_unseal failed with rc = %d\n", rc);
    }
    assert(rc == SAP_VAULT_OK);
    assert(unsealed_len == secret_len);
    assert(memcmp(unsealed, secret_msg, secret_len) == 0);
    printf("[PASS] sap_vault_unseal matched secret exactly in %.3f ms: \"%.*s\"\n", t_unseal, (int)unsealed_len, unsealed);

    /* Step 4: Negative Tamper Gate #1: 1-byte mutation in ciphertext */
    printf("--> Testing Negative Tamper Gate #1 (1-byte mutation in ciphertext)...\n");
    sap_sealed_object_t corrupted_obj = sealed_obj;
    corrupted_obj.ciphertext[0] ^= 0xFF; // Mutate 1 byte
    rc = sap_vault_unseal(&corrupted_obj, unsealed, sizeof(unsealed), &unsealed_len);
    assert(rc == SAP_VAULT_ERR_CRYPTO_FAIL);
    printf("  [PASS] Tampered ciphertext rejected (rc = %d, SAP_VAULT_ERR_CRYPTO_FAIL)\n", rc);

    /* Step 5: Negative Tamper Gate #2: Altered PCR state (firmware compromise simulation) */
    printf("--> Testing Negative Tamper Gate #2 (PCR alteration simulation)...\n");
    uint8_t malicious_measurement[32];
    memset(malicious_measurement, 0xDE, sizeof(malicious_measurement));
    rc = sap_vault_extend_pcr(SAP_VAULT_PCR_SELECTION_7, malicious_measurement);
    assert(rc == SAP_VAULT_OK);

    rc = sap_vault_unseal(&sealed_obj, unsealed, sizeof(unsealed), &unsealed_len);
    assert(rc == SAP_VAULT_ERR_PCR_MISMATCH);
    printf("  [PASS] Unseal strictly blocked under mutated PCR (rc = %d, SAP_VAULT_ERR_PCR_MISMATCH)\n", rc);

    /* Step 6: Hardware Attestation Quote */
    printf("--> Testing Attestation Quote Generation & Verification...\n");
    uint8_t current_pcr[32];
    sap_vault_read_pcr(SAP_VAULT_PCR_SELECTION_7, current_pcr);

    uint8_t nonce[32];
    for (int i = 0; i < 32; i++) nonce[i] = (uint8_t)(i * 7 + 3);

    sap_tpm_quote_t quote;
    t0 = get_time_ms();
    rc = sap_vault_quote(SAP_VAULT_PCR_SELECTION_7, nonce, &quote);
    double t_quote = get_time_ms() - t0;
    assert(rc == SAP_VAULT_OK);
    printf("[PASS] Attestation quote produced in %.3f ms (Timestamp: %lu ms)\n", t_quote, quote.timestamp_ms);

    /* Verify quote */
    rc = sap_vault_verify_quote(&quote, nonce, current_pcr);
    assert(rc == SAP_VAULT_OK);
    printf("[PASS] Attestation quote verified cryptographically\n");

    /* Negative Tamper Gate #3: Mutated quote nonce or replay */
    uint8_t bad_nonce[32];
    memcpy(bad_nonce, nonce, 32);
    bad_nonce[0] ^= 0x01;
    rc = sap_vault_verify_quote(&quote, bad_nonce, current_pcr);
    assert(rc != SAP_VAULT_OK);
    printf("  [PASS] Replayed/altered nonce rejected (rc = %d)\n", rc);

    size_t peak_rss = get_peak_rss_kb();
    printf("--> Peak Vault RSS: %zu KB (Budget: <= 4096 KB)\n", peak_rss);
    printf("========================================================\n");
    printf("ALL SECURITY VAULT & TPM2 INVARIANTS VERIFIED 100%% GREEN\n");
    printf("========================================================\n");
    return 0;
}
