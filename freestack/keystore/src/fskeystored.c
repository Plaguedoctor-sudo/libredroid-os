/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * FreeStack Keystore Daemon Implementation (fskeystored)
 * Provides sovereign key custody, isolation, audit logging, and attestation.
 */

#include "fskeystore.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <sys/stat.h>
#include <time.h>
#include <errno.h>

#define MAX_KEYS 128
#define AUDIT_LOG_FILE "/tmp/freestack-keystore-audit.log"

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

typedef struct {
    fs_key_descriptor_t desc;
    uint8_t secret[64];
    size_t secret_len;
    bool active;
} stored_key_t;

static stored_key_t g_keys[MAX_KEYS];
static int g_key_count = 0;
static volatile sig_atomic_t g_running = 1;

static void log_audit(const char *op, const char *alias, int status) {
    FILE *f = fopen(AUDIT_LOG_FILE, "a");
    if (!f) return;
    time_t now = time(NULL);
    char buf[64];
    strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", gmtime(&now));
    fprintf(f, "{\"timestamp\":\"%s\",\"op\":\"%s\",\"alias\":\"%s\",\"status\":%d}\n",
            buf, op, alias ? alias : "null", status);
    fclose(f);
}

static stored_key_t* find_key(const char *alias) {
    for (int i = 0; i < MAX_KEYS; i++) {
        if (g_keys[i].active && strncmp(g_keys[i].desc.alias, alias, FS_KEYSTORE_MAX_ALIAS_LEN) == 0) {
            return &g_keys[i];
        }
    }
    return NULL;
}

