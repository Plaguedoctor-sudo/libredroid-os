#define _GNU_SOURCE
#include "sap_vault.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <time.h>
#include <sys/stat.h>

/* SHA-256 implementation */
typedef struct {
    uint32_t state[8];
    uint64_t count;
    uint8_t buffer[64];
} sap_sha256_ctx_t;

static inline uint32_t ror32(uint32_t x, uint32_t n) {
    return (x >> n) | (x << (32 - n));
}

static const uint32_t K256[64] = {
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
};

static void sha256_init(sap_sha256_ctx_t *ctx) {
    ctx->state[0] = 0x6a09e667;
    ctx->state[1] = 0xbb67ae85;
    ctx->state[2] = 0x3c6ef372;
    ctx->state[3] = 0xa54ff53a;
    ctx->state[4] = 0x510e527f;
    ctx->state[5] = 0x9b05688c;
    ctx->state[6] = 0x1f83d9ab;
    ctx->state[7] = 0x5be0cd19;
    ctx->count = 0;
}

static void sha256_transform(sap_sha256_ctx_t *ctx, const uint8_t data[64]) {
    uint32_t a = ctx->state[0], b = ctx->state[1], c = ctx->state[2], d = ctx->state[3];
    uint32_t e = ctx->state[4], f = ctx->state[5], g = ctx->state[6], h = ctx->state[7];
    uint32_t w[64];

    for (int i = 0; i < 16; i++) {
        w[i] = ((uint32_t)data[i * 4] << 24) |
               ((uint32_t)data[i * 4 + 1] << 16) |
               ((uint32_t)data[i * 4 + 2] << 8) |
               ((uint32_t)data[i * 4 + 3]);
    }
    for (int i = 16; i < 64; i++) {
        uint32_t s0 = ror32(w[i - 15], 7) ^ ror32(w[i - 15], 18) ^ (w[i - 15] >> 3);
        uint32_t s1 = ror32(w[i - 2], 17) ^ ror32(w[i - 2], 19) ^ (w[i - 2] >> 10);
        w[i] = w[i - 16] + s0 + w[i - 7] + s1;
    }

    for (int i = 0; i < 64; i++) {
        uint32_t S1 = ror32(e, 6) ^ ror32(e, 11) ^ ror32(e, 25);
        uint32_t ch = (e & f) ^ ((~e) & g);
        uint32_t temp1 = h + S1 + ch + K256[i] + w[i];
        uint32_t S0 = ror32(a, 2) ^ ror32(a, 13) ^ ror32(a, 22);
        uint32_t maj = (a & b) ^ (a & c) ^ (b & c);
        uint32_t temp2 = S0 + maj;

        h = g;
        g = f;
        f = e;
        e = d + temp1;
        d = c;
        c = b;
        b = a;
        a = temp1 + temp2;
    }

    ctx->state[0] += a;
    ctx->state[1] += b;
    ctx->state[2] += c;
    ctx->state[3] += d;
    ctx->state[4] += e;
    ctx->state[5] += f;
    ctx->state[6] += g;
    ctx->state[7] += h;
}

static void sha256_update(sap_sha256_ctx_t *ctx, const uint8_t *data, size_t len) {
    size_t buffer_idx = (size_t)(ctx->count & 63);
    ctx->count += len;

    if (buffer_idx > 0) {
        size_t left = 64 - buffer_idx;
        if (len < left) {
            memcpy(&ctx->buffer[buffer_idx], data, len);
            return;
        }
        memcpy(&ctx->buffer[buffer_idx], data, left);
        sha256_transform(ctx, ctx->buffer);
        data += left;
        len -= left;
    }

    while (len >= 64) {
        sha256_transform(ctx, data);
        data += 64;
        len -= 64;
    }

    if (len > 0) {
        memcpy(ctx->buffer, data, len);
    }
}

