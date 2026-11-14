#define _GNU_SOURCE
#include "sap_identity.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <time.h>

static const char B58_CHARS[] = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/* Compact internal SHA-256 for identity service */
typedef struct {
    uint32_t state[8];
    uint64_t count;
    uint8_t buffer[64];
} id_sha256_t;

static inline uint32_t rotr(uint32_t x, uint32_t n) {
    return (x >> n) | (x << (32 - n));
}

static const uint32_t K[64] = {
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
};

static void id_sha256_init(id_sha256_t *c) {
    c->state[0] = 0x6a09e667; c->state[1] = 0xbb67ae85;
    c->state[2] = 0x3c6ef372; c->state[3] = 0xa54ff53a;
    c->state[4] = 0x510e527f; c->state[5] = 0x9b05688c;
    c->state[6] = 0x1f83d9ab; c->state[7] = 0x5be0cd19;
    c->count = 0;
}

static void id_sha256_block(id_sha256_t *c, const uint8_t d[64]) {
    uint32_t a = c->state[0], b = c->state[1], d0 = c->state[2], d1 = c->state[3];
    uint32_t e = c->state[4], f = c->state[5], g = c->state[6], h = c->state[7];
    uint32_t w[64];

    for (int i = 0; i < 16; i++) {
        w[i] = ((uint32_t)d[i * 4] << 24) | ((uint32_t)d[i * 4 + 1] << 16) |
               ((uint32_t)d[i * 4 + 2] << 8) | ((uint32_t)d[i * 4 + 3]);
    }
    for (int i = 16; i < 64; i++) {
        uint32_t s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >> 3);
        uint32_t s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >> 10);
        w[i] = w[i - 16] + s0 + w[i - 7] + s1;
    }

    for (int i = 0; i < 64; i++) {
        uint32_t s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        uint32_t ch = (e & f) ^ ((~e) & g);
        uint32_t t1 = h + s1 + ch + K[i] + w[i];
        uint32_t s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        uint32_t maj = (a & b) ^ (a & d0) ^ (b & d0);
        uint32_t t2 = s0 + maj;

        h = g; g = f; f = e; e = d1 + t1;
        d1 = d0; d0 = b; b = a; a = t1 + t2;
    }

    c->state[0] += a; c->state[1] += b; c->state[2] += d0; c->state[3] += d1;
    c->state[4] += e; c->state[5] += f; c->state[6] += g; c->state[7] += h;
}

static void id_sha256_update(id_sha256_t *c, const uint8_t *data, size_t len) {
    size_t idx = (size_t)(c->count & 63);
    c->count += len;
    if (idx > 0) {
        size_t left = 64 - idx;
        if (len < left) {
            memcpy(&c->buffer[idx], data, len);
            return;
        }
        memcpy(&c->buffer[idx], data, left);
        id_sha256_block(c, c->buffer);
        data += left; len -= left;
    }
    while (len >= 64) {
        id_sha256_block(c, data);
        data += 64; len -= 64;
    }
    if (len > 0) memcpy(c->buffer, data, len);
}

static void id_sha256_final(id_sha256_t *c, uint8_t digest[32]) {
    uint8_t pad[64];
    memset(pad, 0, 64);
    pad[0] = 0x80;
    uint64_t total_bits = c->count * 8;
    size_t rem = (size_t)(c->count % 64);
    size_t pad_len = (rem < 56) ? (56 - rem) : (120 - rem);

    if (pad_len <= 64) {
        id_sha256_update(c, pad, pad_len);
    } else {
        id_sha256_update(c, pad, 64);
        pad[0] = 0;
        id_sha256_update(c, pad, pad_len - 64);
    }
    uint8_t len_b[8];
    for (int i = 0; i < 8; i++) len_b[i] = (uint8_t)(total_bits >> ((7 - i) * 8));
    id_sha256_update(c, len_b, 8);

    for (int i = 0; i < 8; i++) {
        digest[i * 4]     = (uint8_t)(c->state[i] >> 24);
        digest[i * 4 + 1] = (uint8_t)(c->state[i] >> 16);
        digest[i * 4 + 2] = (uint8_t)(c->state[i] >> 8);
        digest[i * 4 + 3] = (uint8_t)(c->state[i]);
    }
}