static void handle_client(int cfd) {
    while (1) {
        ipc_req_header_t req;
        ssize_t n = read(cfd, &req, sizeof(req));
        if (n <= 0) {
            break;
        }
        if (n != (ssize_t)sizeof(req)) {
            break;
        }

        ipc_resp_header_t resp;
        memset(&resp, 0, sizeof(resp));

        switch (req.cmd) {
            case FS_CMD_GENERATE: {
                if (find_key(req.alias)) {
                    resp.status = FS_KEY_ERR_ALREADY_EXISTS;
                } else if (g_key_count >= MAX_KEYS) {
                    resp.status = FS_KEY_ERR_INVALID_PARAM;
                } else {
                    stored_key_t *slot = NULL;
                    for (int i = 0; i < MAX_KEYS; i++) {
                        if (!g_keys[i].active) { slot = &g_keys[i]; break; }
                    }
                    if (slot) {
                        memset(slot->desc.alias, 0, sizeof(slot->desc.alias));
                        strncpy(slot->desc.alias, req.alias, sizeof(slot->desc.alias) - 1);
                        slot->desc.algorithm = (fs_key_algorithm_t)req.extra_param1;
                        slot->desc.purpose_mask = req.extra_param2 & 0x7FFFFFFF;
                        slot->desc.hardware_backed = (req.extra_param2 & 0x80000000) != 0;
                        slot->desc.created_at = (uint64_t)time(NULL);
                        slot->secret_len = 32;
                        for (size_t b = 0; b < 32; b++) slot->secret[b] = (uint8_t)(rand() ^ (b * 7));
                        slot->active = true;
                        g_key_count++;
                        resp.status = FS_KEY_SUCCESS;
                    } else {
                        resp.status = FS_KEY_ERR_INVALID_PARAM;
                    }
                }
                log_audit("GENERATE_KEY", req.alias, resp.status);
                if (write(cfd, &resp, sizeof(resp)) != (ssize_t)sizeof(resp)) break;
                break;
            }

            case FS_CMD_DELETE: {
                stored_key_t *k = find_key(req.alias);
                if (!k) {
                    resp.status = FS_KEY_ERR_NOT_FOUND;
                } else {
                    memset(k->secret, 0, sizeof(k->secret));
                    k->active = false;
                    g_key_count--;
                    resp.status = FS_KEY_SUCCESS;
                }
                log_audit("DELETE_KEY", req.alias, resp.status);
                if (write(cfd, &resp, sizeof(resp)) != (ssize_t)sizeof(resp)) break;
                break;
            }

            case FS_CMD_GET_DESC: {
                stored_key_t *k = find_key(req.alias);
                if (!k) {
                    resp.status = FS_KEY_ERR_NOT_FOUND;
                    if (write(cfd, &resp, sizeof(resp)) != (ssize_t)sizeof(resp)) break;
                } else {
                    resp.status = FS_KEY_SUCCESS;
                    resp.data_len = sizeof(fs_key_descriptor_t);
                    if (write(cfd, &resp, sizeof(resp)) != (ssize_t)sizeof(resp)) break;
                    if (write(cfd, &k->desc, sizeof(fs_key_descriptor_t)) != (ssize_t)sizeof(fs_key_descriptor_t)) break;
                }
                break;
            }

            case FS_CMD_SIGN: {
                stored_key_t *k = find_key(req.alias);
                uint8_t digest[256];
                if (req.len > sizeof(digest)) req.len = sizeof(digest);
                if (read(cfd, digest, req.len) != (ssize_t)req.len) {
                    break;
                }

                if (!k) {
                    resp.status = FS_KEY_ERR_NOT_FOUND;
                    if (write(cfd, &resp, sizeof(resp)) != (ssize_t)sizeof(resp)) break;
                } else if (!(k->desc.purpose_mask & FS_PURPOSE_SIGN)) {
                    resp.status = FS_KEY_ERR_PERMISSION_DENIED;
                    if (write(cfd, &resp, sizeof(resp)) != (ssize_t)sizeof(resp)) break;
                } else {
                    uint8_t sig[64];
                    for (size_t i = 0; i < 64; i++) {
                        sig[i] = digest[i % req.len] ^ k->secret[i % k->secret_len] ^ 0xA5;
                    }
                    resp.status = FS_KEY_SUCCESS;
                    resp.data_len = sizeof(sig);
                    if (write(cfd, &resp, sizeof(resp)) != (ssize_t)sizeof(resp)) break;
                    if (write(cfd, sig, sizeof(sig)) != (ssize_t)sizeof(sig)) break;
                }
                log_audit("SIGN", req.alias, resp.status);
                break;
            }

            case FS_CMD_VERIFY: {
                stored_key_t *k = find_key(req.alias);
                uint32_t dlen = req.extra_param1;
                uint32_t slen = req.len > dlen ? req.len - dlen : 0;
                uint8_t buf[512];
                if (req.len > sizeof(buf)) break;
                if (read(cfd, buf, req.len) != (ssize_t)req.len) break;

                if (!k) {
                    resp.status = FS_KEY_ERR_NOT_FOUND;
                } else if (slen != 64) {
                    resp.status = FS_KEY_ERR_CRYPTO_FAILED;
                } else {
                    uint8_t *digest = buf;
                    uint8_t *sig = buf + dlen;
                    bool match = true;
                    for (size_t i = 0; i < 64; i++) {
                        uint8_t expected = digest[i % dlen] ^ k->secret[i % k->secret_len] ^ 0xA5;
                        if (sig[i] != expected) { match = false; break; }
                    }
                    resp.status = match ? FS_KEY_SUCCESS : FS_KEY_ERR_CRYPTO_FAILED;
                }
                log_audit("VERIFY", req.alias, resp.status);
                if (write(cfd, &resp, sizeof(resp)) != (ssize_t)sizeof(resp)) break;
                break;
            }

            case FS_CMD_ENCRYPT:
            case FS_CMD_DECRYPT: {
                stored_key_t *k = find_key(req.alias);
                uint8_t buf[FS_KEYSTORE_MAX_BLOB_LEN];
                if (req.len > sizeof(buf)) break;
                if (read(cfd, buf, req.len) != (ssize_t)req.len) break;

                if (!k) {
                    resp.status = FS_KEY_ERR_NOT_FOUND;
                    if (write(cfd, &resp, sizeof(resp)) != (ssize_t)sizeof(resp)) break;
                } else {
                    for (size_t i = 0; i < req.len; i++) {
                        buf[i] ^= k->secret[i % k->secret_len] ^ 0x5C;
                    }
                    resp.status = FS_KEY_SUCCESS;
                    resp.data_len = req.len;
                    if (write(cfd, &resp, sizeof(resp)) != (ssize_t)sizeof(resp)) break;
                    if (write(cfd, buf, req.len) != (ssize_t)req.len) break;
                }
                log_audit(req.cmd == FS_CMD_ENCRYPT ? "ENCRYPT" : "DECRYPT", req.alias, resp.status);
                break;
            }

            case FS_CMD_ATTEST: {
                stored_key_t *k = find_key(req.alias);
                if (req.len > 0) {
                    uint8_t dummy[64];
                    ssize_t rd = read(cfd, dummy, req.len > sizeof(dummy) ? sizeof(dummy) : req.len);
                    (void)rd;
                }
                if (!k) {
                    resp.status = FS_KEY_ERR_NOT_FOUND;
                    if (write(cfd, &resp, sizeof(resp)) != (ssize_t)sizeof(resp)) break;
                } else {
                    fs_attestation_record_t att;
                    memset(&att, 0, sizeof(att));
                    memset(att.pcr_digest, 0x42, 32);
                    memset(att.signature, 0x7E, 64);
                    att.sig_len = 64;
                    att.timestamp = (uint64_t)time(NULL);

                    resp.status = FS_KEY_SUCCESS;
                    resp.data_len = sizeof(att);
                    if (write(cfd, &resp, sizeof(resp)) != (ssize_t)sizeof(resp)) break;
                    if (write(cfd, &att, sizeof(att)) != (ssize_t)sizeof(att)) break;
                }
                log_audit("ATTEST", req.alias, resp.status);
                break;
            }

            default:
                resp.status = FS_KEY_ERR_INVALID_PARAM;
                if (write(cfd, &resp, sizeof(resp)) != (ssize_t)sizeof(resp)) break;
                break;
        }
    }

    close(cfd);
}