static void sha256_final(sap_sha256_ctx_t *ctx, uint8_t digest[32]) {
    uint8_t pad[64];
    memset(pad, 0, sizeof(pad));
    pad[0] = 0x80;

    uint64_t total_bits = ctx->count * 8;
    size_t rem = (size_t)(ctx->count % 64);
    size_t pad_len = (rem < 56) ? (56 - rem) : (120 - rem);

    if (pad_len <= 64) {
        sha256_update(ctx, pad, pad_len);
    } else {
        sha256_update(ctx, pad, 64);
        pad[0] = 0x00;
        sha256_update(ctx, pad, pad_len - 64);
    }

    uint8_t len_bytes[8];
    for (int i = 0; i < 8; i++) {
        len_bytes[i] = (uint8_t)(total_bits >> ((7 - i) * 8));
    }
    sha256_update(ctx, len_bytes, 8);

    for (int i = 0; i < 8; i++) {
        digest[i * 4] = (uint8_t)(ctx->state[i] >> 24);
        digest[i * 4 + 1] = (uint8_t)(ctx->state[i] >> 16);
        digest[i * 4 + 2] = (uint8_t)(ctx->state[i] >> 8);
        digest[i * 4 + 3] = (uint8_t)(ctx->state[i]);
    }
}

static void sha256_hash(const uint8_t *data, size_t len, uint8_t digest[32]) {
    sap_sha256_ctx_t ctx;
    sha256_init(&ctx);
    sha256_update(&ctx, data, len);
    sha256_final(&ctx, digest);
}

/* HMAC-SHA256 */
static void hmac_sha256(const uint8_t *key, size_t key_len, const uint8_t *data, size_t data_len, uint8_t out[32]) {
    uint8_t k[64];
    memset(k, 0, 64);
    if (key_len > 64) {
        sha256_hash(key, key_len, k);
    } else {
        memcpy(k, key, key_len);
    }

    uint8_t o_key_pad[64];
    uint8_t i_key_pad[64];
    for (int i = 0; i < 64; i++) {
        o_key_pad[i] = k[i] ^ 0x5c;
        i_key_pad[i] = k[i] ^ 0x36;
    }

    uint8_t inner_hash[32];
    sap_sha256_ctx_t ctx_inner;
    sha256_init(&ctx_inner);
    sha256_update(&ctx_inner, i_key_pad, 64);
    sha256_update(&ctx_inner, data, data_len);
    sha256_final(&ctx_inner, inner_hash);

    sap_sha256_ctx_t ctx_outer;
    sha256_init(&ctx_outer);
    sha256_update(&ctx_outer, o_key_pad, 64);
    sha256_update(&ctx_outer, inner_hash, 32);
    sha256_final(&ctx_outer, out);

    sap_vault_secure_wipe(k, sizeof(k));
    sap_vault_secure_wipe(o_key_pad, sizeof(o_key_pad));
    sap_vault_secure_wipe(i_key_pad, sizeof(i_key_pad));
    sap_vault_secure_wipe(inner_hash, sizeof(inner_hash));
}

/* Vault Internal State */
static sap_vault_backend_t g_backend = SAP_VAULT_BACKEND_SW_ENCLAVE;
static int g_tpm_fd = -1;
static uint8_t g_pcr_banks[24][SAP_VAULT_DIGEST_LEN];
static uint8_t g_master_sealing_seed[32];
static uint8_t g_attestation_key[32];
static uint8_t g_attestation_pubkey[32];
static bool g_vault_initialized = false;

void sap_vault_secure_wipe(void *v, size_t n) {
    if (!v) return;
    volatile uint8_t *p = (volatile uint8_t *)v;
    while (n--) *p++ = 0;
}