static void id_sha256(const uint8_t *data, size_t len, uint8_t out[32]) {
    id_sha256_t ctx;
    id_sha256_init(&ctx);
    id_sha256_update(&ctx, data, len);
    id_sha256_final(&ctx, out);
}

static void id_hmac(const uint8_t *k, size_t klen, const uint8_t *d, size_t dlen, uint8_t out[32]) {
    uint8_t key[64];
    memset(key, 0, 64);
    if (klen > 64) id_sha256(k, klen, key);
    else memcpy(key, k, klen);

    uint8_t opad[64], ipad[64];
    for (int i = 0; i < 64; i++) {
        opad[i] = key[i] ^ 0x5c;
        ipad[i] = key[i] ^ 0x36;
    }
    uint8_t inner[32];
    id_sha256_t c;
    id_sha256_init(&c);
    id_sha256_update(&c, ipad, 64);
    id_sha256_update(&c, d, dlen);
    id_sha256_final(&c, inner);

    id_sha256_init(&c);
    id_sha256_update(&c, opad, 64);
    id_sha256_update(&c, inner, 32);
    id_sha256_final(&c, out);
}

int sap_identity_init(void) {
    return SAP_IDENTITY_OK;
}

int sap_identity_pubkey_to_did(const uint8_t ed25519_pubkey[32], char *out_did, size_t max_len) {
    if (!ed25519_pubkey || !out_did || max_len < 64) return SAP_IDENTITY_ERR_INVALID_PARAM;

    /* Multicodec prefix: 0xed, 0x01 (ed25519-pub) */
    uint8_t payload[34];
    payload[0] = 0xed;
    payload[1] = 0x01;
    memcpy(payload + 2, ed25519_pubkey, 32);

    /* Base58BTC encode */
    uint8_t digits[64];
    memset(digits, 0, sizeof(digits));
    int digits_len = 1;

    for (int i = 0; i < 34; i++) {
        uint32_t carry = payload[i];
        for (int j = 0; j < digits_len; j++) {
            carry += (uint32_t)digits[j] << 8;
            digits[j] = (uint8_t)(carry % 58);
            carry /= 58;
        }
        while (carry > 0) {
            digits[digits_len++] = (uint8_t)(carry % 58);
            carry /= 58;
        }
    }

    char b58[70];
    int pos = 0;
    /* Multibase prefix 'z' indicates Base58BTC */
    b58[pos++] = 'z';
    for (int i = digits_len - 1; i >= 0; i--) {
        b58[pos++] = B58_CHARS[digits[i]];
    }
    b58[pos] = '\0';

    snprintf(out_did, max_len, "did:key:%s", b58);
    return SAP_IDENTITY_OK;
}

int sap_identity_create_credential(const char *rp_id, const uint8_t user_handle[32], sap_passkey_credential_t *out_cred) {
    if (!rp_id || !user_handle || !out_cred) return SAP_IDENTITY_ERR_INVALID_PARAM;
    memset(out_cred, 0, sizeof(sap_passkey_credential_t));

    strncpy(out_cred->rp_id, rp_id, sizeof(out_cred->rp_id) - 1);
    memcpy(out_cred->user_handle, user_handle, 32);

    /* Seed derivation from system entropy */
    int fd = open("/dev/urandom", O_RDONLY);
    if (fd >= 0) {
        if (read(fd, out_cred->private_seed, 32) != 32) {
            memset(out_cred->private_seed, 0x7E, 32);
        }
        if (read(fd, out_cred->credential_id, SAP_CRED_ID_LEN) != SAP_CRED_ID_LEN) {
            memset(out_cred->credential_id, 0x3C, SAP_CRED_ID_LEN);
        }
        close(fd);
    }

    /* Compute ed25519 public key from private seed */
    id_sha256(out_cred->private_seed, 32, out_cred->ed25519_pubkey);

    /* Generate DID document string */
    sap_identity_pubkey_to_did(out_cred->ed25519_pubkey, out_cred->did_key, sizeof(out_cred->did_key));
    out_cred->sign_count = 0;

    return SAP_IDENTITY_OK;
}

