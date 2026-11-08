/*
 * LibreDroid Sovereign Daemon C Client Header (lrdd-client.h)
 * Lightweight single-header C library for communicating with lrdd
 */

#ifndef LRDD_CLIENT_H
#define LRDD_CLIENT_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <sys/un.h>

#define LRDD_SOCK_PRIMARY "/run/libredroid/lrdd.sock"
#define LRDD_SOCK_FALLBACK "/tmp/lrdd.sock"

typedef struct {
    int fd;
    char socket_path[256];
} lrdd_conn_t;

static inline lrdd_conn_t *lrdd_connect(void) {
    const char *path = LRDD_SOCK_PRIMARY;
    if (access(LRDD_SOCK_PRIMARY, F_OK) != 0) {
        path = LRDD_SOCK_FALLBACK;
    }

    int sfd = socket(AF_UNIX, SOCK_STREAM, 0);
    if (sfd < 0) return NULL;

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(addr));
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, path, sizeof(addr.sun_path) - 1);

    if (connect(sfd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        close(sfd);
        return NULL;
    }

    lrdd_conn_t *conn = (lrdd_conn_t *)malloc(sizeof(lrdd_conn_t));
    if (!conn) {
        close(sfd);
        return NULL;
    }
    conn->fd = sfd;
    strncpy(conn->socket_path, path, sizeof(conn->socket_path) - 1);
    return conn;
}

static inline int lrdd_call(lrdd_conn_t *conn, const char *json_request, char *out_buf, size_t out_len) {
    if (!conn || conn->fd < 0) return -1;

    size_t req_len = strlen(json_request);
    if (write(conn->fd, json_request, req_len) < 0) return -1;
    if (json_request[req_len - 1] != '\n') {
        if (write(conn->fd, "\n", 1) < 0) return -1;
    }

    memset(out_buf, 0, out_len);
    ssize_t n = read(conn->fd, out_buf, out_len - 1);
    return (n >= 0) ? 0 : -1;
}

static inline void lrdd_disconnect(lrdd_conn_t *conn) {
    if (!conn) return;
    if (conn->fd >= 0) close(conn->fd);
    free(conn);
}

#endif /* LRDD_CLIENT_H */