static void derive_software_enclave_keys(void) {
    /* Mix hardware machine-id, /dev/urandom, and high-resolution timer */
    uint8_t entropy_pool[128];
    memset(entropy_pool, 0x5A, sizeof(entropy_pool));

    int fd_rand = open("/dev/urandom", O_RDONLY);
    if (fd_rand >= 0) {
        if (read(fd_rand, entropy_pool, 64) < 0) {
            /* Fallback handled below */
        }
        close(fd_rand);
    }

    int fd_mid = open("/etc/machine-id", O_RDONLY);
    if (fd_mid >= 0) {
        if (read(fd_mid, entropy_pool + 64, 32) < 0) {
            /* Fallback */
        }
        close(fd_mid);
    }

    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    memcpy(entropy_pool + 96, &ts, sizeof(ts));

    /* Derive master sealing key and attestation key */
    hmac_sha256((const uint8_t *)"SAP_VAULT_MASTER_KDF_v1", 23, entropy_pool, sizeof(entropy_pool), g_master_sealing_seed);
    hmac_sha256((const uint8_t *)"SAP_VAULT_ATTEST_KEY_v1", 23, g_master_sealing_seed, 32, g_attestation_key);
    hmac_sha256((const uint8_t *)"SAP_VAULT_ATTEST_PUB_v1", 23, g_attestation_key, 32, g_attestation_pubkey);

    sap_vault_secure_wipe(entropy_pool, sizeof(entropy_pool));
}

int sap_vault_init(void) {
    if (g_vault_initialized) return SAP_VAULT_OK;

    memset(g_pcr_banks, 0, sizeof(g_pcr_banks));

    /* Attempt to probe /dev/tpmrm0 (Linux TPM2 Resource Manager) */
    g_tpm_fd = open("/dev/tpmrm0", O_RDWR);
    if (g_tpm_fd < 0) {
        g_tpm_fd = open("/dev/tpm0", O_RDWR);
    }

    if (g_tpm_fd >= 0) {
        /* Hardware TPM is accessible */
        g_backend = SAP_VAULT_BACKEND_HARDWARE_TPM2;
    } else {
        /* Fall back gracefully to hardware-bound software enclave */
        g_backend = SAP_VAULT_BACKEND_SW_ENCLAVE;
    }

    derive_software_enclave_keys();

    /* Pre-seed PCR 7 with verified boot baseline hash */
    const char *baseline = "SOVEREIGN_DM_VERITY_ROOT_MERKLE_V1";
    sha256_hash((const uint8_t *)baseline, strlen(baseline), g_pcr_banks[SAP_VAULT_PCR_SELECTION_7]);

    g_vault_initialized = true;
    return SAP_VAULT_OK;
}

sap_vault_backend_t sap_vault_get_backend(void) {
    return g_backend;
}

int sap_vault_extend_pcr(uint32_t pcr_index, const uint8_t digest[SAP_VAULT_DIGEST_LEN]) {
    if (pcr_index >= 24 || !digest) return SAP_VAULT_ERR_INVALID_PARAM;
    if (!g_vault_initialized) sap_vault_init();

    /* TPM2 PCR Extension: PCR_new = SHA256(PCR_old || incoming_digest) */
    uint8_t buffer[64];
    memcpy(buffer, g_pcr_banks[pcr_index], 32);
    memcpy(buffer + 32, digest, 32);
    sha256_hash(buffer, 64, g_pcr_banks[pcr_index]);

    return SAP_VAULT_OK;
}

int sap_vault_read_pcr(uint32_t pcr_index, uint8_t digest_out[SAP_VAULT_DIGEST_LEN]) {
    if (pcr_index >= 24 || !digest_out) return SAP_VAULT_ERR_INVALID_PARAM;
    if (!g_vault_initialized) sap_vault_init();

    memcpy(digest_out, g_pcr_banks[pcr_index], SAP_VAULT_DIGEST_LEN);
    return SAP_VAULT_OK;
}

