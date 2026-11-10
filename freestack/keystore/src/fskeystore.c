/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * FreeStack App-Facing Keystore Client Library Implementation (Task 5.9)
 */

#include "fskeystore.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <errno.h>

struct fs_keystore_ctx {
    char socket_path[256];
    int fd;
    bool connected;
};

#define FS_CMD_GENERATE 1
#define FS_CMD_DELETE   2
#define FS_CMD_GET_DESC 3
#define FS_CMD_SIGN     4
#define FS_CMD_VERIFY   5
#define FS_CMD_ENCRYPT  6
#define FS_CMD_DECRYPT  7
#define FS_CMD_ATTEST   8

typedef struct __attribute__((packed)) {
    uint32_t cmd;
    uint32_t len;
    char alias[FS_KEYSTORE_MAX_ALIAS_LEN];
    uint32_t extra_param1;
    uint32_t extra_param2;
} ipc_req_header_t;

typedef struct __attribute__((packed)) {
    int32_t status;
    uint32_t data_len;
} ipc_resp_header_t;

fs_keystore_ctx_t* fs_keystore_open(const char *socket_override) {
    fs_keystore_ctx_t *ctx = (fs_keystore_ctx_t*)calloc(1, sizeof(fs_keystore_ctx_t));
    if (!ctx) return NULL;

    const char *path = socket_override ? socket_override : FS_KEYSTORE_SOCKET;
    strncpy(ctx->socket_path, path, sizeof(ctx->socket_path) - 1);
    ctx->fd = -1;
    ctx->connected = false;

    // Connect to daemon socket
    int sock = socket(AF_UNIX, SOCK_STREAM, 0);
    if (sock >= 0) {
        struct sockaddr_un addr;
        memset(&addr, 0, sizeof(addr));
        addr.sun_family = AF_UNIX;
        strncpy(addr.sun_path, ctx->socket_path, sizeof(addr.sun_path) - 1);

        if (connect(sock, (struct sockaddr*)&addr, sizeof(addr)) == 0) {
            ctx->fd = sock;
            ctx->connected = true;
        } else {
            close(sock);
        }
    }

    return ctx;
}

void fs_keystore_close(fs_keystore_ctx_t *ctx) {
    if (!ctx) return;
    if (ctx->fd >= 0) {
        close(ctx->fd);
        ctx->fd = -1;
    }
    free(ctx);
}

fs_keystore_status_t fs_keystore_generate_key(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    fs_key_algorithm_t alg,
    uint32_t purpose_mask,
    bool hardware_backed
) {
    if (!ctx || !alias || strlen(alias) == 0) return FS_KEY_ERR_INVALID_PARAM;
    if (!ctx->connected) return FS_KEY_ERR_COMMUNICATION;

    ipc_req_header_t req;
    memset(&req, 0, sizeof(req));
    req.cmd = FS_CMD_GENERATE;
    req.len = 0;
    strncpy(req.alias, alias, sizeof(req.alias) - 1);
    req.extra_param1 = (uint32_t)alg;
    req.extra_param2 = purpose_mask | (hardware_backed ? (1 << 31) : 0);

    if (write(ctx->fd, &req, sizeof(req)) != sizeof(req)) return FS_KEY_ERR_COMMUNICATION;

    ipc_resp_header_t resp;
    if (read(ctx->fd, &resp, sizeof(resp)) != sizeof(resp)) return FS_KEY_ERR_COMMUNICATION;

    return (fs_keystore_status_t)resp.status;
}

fs_keystore_status_t fs_keystore_get_descriptor(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    fs_key_descriptor_t *out_desc
) {
    if (!ctx || !alias || !out_desc) return FS_KEY_ERR_INVALID_PARAM;
    if (!ctx->connected) return FS_KEY_ERR_COMMUNICATION;

    ipc_req_header_t req;
    memset(&req, 0, sizeof(req));
    req.cmd = FS_CMD_GET_DESC;
    strncpy(req.alias, alias, sizeof(req.alias) - 1);

    if (write(ctx->fd, &req, sizeof(req)) != sizeof(req)) return FS_KEY_ERR_COMMUNICATION;

    ipc_resp_header_t resp;
    if (read(ctx->fd, &resp, sizeof(resp)) != sizeof(resp)) return FS_KEY_ERR_COMMUNICATION;
    if (resp.status != FS_KEY_SUCCESS) return (fs_keystore_status_t)resp.status;

    if (read(ctx->fd, out_desc, sizeof(fs_key_descriptor_t)) != sizeof(fs_key_descriptor_t)) {
        return FS_KEY_ERR_COMMUNICATION;
    }

    return FS_KEY_SUCCESS;
}

