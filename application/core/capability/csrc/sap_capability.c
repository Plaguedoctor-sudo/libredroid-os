#define _GNU_SOURCE
#include "sap_capability.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <time.h>

#define MAX_REVOKED 64
#define MAX_LEASE_NS (30000000000ULL) // 30 seconds max ephemeral duration

static uint8_t g_authority_secret[32];
static uint8_t g_revocation_list[MAX_REVOKED][SAP_CAP_ID_LEN];
static uint32_t g_revoked_count = 0;
static bool g_cap_initialized = false;

/* Compact SHA-256 for capability authority */
typedef struct {
    uint32_t state[8];
    uint64_t count;
    uint8_t buffer[64];
} cap_sha256_t;

static inline uint32_t ror(uint32_t x, uint32_t n) {
    return (x >> n) | (x << (32 - n));
}

static const uint32_t CK[64] = {
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
};

static void cap_sha256_init(cap_sha256_t *c) {
    c->state[0] = 0x6a09e667; c->state[1] = 0xbb67ae85;
    c->state[2] = 0x3c6ef372; c->state[3] = 0xa54ff53a;
    c->state[4] = 0x510e527f; c->state[5] = 0x9b05688c;
    c->state[6] = 0x1f83d9ab; c->state[7] = 0x5be0cd19;
    c->count = 0;
}

static void cap_sha256_block(cap_sha256_t *c, const uint8_t d[64]) {
    uint32_t a = c->state[0], b = c->state[1], d0 = c->state[2], d1 = c->state[3];
    uint32_t e = c->state[4], f = c->state[5], g = c->state[6], h = c->state[7];
    uint32_t w[64];

    for (int i = 0; i < 16; i++) {
        w[i] = ((uint32_t)d[i * 4] << 24) | ((uint32_t)d[i * 4 + 1] << 16) |
               ((uint32_t)d[i * 4 + 2] << 8) | ((uint32_t)d[i * 4 + 3]);
    }
    for (int i = 16; i < 64; i++) {
        uint32_t s0 = ror(w[i - 15], 7) ^ ror(w[i - 15], 18) ^ (w[i - 15] >> 3);
        uint32_t s1 = ror(w[i - 2], 17) ^ ror(w[i - 2], 19) ^ (w[i - 2] >> 10);
        w[i] = w[i - 16] + s0 + w[i - 7] + s1;
    }

    for (int i = 0; i < 64; i++) {
        uint32_t s1 = ror(e, 6) ^ ror(e, 11) ^ ror(e, 25);
        uint32_t ch = (e & f) ^ ((~e) & g);
        uint32_t t1 = h + s1 + ch + CK[i] + w[i];
        uint32_t s0 = ror(a, 2) ^ ror(a, 13) ^ ror(a, 22);
        uint32_t maj = (a & b) ^ (a & d0) ^ (b & d0);
        uint32_t t2 = s0 + maj;

        h = g; g = f; f = e; e = d1 + t1;
        d1 = d0; d0 = b; b = a; a = t1 + t2;
    }

    c->state[0] += a; c->state[1] += b; c->state[2] += d0; c->state[3] += d1;
    c->state[4] += e; c->state[5] += f; c->state[6] += g; c->state[7] += h;
}

static void cap_sha256_update(cap_sha256_t *c, const uint8_t *data, size_t len) {
    size_t idx = (size_t)(c->count & 63);
    c->count += len;
    if (idx > 0) {
        size_t left = 64 - idx;
        if (len < left) {
            memcpy(&c->buffer[idx], data, len);
            return;
        }
        memcpy(&c->buffer[idx], data, left);
        cap_sha256_block(c, c->buffer);
        data += left; len -= left;
    }
    while (len >= 64) {
        cap_sha256_block(c, data);
        data += 64; len -= 64;
    }
    if (len > 0) memcpy(c->buffer, data, len);
}

static void cap_sha256_final(cap_sha256_t *c, uint8_t digest[32]) {
    uint8_t pad[64];
    memset(pad, 0, 64);
    pad[0] = 0x80;
    uint64_t total_bits = c->count * 8;
    size_t rem = (size_t)(c->count % 64);
    size_t pad_len = (rem < 56) ? (56 - rem) : (120 - rem);

    if (pad_len <= 64) {
        cap_sha256_update(c, pad, pad_len);
    } else {
        cap_sha256_update(c, pad, 64);
        pad[0] = 0;
        cap_sha256_update(c, pad, pad_len - 64);
    }
    uint8_t len_b[8];
    for (int i = 0; i < 8; i++) len_b[i] = (uint8_t)(total_bits >> ((7 - i) * 8));
    cap_sha256_update(c, len_b, 8);

    for (int i = 0; i < 8; i++) {
        digest[i * 4]     = (uint8_t)(c->state[i] >> 24);
        digest[i * 4 + 1] = (uint8_t)(c->state[i] >> 16);
        digest[i * 4 + 2] = (uint8_t)(c->state[i] >> 8);
        digest[i * 4 + 3] = (uint8_t)(c->state[i]);
    }
}