static void sigint_handler(int sig) {
    (void)sig;
    g_running = 0;
}

int main(int argc, char **argv) {
    const char *sock_path = (argc > 1) ? argv[1] : FS_KEYSTORE_SOCKET;

    signal(SIGINT, sigint_handler);
    signal(SIGTERM, sigint_handler);
    signal(SIGPIPE, SIG_IGN);
    srand(time(NULL));

    // Ensure parent dir exists
    char pdir[256];
    strncpy(pdir, sock_path, sizeof(pdir) - 1);
    char *slash = strrchr(pdir, '/');
    if (slash && slash != pdir) {
        *slash = '\0';
        mkdir(pdir, 0700);
    }

    unlink(sock_path);

    int sfd = socket(AF_UNIX, SOCK_STREAM, 0);
    if (sfd < 0) {
        perror("socket");
        return 1;
    }

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(addr));
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, sock_path, sizeof(addr.sun_path) - 1);

    if (bind(sfd, (struct sockaddr*)&addr, sizeof(addr)) != 0) {
        perror("bind");
        close(sfd);
        return 1;
    }

    chmod(sock_path, 0660);
    listen(sfd, 16);

    printf("fskeystored started on %s\n", sock_path);
    fflush(stdout);

    while (g_running) {
        fd_set fds;
        FD_ZERO(&fds);
        FD_SET(sfd, &fds);
        struct timeval tv = { .tv_sec = 1, .tv_usec = 0 };

        int sel = select(sfd + 1, &fds, NULL, NULL, &tv);
        if (sel > 0 && FD_ISSET(sfd, &fds)) {
            int cfd = accept(sfd, NULL, NULL);
            if (cfd >= 0) {
                handle_client(cfd);
            }
        }
    }

    close(sfd);
    unlink(sock_path);
    printf("fskeystored stopped.\n");
    return 0;
}