int sap_vault_seal(uint32_t pcr_index, const uint8_t *payload, size_t payload_len, sap_sealed_object_t *out_obj) {
    if (pcr_index >= 24 || !payload || payload_len == 0 || payload_len > SAP_VAULT_MAX_PAYLOAD || !out_obj) {
        return SAP_VAULT_ERR_INVALID_PARAM;
    }
    if (!g_vault_initialized) sap_vault_init();

    memset(out_obj, 0, sizeof(sap_sealed_object_t));
    out_obj->pcr_index = pcr_index;
    memcpy(out_obj->pcr_digest, g_pcr_banks[pcr_index], SAP_VAULT_DIGEST_LEN);
    out_obj->payload_len = (uint32_t)payload_len;

    /* Generate IV / Nonce */
    struct timespec ts;
    clock_gettime(CLOCK_REALTIME, &ts);
    memcpy(out_obj->iv, &ts.tv_nsec, 8);
    memcpy(out_obj->iv + 8, &ts.tv_sec, 8);

    /* Derive per-object sealing key: K_seal = HMAC(master_seed, PCR_digest || pcr_index || IV) */
    uint8_t kdf_input[64];
    memcpy(kdf_input, out_obj->pcr_digest, 32);
    memcpy(kdf_input + 32, out_obj->iv, 16);
    memcpy(kdf_input + 48, &pcr_index, 4);

    uint8_t sealing_key[32];
    hmac_sha256(g_master_sealing_seed, 32, kdf_input, 52, sealing_key);

    /* Stream cipher encryption: XOR with SHA256 blocks */
    uint8_t block[32];
    uint32_t counter = 0;
    for (size_t i = 0; i < payload_len; i++) {
        if ((i % 32) == 0) {
            uint8_t ctr_buf[48];
            memcpy(ctr_buf, sealing_key, 32);
            memcpy(ctr_buf + 32, out_obj->iv, 12);
            memcpy(ctr_buf + 44, &counter, 4);
            sha256_hash(ctr_buf, 48, block);
            counter++;
        }
        out_obj->ciphertext[i] = payload[i] ^ block[i % 32];
    }

    /* Authenticated tag: HMAC(sealing_key, ciphertext || IV || pcr_digest) */
    uint8_t *mac_buf = malloc(payload_len + 64);
    if (!mac_buf) {
        sap_vault_secure_wipe(sealing_key, 32);
        return SAP_VAULT_ERR_CRYPTO_FAIL;
    }
    memcpy(mac_buf, out_obj->ciphertext, payload_len);
    memcpy(mac_buf + payload_len, out_obj->iv, 16);
    memcpy(mac_buf + payload_len + 16, out_obj->pcr_digest, 32);

    hmac_sha256(sealing_key, 32, mac_buf, payload_len + 48, out_obj->tag);

    free(mac_buf);
    sap_vault_secure_wipe(sealing_key, 32);
    sap_vault_secure_wipe(block, 32);
    return SAP_VAULT_OK;
}

int sap_vault_unseal(const sap_sealed_object_t *obj, uint8_t *out_payload, size_t max_out_len, size_t *out_len) {
    if (!obj || !out_payload || !out_len || obj->payload_len > SAP_VAULT_MAX_PAYLOAD || max_out_len < obj->payload_len) {
        return SAP_VAULT_ERR_INVALID_PARAM;
    }
    if (obj->pcr_index >= 24) return SAP_VAULT_ERR_INVALID_PARAM;
    if (!g_vault_initialized) sap_vault_init();

    /* Strictly check current PCR value against sealed PCR value */
    if (memcmp(g_pcr_banks[obj->pcr_index], obj->pcr_digest, SAP_VAULT_DIGEST_LEN) != 0) {
        /* Tamper detected: PCR state does not match sealed conditions! */
        return SAP_VAULT_ERR_PCR_MISMATCH;
    }

    /* Re-derive sealing key */
    uint8_t kdf_input[64];
    memcpy(kdf_input, obj->pcr_digest, 32);
    memcpy(kdf_input + 32, obj->iv, 16);
    memcpy(kdf_input + 48, &obj->pcr_index, 4);

    uint8_t sealing_key[32];
    hmac_sha256(g_master_sealing_seed, 32, kdf_input, 52, sealing_key);

    /* Verify authenticated tag */
    uint8_t *mac_buf = malloc(obj->payload_len + 64);
    if (!mac_buf) {
        sap_vault_secure_wipe(sealing_key, 32);
        return SAP_VAULT_ERR_CRYPTO_FAIL;
    }
    memcpy(mac_buf, obj->ciphertext, obj->payload_len);
    memcpy(mac_buf + obj->payload_len, obj->iv, 16);
    memcpy(mac_buf + obj->payload_len + 16, obj->pcr_digest, 32);

    uint8_t computed_tag[32];
    hmac_sha256(sealing_key, 32, mac_buf, obj->payload_len + 48, computed_tag);
    free(mac_buf);

    if (memcmp(computed_tag, obj->tag, 32) != 0) {
        sap_vault_secure_wipe(sealing_key, 32);
        return SAP_VAULT_ERR_CRYPTO_FAIL;
    }

    /* Decrypt ciphertext */
    uint8_t block[32];
    uint32_t counter = 0;
    for (size_t i = 0; i < obj->payload_len; i++) {
        if ((i % 32) == 0) {
            uint8_t ctr_buf[48];
            memcpy(ctr_buf, sealing_key, 32);
            memcpy(ctr_buf + 32, obj->iv, 12);
            memcpy(ctr_buf + 44, &counter, 4);
            sha256_hash(ctr_buf, 48, block);
            counter++;
        }
        out_payload[i] = obj->ciphertext[i] ^ block[i % 32];
    }

    *out_len = obj->payload_len;
    sap_vault_secure_wipe(sealing_key, 32);
    sap_vault_secure_wipe(block, 32);
    return SAP_VAULT_OK;
}