static void cap_hmac(const uint8_t *k, size_t klen, const uint8_t *d, size_t dlen, uint8_t out[32]) {
    uint8_t key[64];
    memset(key, 0, 64);
    if (klen > 64) {
        cap_sha256_t c; cap_sha256_init(&c); cap_sha256_update(&c, k, klen); cap_sha256_final(&c, key);
    } else {
        memcpy(key, k, klen);
    }

    uint8_t opad[64], ipad[64];
    for (int i = 0; i < 64; i++) {
        opad[i] = key[i] ^ 0x5c;
        ipad[i] = key[i] ^ 0x36;
    }
    uint8_t inner[32];
    cap_sha256_t c;
    cap_sha256_init(&c);
    cap_sha256_update(&c, ipad, 64);
    cap_sha256_update(&c, d, dlen);
    cap_sha256_final(&c, inner);

    cap_sha256_init(&c);
    cap_sha256_update(&c, opad, 64);
    cap_sha256_update(&c, inner, 32);
    cap_sha256_final(&c, out);
}

static uint64_t get_time_ns(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint64_t)ts.tv_sec * 1000000000ULL + ts.tv_nsec;
}

int sap_capability_init(void) {
    if (g_cap_initialized) return SAP_CAP_OK;

    int fd = open("/dev/urandom", O_RDONLY);
    if (fd >= 0) {
        if (read(fd, g_authority_secret, 32) != 32) {
            memset(g_authority_secret, 0x4D, 32);
        }
        close(fd);
    } else {
        memset(g_authority_secret, 0x4D, 32);
    }

    g_revoked_count = 0;
    g_cap_initialized = true;
    return SAP_CAP_OK;
}

static void sign_handle(sap_cap_handle_t *h) {
    /* Sign fields: id (32) + resource_id (128) + issuer (64) + recipient (64) + perms (4) + issued (8) + expires (8) */
    size_t body_len = 32 + 128 + 64 + 64 + 4 + 8 + 8;
    uint8_t *buf = malloc(body_len);
    if (!buf) return;

    size_t off = 0;
    memcpy(buf + off, h->id, 32); off += 32;
    memcpy(buf + off, h->resource_id, 128); off += 128;
    memcpy(buf + off, h->issuer, 64); off += 64;
    memcpy(buf + off, h->recipient, 64); off += 64;
    memcpy(buf + off, &h->permissions, 4); off += 4;
    memcpy(buf + off, &h->issued_at_ns, 8); off += 8;
    memcpy(buf + off, &h->expires_at_ns, 8); off += 8;

    cap_hmac(g_authority_secret, 32, buf, off, h->auth_signature);
    free(buf);
}

static bool verify_handle_signature(const sap_cap_handle_t *h) {
    size_t body_len = 32 + 128 + 64 + 64 + 4 + 8 + 8;
    uint8_t *buf = malloc(body_len);
    if (!buf) return false;

    size_t off = 0;
    memcpy(buf + off, h->id, 32); off += 32;
    memcpy(buf + off, h->resource_id, 128); off += 128;
    memcpy(buf + off, h->issuer, 64); off += 64;
    memcpy(buf + off, h->recipient, 64); off += 64;
    memcpy(buf + off, &h->permissions, 4); off += 4;
    memcpy(buf + off, &h->issued_at_ns, 8); off += 8;
    memcpy(buf + off, &h->expires_at_ns, 8); off += 8;

    uint8_t expected_sig[32];
    cap_hmac(g_authority_secret, 32, buf, off, expected_sig);
    free(buf);

    return (memcmp(expected_sig, h->auth_signature, 32) == 0);
}

