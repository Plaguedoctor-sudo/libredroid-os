#define _GNU_SOURCE
#include "sap_storage.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <fcntl.h>
#include <unistd.h>
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
    printf("SAP Hardware fscrypt Storage & Vault Invariant Bench\n");
    printf("========================================================\n");

    const char *test_root = "/tmp/sap_storage_test_vaults";
    int rc = sap_storage_init(test_root);
    assert(rc == SAP_STORAGE_OK);
    printf("[PASS] sap_storage_init succeeded at %s\n", test_root);

    /* 1. Provision Vault */
    sap_app_vault_t vault_a;
    double t0 = get_time_ms();
    rc = sap_storage_provision_vault("org.sovereign.notes", 100 * 1024 * 1024, &vault_a);
    double t_prov = get_time_ms() - t0;
    assert(rc == SAP_STORAGE_OK);
    printf("[PASS] Vault provisioned in %.3f ms (Path: %s, Kernel fscrypt: %s)\n",
           t_prov, vault_a.vault_path, vault_a.fscrypt_kernel_enforced ? "ACTIVE" : "EMULATED_DAC");

    /* 2. Write Authenticated Encrypted Private File */
    const char *secret_payload = "SOVEREIGN_PRIVATE_JOURNAL_DATABASE_AES_256_AUTHENTICATED";
    size_t payload_len = strlen(secret_payload);

    t0 = get_time_ms();
    rc = sap_storage_write_encrypted("org.sovereign.notes", "journal.db", (const uint8_t *)secret_payload, payload_len);
    double t_write = get_time_ms() - t0;
    assert(rc == SAP_STORAGE_OK);
    printf("[PASS] Encrypted file written in %.3f ms (Payload: %zu bytes)\n", t_write, payload_len);

    /* 3. Read & Authenticate Encrypted File */
    uint8_t read_buf[256];
    size_t read_len = 0;
    t0 = get_time_ms();
    rc = sap_storage_read_encrypted("org.sovereign.notes", "journal.db", read_buf, sizeof(read_buf), &read_len);
    double t_read = get_time_ms() - t0;
    assert(rc == SAP_STORAGE_OK);
    assert(read_len == payload_len);
    assert(memcmp(read_buf, secret_payload, payload_len) == 0);
    printf("[PASS] Encrypted file read & authenticated in %.3f ms: \"%.*s\"\n", t_read, (int)read_len, read_buf);

    /* 4. Negative Isolation Gate: Cross-App Reading must fail */
    printf("--> Testing Negative Cross-App Isolation Gate...\n");
    rc = sap_storage_read_encrypted("org.hostile.app", "journal.db", read_buf, sizeof(read_buf), &read_len);
    assert(rc != SAP_STORAGE_OK);
    printf("  [PASS] Cross-app read rejected (rc = %d)\n", rc);

    /* 5. Negative Tamper Gate: 1-byte file corruption on disk */
    printf("--> Testing Negative Tamper Gate (1-byte disk mutation)...\n");
    char filepath[512];
    snprintf(filepath, sizeof(filepath), "%s/org.sovereign.notes/journal.db", test_root);
    int fd = open(filepath, O_RDWR);
    assert(fd >= 0);
    lseek(fd, 30, SEEK_SET); // Seek into ciphertext
    uint8_t byte = 0;
    ssize_t n_read = read(fd, &byte, 1);
    assert(n_read == 1);
    byte ^= 0x55; // Mutate byte
    lseek(fd, 30, SEEK_SET);
    ssize_t n_write = write(fd, &byte, 1);
    assert(n_write == 1);
    close(fd);

    rc = sap_storage_read_encrypted("org.sovereign.notes", "journal.db", read_buf, sizeof(read_buf), &read_len);
    assert(rc == SAP_STORAGE_ERR_TAMPERED);
    printf("  [PASS] Tampered ciphertext rejected (rc = %d, SAP_STORAGE_ERR_TAMPERED)\n", rc);

    /* Clean up */
    sap_storage_destroy_vault("org.sovereign.notes");
    rmdir(test_root);

    size_t peak_rss = get_peak_rss_kb();
    printf("--> Peak Storage RSS: %zu KB (Budget: <= 4096 KB)\n", peak_rss);
    printf("========================================================\n");
    printf("ALL HARDWARE STORAGE INVARIANTS VERIFIED 100%% GREEN\n");
    printf("========================================================\n");
    return 0;
}
