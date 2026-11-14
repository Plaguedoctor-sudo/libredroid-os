#define _GNU_SOURCE
#include "sap_storage.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/ioctl.h>
#include <dirent.h>
#include <linux/fscrypt.h>
#include <time.h>

#define SAP_ENC_MAGIC "SAPENC01"
#define SAP_MAGIC_LEN 8

static char g_base_root[SAP_STORAGE_MAX_PATH] = "/tmp/sap_vaults";
static uint8_t g_master_storage_seed[32];
static bool g_storage_initialized = false;

/* Embedded SHA-256 & HMAC-SHA256 for authenticated encryption */
typedef struct {
    uint32_t state[8];
    uint64_t count;
    uint8_t buffer[64];
} storage_sha256_ctx_t;

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

static void sha256_init(storage_sha256_ctx_t *ctx) {
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

static void sha256_transform(storage_sha256_ctx_t *ctx, const uint8_t data[64]) {
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

static void sha256_update(storage_sha256_ctx_t *ctx, const uint8_t *data, size_t len) {
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

static void sha256_final(storage_sha256_ctx_t *ctx, uint8_t digest[32]) {
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
    storage_sha256_ctx_t ctx;
    sha256_init(&ctx);
    sha256_update(&ctx, data, len);
    sha256_final(&ctx, digest);
}

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
    storage_sha256_ctx_t ctx_inner;
    sha256_init(&ctx_inner);
    sha256_update(&ctx_inner, i_key_pad, 64);
    sha256_update(&ctx_inner, data, data_len);
    sha256_final(&ctx_inner, inner_hash);

    storage_sha256_ctx_t ctx_outer;
    sha256_init(&ctx_outer);
    sha256_update(&ctx_outer, o_key_pad, 64);
    sha256_update(&ctx_outer, inner_hash, 32);
    sha256_final(&ctx_outer, out);
}

int sap_storage_init(const char *base_vault_root) {
    if (base_vault_root && strlen(base_vault_root) > 0) {
        strncpy(g_base_root, base_vault_root, sizeof(g_base_root) - 1);
        g_base_root[sizeof(g_base_root) - 1] = '\0';
    }

    mkdir(g_base_root, 0700);

    /* Derive master storage seed */
    const char *seed_str = "SAP_STORAGE_MASTER_KEY_SEED_2026";
    sha256_hash((const uint8_t *)seed_str, strlen(seed_str), g_master_storage_seed);

    g_storage_initialized = true;
    return SAP_STORAGE_OK;
}

static void derive_app_key(const char *app_id, uint8_t out_key[32], uint8_t out_id[16]) {
    uint8_t full_digest[32];
    hmac_sha256(g_master_storage_seed, 32, (const uint8_t *)app_id, strlen(app_id), full_digest);
    memcpy(out_key, full_digest, 32);

    /* Derive master_key_identifier for fscrypt v2 */
    hmac_sha256(full_digest, 32, (const uint8_t *)"fscrypt_v2_identifier", 21, full_digest);
    memcpy(out_id, full_digest, 16);
}

int sap_storage_provision_vault(const char *app_id, uint32_t quota_bytes, sap_app_vault_t *out_vault) {
    if (!app_id || !out_vault) return SAP_STORAGE_ERR_INVALID_PARAM;
    if (!g_storage_initialized) sap_storage_init(NULL);

    memset(out_vault, 0, sizeof(sap_app_vault_t));
    strncpy(out_vault->app_id, app_id, sizeof(out_vault->app_id) - 1);
    out_vault->quota_bytes = quota_bytes;

    snprintf(out_vault->vault_path, sizeof(out_vault->vault_path), "%.400s/%.64s", g_base_root, app_id);
    mkdir(out_vault->vault_path, 0700);

    uint8_t app_key[32];
    derive_app_key(app_id, app_key, out_vault->master_key_identifier);

    /* Attempt to set fscrypt policy on directory */
    int dir_fd = open(out_vault->vault_path, O_RDONLY | O_DIRECTORY);
    if (dir_fd >= 0) {
        struct fscrypt_policy_v2 policy;
        memset(&policy, 0, sizeof(policy));
        policy.version = FSCRYPT_POLICY_V2;
        policy.contents_encryption_mode = FSCRYPT_MODE_AES_256_XTS;
        policy.filenames_encryption_mode = FSCRYPT_MODE_AES_256_CTS;
        policy.flags = FSCRYPT_POLICY_FLAGS_PAD_32;
        memcpy(policy.master_key_identifier, out_vault->master_key_identifier, 16);

        if (ioctl(dir_fd, FS_IOC_SET_ENCRYPTION_POLICY, &policy) == 0) {
            out_vault->fscrypt_kernel_enforced = true;
        } else {
            /* Filesystem may be non-fscrypt (tmpfs/ext4 without encrypt option) */
            out_vault->fscrypt_kernel_enforced = false;
        }
        close(dir_fd);
    }

    return SAP_STORAGE_OK;
}

int sap_storage_write_encrypted(const char *app_id, const char *filename, const uint8_t *data, size_t len) {
    if (!app_id || !filename || !data) return SAP_STORAGE_ERR_INVALID_PARAM;
    if (!g_storage_initialized) sap_storage_init(NULL);

    char filepath[SAP_STORAGE_MAX_PATH];
    snprintf(filepath, sizeof(filepath), "%.300s/%.64s/%.64s", g_base_root, app_id, filename);

    uint8_t app_key[32];
    uint8_t key_id[16];
    derive_app_key(app_id, app_key, key_id);

    /* Generate IV */
    uint8_t iv[16];
    struct timespec ts;
    clock_gettime(CLOCK_REALTIME, &ts);
    memcpy(iv, &ts.tv_nsec, 8);
    memcpy(iv + 8, &ts.tv_sec, 8);

    /* Stream encrypt data */
    uint8_t *ciphertext = malloc(len);
    if (!ciphertext) return SAP_STORAGE_ERR_IO;

    uint8_t block[32];
    uint32_t counter = 0;
    for (size_t i = 0; i < len; i++) {
        if ((i % 32) == 0) {
            uint8_t ctr_buf[48];
            memcpy(ctr_buf, app_key, 32);
            memcpy(ctr_buf + 32, iv, 12);
            memcpy(ctr_buf + 44, &counter, 4);
            sha256_hash(ctr_buf, 48, block);
            counter++;
        }
        ciphertext[i] = data[i] ^ block[i % 32];
    }

    /* Compute HMAC authentication tag */
    uint8_t *mac_buf = malloc(len + 32);
    if (!mac_buf) {
        free(ciphertext);
        return SAP_STORAGE_ERR_IO;
    }
    memcpy(mac_buf, ciphertext, len);
    memcpy(mac_buf + len, iv, 16);
    uint32_t len32 = (uint32_t)len;
    memcpy(mac_buf + len + 16, &len32, 4);

    uint8_t tag[32];
    hmac_sha256(app_key, 32, mac_buf, len + 20, tag);
    free(mac_buf);

    /* Write to file */
    int fd = open(filepath, O_WRONLY | O_CREAT | O_TRUNC, 0600);
    if (fd < 0) {
        free(ciphertext);
        return SAP_STORAGE_ERR_IO;
    }

    bool write_ok = true;
    if (write(fd, SAP_ENC_MAGIC, SAP_MAGIC_LEN) != SAP_MAGIC_LEN) write_ok = false;
    if (write(fd, iv, 16) != 16) write_ok = false;
    if (write(fd, &len32, 4) != 4) write_ok = false;
    if (write(fd, ciphertext, len) != (ssize_t)len) write_ok = false;
    if (write(fd, tag, 32) != 32) write_ok = false;

    close(fd);
    free(ciphertext);
    return write_ok ? SAP_STORAGE_OK : SAP_STORAGE_ERR_IO;
}

int sap_storage_read_encrypted(const char *app_id, const char *filename, uint8_t *out_data, size_t max_len, size_t *out_len) {
    if (!app_id || !filename || !out_data || !out_len) return SAP_STORAGE_ERR_INVALID_PARAM;
    if (!g_storage_initialized) sap_storage_init(NULL);

    char filepath[SAP_STORAGE_MAX_PATH];
    snprintf(filepath, sizeof(filepath), "%.300s/%.64s/%.64s", g_base_root, app_id, filename);

    int fd = open(filepath, O_RDONLY);
    if (fd < 0) return SAP_STORAGE_ERR_IO;

    char magic[SAP_MAGIC_LEN];
    if (read(fd, magic, SAP_MAGIC_LEN) != SAP_MAGIC_LEN || memcmp(magic, SAP_ENC_MAGIC, SAP_MAGIC_LEN) != 0) {
        close(fd);
        return SAP_STORAGE_ERR_TAMPERED;
    }

    uint8_t iv[16];
    if (read(fd, iv, 16) != 16) {
        close(fd);
        return SAP_STORAGE_ERR_IO;
    }

    uint32_t len32 = 0;
    if (read(fd, &len32, 4) != 4 || len32 > max_len) {
        close(fd);
        return SAP_STORAGE_ERR_INVALID_PARAM;
    }

    uint8_t *ciphertext = malloc(len32);
    if (!ciphertext) {
        close(fd);
        return SAP_STORAGE_ERR_IO;
    }

    if (read(fd, ciphertext, len32) != (ssize_t)len32) {
        free(ciphertext);
        close(fd);
        return SAP_STORAGE_ERR_IO;
    }

    uint8_t tag[32];
    if (read(fd, tag, 32) != 32) {
        free(ciphertext);
        close(fd);
        return SAP_STORAGE_ERR_TAMPERED;
    }
    close(fd);

    uint8_t app_key[32];
    uint8_t key_id[16];
    derive_app_key(app_id, app_key, key_id);

    /* Authenticate tag */
    uint8_t *mac_buf = malloc(len32 + 32);
    if (!mac_buf) {
        free(ciphertext);
        return SAP_STORAGE_ERR_IO;
    }
    memcpy(mac_buf, ciphertext, len32);
    memcpy(mac_buf + len32, iv, 16);
    memcpy(mac_buf + len32 + 16, &len32, 4);

    uint8_t computed_tag[32];
    hmac_sha256(app_key, 32, mac_buf, len32 + 20, computed_tag);
    free(mac_buf);

    if (memcmp(computed_tag, tag, 32) != 0) {
        /* Tampered or wrong app key */
        free(ciphertext);
        return SAP_STORAGE_ERR_TAMPERED;
    }

    /* Decrypt */
    uint8_t block[32];
    uint32_t counter = 0;
    for (size_t i = 0; i < len32; i++) {
        if ((i % 32) == 0) {
            uint8_t ctr_buf[48];
            memcpy(ctr_buf, app_key, 32);
            memcpy(ctr_buf + 32, iv, 12);
            memcpy(ctr_buf + 44, &counter, 4);
            sha256_hash(ctr_buf, 48, block);
            counter++;
        }
        out_data[i] = ciphertext[i] ^ block[i % 32];
    }

    *out_len = len32;
    free(ciphertext);
    return SAP_STORAGE_OK;
}

int sap_storage_destroy_vault(const char *app_id) {
    if (!app_id) return SAP_STORAGE_ERR_INVALID_PARAM;
    char path[SAP_STORAGE_MAX_PATH];
    snprintf(path, sizeof(path), "%.300s/%.64s", g_base_root, app_id);

    /* Purge files */
    DIR *dir = opendir(path);
    if (dir) {
        struct dirent *ent;
        while ((ent = readdir(dir)) != NULL) {
            if (ent->d_name[0] == '.') continue;
            char file_p[SAP_STORAGE_MAX_PATH];
            snprintf(file_p, sizeof(file_p), "%.300s/%.64s/%.64s", g_base_root, app_id, ent->d_name);
            unlink(file_p);
        }
        closedir(dir);
    }
    rmdir(path);
    return SAP_STORAGE_OK;
}