int sap_capability_issue_lease(const char *resource_id, const char *recipient, uint32_t permissions, uint64_t duration_ns, sap_cap_handle_t *out_handle) {
    if (!resource_id || !recipient || !out_handle) return SAP_CAP_ERR_INVALID_PARAM;
    if (!g_cap_initialized) sap_capability_init();

    memset(out_handle, 0, sizeof(sap_cap_handle_t));

    int fd = open("/dev/urandom", O_RDONLY);
    if (fd >= 0) {
        if (read(fd, out_handle->id, 32) != 32) memset(out_handle->id, 0x11, 32);
        close(fd);
    }

    strncpy(out_handle->resource_id, resource_id, sizeof(out_handle->resource_id) - 1);
    strncpy(out_handle->issuer, "sap.authority.root", sizeof(out_handle->issuer) - 1);
    strncpy(out_handle->recipient, recipient, sizeof(out_handle->recipient) - 1);

    out_handle->permissions = permissions | SAP_PERM_LEASE_EPHEMERAL;
    out_handle->issued_at_ns = get_time_ns();

    uint64_t clamped_duration = (duration_ns > MAX_LEASE_NS) ? MAX_LEASE_NS : duration_ns;
    out_handle->expires_at_ns = (duration_ns > 0) ? (out_handle->issued_at_ns + clamped_duration) : 0;

    sign_handle(out_handle);
    return SAP_CAP_OK;
}

int sap_capability_verify_access(const sap_cap_handle_t *handle, const char *caller_recipient, const char *resource_id, uint32_t requested_perm) {
    if (!handle || !caller_recipient || !resource_id) return SAP_CAP_ERR_INVALID_PARAM;
    if (!g_cap_initialized) sap_capability_init();

    /* 1. Cryptographic Signature Integrity */
    if (!verify_handle_signature(handle)) {
        return SAP_CAP_ERR_FORGED_SIG;
    }

    /* 2. Revocation List Check */
    for (uint32_t i = 0; i < g_revoked_count; i++) {
        if (memcmp(g_revocation_list[i], handle->id, SAP_CAP_ID_LEN) == 0) {
            return SAP_CAP_ERR_REVOKED;
        }
    }

    /* 3. Recipient Matching */
    if (strcmp(handle->recipient, caller_recipient) != 0) {
        return SAP_CAP_ERR_RECIPIENT_MISMATCH;
    }

    /* 4. Lease Expiration Check */
    if (handle->expires_at_ns > 0) {
        uint64_t now_ns = get_time_ns();
        if (now_ns >= handle->expires_at_ns) {
            return SAP_CAP_ERR_EXPIRED;
        }
    }

    /* 5. Resource Prefix Hierarchy Matching */
    size_t parent_len = strlen(handle->resource_id);
    if (strncmp(resource_id, handle->resource_id, parent_len) != 0) {
        return SAP_CAP_ERR_RES_MISMATCH;
    }

    /* 6. Permission Bitmask Enforcement */
    if ((handle->permissions & requested_perm) != requested_perm) {
        return SAP_CAP_ERR_PERM_DENIED;
    }

    return SAP_CAP_OK;
}

int sap_capability_attenuate(const sap_cap_handle_t *parent, uint32_t child_perms, const char *sub_resource, sap_cap_handle_t *out_child) {
    if (!parent || !out_child) return SAP_CAP_ERR_INVALID_PARAM;
    if (!verify_handle_signature(parent)) return SAP_CAP_ERR_FORGED_SIG;

    /* Child cannot exceed parent's permissions */
    if ((parent->permissions & child_perms) != child_perms) {
        return SAP_CAP_ERR_PERM_DENIED;
    }

    memcpy(out_child, parent, sizeof(sap_cap_handle_t));

    /* Refresh token ID */
    int fd = open("/dev/urandom", O_RDONLY);
    if (fd >= 0) {
        if (read(fd, out_child->id, 32) != 32) memset(out_child->id, 0x22, 32);
        close(fd);
    }

    out_child->permissions = child_perms;
    if (sub_resource && strlen(sub_resource) > 0) {
        snprintf(out_child->resource_id, sizeof(out_child->resource_id), "%.64s/%.60s", parent->resource_id, sub_resource);
    }
    out_child->issued_at_ns = get_time_ns();

    sign_handle(out_child);
    return SAP_CAP_OK;
}

int sap_capability_revoke(const uint8_t id[SAP_CAP_ID_LEN]) {
    if (!id) return SAP_CAP_ERR_INVALID_PARAM;
    if (g_revoked_count < MAX_REVOKED) {
        memcpy(g_revocation_list[g_revoked_count++], id, SAP_CAP_ID_LEN);
        return SAP_CAP_OK;
    }
    return -1;
}