fs_keystore_status_t fs_keystore_delete_key(fs_keystore_ctx_t *ctx, const char *alias) {
    if (!ctx || !alias) return FS_KEY_ERR_INVALID_PARAM;
    if (!ctx->connected) return FS_KEY_ERR_COMMUNICATION;

    ipc_req_header_t req;
    memset(&req, 0, sizeof(req));
    req.cmd = FS_CMD_DELETE;
    strncpy(req.alias, alias, sizeof(req.alias) - 1);

    if (write(ctx->fd, &req, sizeof(req)) != sizeof(req)) return FS_KEY_ERR_COMMUNICATION;

    ipc_resp_header_t resp;
    if (read(ctx->fd, &resp, sizeof(resp)) != sizeof(resp)) return FS_KEY_ERR_COMMUNICATION;

    return (fs_keystore_status_t)resp.status;
}

fs_keystore_status_t fs_keystore_sign(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    const uint8_t *digest,
    size_t digest_len,
    uint8_t *out_sig,
    size_t *out_sig_len
) {
    if (!ctx || !alias || !digest || !out_sig || !out_sig_len) return FS_KEY_ERR_INVALID_PARAM;
    if (!ctx->connected) return FS_KEY_ERR_COMMUNICATION;

    ipc_req_header_t req;
    memset(&req, 0, sizeof(req));
    req.cmd = FS_CMD_SIGN;
    req.len = digest_len;
    strncpy(req.alias, alias, sizeof(req.alias) - 1);

    if (write(ctx->fd, &req, sizeof(req)) != sizeof(req)) return FS_KEY_ERR_COMMUNICATION;
    if (write(ctx->fd, digest, digest_len) != (ssize_t)digest_len) return FS_KEY_ERR_COMMUNICATION;

    ipc_resp_header_t resp;
    if (read(ctx->fd, &resp, sizeof(resp)) != sizeof(resp)) return FS_KEY_ERR_COMMUNICATION;
    if (resp.status != FS_KEY_SUCCESS) return (fs_keystore_status_t)resp.status;

    if (resp.data_len > *out_sig_len) return FS_KEY_ERR_INVALID_PARAM;
    if (read(ctx->fd, out_sig, resp.data_len) != (ssize_t)resp.data_len) return FS_KEY_ERR_COMMUNICATION;
    *out_sig_len = resp.data_len;

    return FS_KEY_SUCCESS;
}

fs_keystore_status_t fs_keystore_verify(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    const uint8_t *digest,
    size_t digest_len,
    const uint8_t *sig,
    size_t sig_len,
    bool *out_verified
) {
    if (!ctx || !alias || !digest || !sig || !out_verified) return FS_KEY_ERR_INVALID_PARAM;
    if (!ctx->connected) return FS_KEY_ERR_COMMUNICATION;

    ipc_req_header_t req;
    memset(&req, 0, sizeof(req));
    req.cmd = FS_CMD_VERIFY;
    req.len = digest_len + sig_len;
    req.extra_param1 = digest_len;
    strncpy(req.alias, alias, sizeof(req.alias) - 1);

    if (write(ctx->fd, &req, sizeof(req)) != sizeof(req)) return FS_KEY_ERR_COMMUNICATION;
    if (write(ctx->fd, digest, digest_len) != (ssize_t)digest_len) return FS_KEY_ERR_COMMUNICATION;
    if (write(ctx->fd, sig, sig_len) != (ssize_t)sig_len) return FS_KEY_ERR_COMMUNICATION;

    ipc_resp_header_t resp;
    if (read(ctx->fd, &resp, sizeof(resp)) != sizeof(resp)) return FS_KEY_ERR_COMMUNICATION;
    *out_verified = (resp.status == FS_KEY_SUCCESS);

    return FS_KEY_SUCCESS;
}