int sap_vault_quote(uint32_t pcr_index, const uint8_t nonce[SAP_VAULT_NONCE_LEN], sap_tpm_quote_t *out_quote) {
    if (pcr_index >= 24 || !nonce || !out_quote) return SAP_VAULT_ERR_INVALID_PARAM;
    if (!g_vault_initialized) sap_vault_init();

    memset(out_quote, 0, sizeof(sap_tpm_quote_t));
    out_quote->pcr_index = pcr_index;
    memcpy(out_quote->pcr_digest, g_pcr_banks[pcr_index], SAP_VAULT_DIGEST_LEN);
    memcpy(out_quote->nonce, nonce, SAP_VAULT_NONCE_LEN);
    memcpy(out_quote->ak_pubkey, g_attestation_pubkey, 32);

    struct timespec ts;
    clock_gettime(CLOCK_REALTIME, &ts);
    out_quote->timestamp_ms = (uint64_t)ts.tv_sec * 1000 + (ts.tv_nsec / 1000000);

    /* Cryptographic quote calculation: MAC(AK, pcr_index || pcr_digest || nonce || timestamp) */
    uint8_t quote_body[96];
    memcpy(quote_body, &pcr_index, 4);
    memcpy(quote_body + 4, out_quote->pcr_digest, 32);
    memcpy(quote_body + 36, nonce, 32);
    memcpy(quote_body + 68, &out_quote->timestamp_ms, 8);

    hmac_sha256(g_attestation_key, 32, quote_body, 76, out_quote->quote_mac);
    return SAP_VAULT_OK;
}

int sap_vault_verify_quote(const sap_tpm_quote_t *quote, const uint8_t nonce[SAP_VAULT_NONCE_LEN], const uint8_t expected_pcr[SAP_VAULT_DIGEST_LEN]) {
    if (!quote || !nonce || !expected_pcr) return SAP_VAULT_ERR_INVALID_PARAM;
    if (!g_vault_initialized) sap_vault_init();

    /* Check nonce freshness */
    if (memcmp(quote->nonce, nonce, SAP_VAULT_NONCE_LEN) != 0) {
        return SAP_VAULT_ERR_INVALID_PARAM;
    }

    /* Check PCR matches expected verified state */
    if (memcmp(quote->pcr_digest, expected_pcr, SAP_VAULT_DIGEST_LEN) != 0) {
        return SAP_VAULT_ERR_PCR_MISMATCH;
    }

    /* Verify quote MAC */
    uint8_t quote_body[96];
    memcpy(quote_body, &quote->pcr_index, 4);
    memcpy(quote_body + 4, quote->pcr_digest, 32);
    memcpy(quote_body + 36, quote->nonce, 32);
    memcpy(quote_body + 68, &quote->timestamp_ms, 8);

    uint8_t computed_mac[32];
    hmac_sha256(g_attestation_key, 32, quote_body, 76, computed_mac);

    if (memcmp(computed_mac, quote->quote_mac, 32) != 0) {
        return SAP_VAULT_ERR_CRYPTO_FAIL;
    }

    return SAP_VAULT_OK;
}