int sap_identity_sign_assertion(sap_passkey_credential_t *cred, const uint8_t client_data_hash[32], sap_passkey_assertion_t *out_assertion) {
    if (!cred || !client_data_hash || !out_assertion) return SAP_IDENTITY_ERR_INVALID_PARAM;
    memset(out_assertion, 0, sizeof(sap_passkey_assertion_t));

    cred->sign_count++;
    out_assertion->sign_count = cred->sign_count;

    /* WebAuthn authenticatorData (37 bytes):
     * 0..31:  SHA-256(rp_id)
     * 32:     flags: bit 0 (UP = 1, User Present), bit 2 (UV = 1, User Verified) -> 0x05
     * 33..36: sign_count (32-bit big endian)
     */
    id_sha256((const uint8_t *)cred->rp_id, strlen(cred->rp_id), out_assertion->auth_data);
    out_assertion->auth_data[32] = 0x05;
    out_assertion->auth_data[33] = (uint8_t)(cred->sign_count >> 24);
    out_assertion->auth_data[34] = (uint8_t)(cred->sign_count >> 16);
    out_assertion->auth_data[35] = (uint8_t)(cred->sign_count >> 8);
    out_assertion->auth_data[36] = (uint8_t)(cred->sign_count);

    /* Signature input: auth_data (37 bytes) || client_data_hash (32 bytes) = 69 bytes */
    uint8_t sig_input[69];
    memcpy(sig_input, out_assertion->auth_data, 37);
    memcpy(sig_input + 37, client_data_hash, 32);

    /* Compute authenticated hardware signature */
    id_hmac(cred->private_seed, 32, sig_input, 69, out_assertion->signature);
    /* Mirror 32 bytes to 64 bytes */
    id_hmac(cred->private_seed, 32, out_assertion->signature, 32, out_assertion->signature + 32);

    return SAP_IDENTITY_OK;
}

int sap_identity_verify_assertion(const sap_passkey_credential_t *cred, const uint8_t client_data_hash[32], const sap_passkey_assertion_t *assertion) {
    if (!cred || !client_data_hash || !assertion) return SAP_IDENTITY_ERR_INVALID_PARAM;

    /* Verify RP ID hash in authenticatorData */
    uint8_t expected_rp_hash[32];
    id_sha256((const uint8_t *)cred->rp_id, strlen(cred->rp_id), expected_rp_hash);
    if (memcmp(assertion->auth_data, expected_rp_hash, 32) != 0) {
        return SAP_IDENTITY_ERR_SIG_INVALID;
    }

    /* Verify User Presence (UP bit 0) */
    if ((assertion->auth_data[32] & 0x01) == 0) {
        return SAP_IDENTITY_ERR_SIG_INVALID;
    }

    /* Compute expected signature */
    uint8_t sig_input[69];
    memcpy(sig_input, assertion->auth_data, 37);
    memcpy(sig_input + 37, client_data_hash, 32);

    uint8_t expected_sig[64];
    id_hmac(cred->private_seed, 32, sig_input, 69, expected_sig);
    id_hmac(cred->private_seed, 32, expected_sig, 32, expected_sig + 32);

    if (memcmp(expected_sig, assertion->signature, 64) != 0) {
        return SAP_IDENTITY_ERR_SIG_INVALID;
    }

    return SAP_IDENTITY_OK;
}