fs_keystore_status_t fs_keystore_encrypt(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    const uint8_t *plaintext,
    size_t pt_len,
    uint8_t *out_ciphertext,
    size_t *out_ct_len
) {
    if (!ctx || !alias || !plaintext || !out_ciphertext || !out_ct_len) return FS_KEY_ERR_INVALID_PARAM;
    if (!ctx->connected) return FS_KEY_ERR_COMMUNICATION;

    ipc_req_header_t req;
    memset(&req, 0, sizeof(req));
    req.cmd = FS_CMD_ENCRYPT;
    req.len = pt_len;
    strncpy(req.alias, alias, sizeof(req.alias) - 1);

    if (write(ctx->fd, &req, sizeof(req)) != sizeof(req)) return FS_KEY_ERR_COMMUNICATION;
    if (write(ctx->fd, plaintext, pt_len) != (ssize_t)pt_len) return FS_KEY_ERR_COMMUNICATION;

    ipc_resp_header_t resp;
    if (read(ctx->fd, &resp, sizeof(resp)) != sizeof(resp)) return FS_KEY_ERR_COMMUNICATION;
    if (resp.status != FS_KEY_SUCCESS) return (fs_keystore_status_t)resp.status;

    if (resp.data_len > *out_ct_len) return FS_KEY_ERR_INVALID_PARAM;
    if (read(ctx->fd, out_ciphertext, resp.data_len) != (ssize_t)resp.data_len) return FS_KEY_ERR_COMMUNICATION;
    *out_ct_len = resp.data_len;

    return FS_KEY_SUCCESS;
}

fs_keystore_status_t fs_keystore_decrypt(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    const uint8_t *ciphertext,
    size_t ct_len,
    uint8_t *out_plaintext,
    size_t *out_pt_len
) {
    if (!ctx || !alias || !ciphertext || !out_plaintext || !out_pt_len) return FS_KEY_ERR_INVALID_PARAM;
    if (!ctx->connected) return FS_KEY_ERR_COMMUNICATION;

    ipc_req_header_t req;
    memset(&req, 0, sizeof(req));
    req.cmd = FS_CMD_DECRYPT;
    req.len = ct_len;
    strncpy(req.alias, alias, sizeof(req.alias) - 1);

    if (write(ctx->fd, &req, sizeof(req)) != sizeof(req)) return FS_KEY_ERR_COMMUNICATION;
    if (write(ctx->fd, ciphertext, ct_len) != (ssize_t)ct_len) return FS_KEY_ERR_COMMUNICATION;

    ipc_resp_header_t resp;
    if (read(ctx->fd, &resp, sizeof(resp)) != sizeof(resp)) return FS_KEY_ERR_COMMUNICATION;
    if (resp.status != FS_KEY_SUCCESS) return (fs_keystore_status_t)resp.status;

    if (resp.data_len > *out_pt_len) return FS_KEY_ERR_INVALID_PARAM;
    if (read(ctx->fd, out_plaintext, resp.data_len) != (ssize_t)resp.data_len) return FS_KEY_ERR_COMMUNICATION;
    *out_pt_len = resp.data_len;

    return FS_KEY_SUCCESS;
}

fs_keystore_status_t fs_keystore_attest(
    fs_keystore_ctx_t *ctx,
    const char *alias,
    const uint8_t *nonce,
    size_t nonce_len,
    fs_attestation_record_t *out_attestation
) {
    if (!ctx || !alias || !out_attestation) return FS_KEY_ERR_INVALID_PARAM;
    if (!ctx->connected) return FS_KEY_ERR_COMMUNICATION;

    ipc_req_header_t req;
    memset(&req, 0, sizeof(req));
    req.cmd = FS_CMD_ATTEST;
    req.len = nonce_len;
    strncpy(req.alias, alias, sizeof(req.alias) - 1);

    if (write(ctx->fd, &req, sizeof(req)) != sizeof(req)) return FS_KEY_ERR_COMMUNICATION;
    if (nonce_len > 0 && nonce) {
        if (write(ctx->fd, nonce, nonce_len) != (ssize_t)nonce_len) return FS_KEY_ERR_COMMUNICATION;
    }

    ipc_resp_header_t resp;
    if (read(ctx->fd, &resp, sizeof(resp)) != sizeof(resp)) return FS_KEY_ERR_COMMUNICATION;
    if (resp.status != FS_KEY_SUCCESS) return (fs_keystore_status_t)resp.status;

    if (read(ctx->fd, out_attestation, sizeof(fs_attestation_record_t)) != sizeof(fs_attestation_record_t)) {
        return FS_KEY_ERR_COMMUNICATION;
    }

    return FS_KEY_SUCCESS;
}
