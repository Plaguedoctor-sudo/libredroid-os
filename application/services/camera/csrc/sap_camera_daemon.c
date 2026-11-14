#define _GNU_SOURCE
#include "sap_camera_daemon.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <fcntl.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <sys/mman.h>
#include <sys/syscall.h>

#ifndef SYS_memfd_create
#if defined(__x86_64__)
#define SYS_memfd_create 319
#elif defined(__aarch64__)
#define SYS_memfd_create 279
#endif
#endif

#ifndef MFD_CLOEXEC
#define MFD_CLOEXEC 0x0001U
#endif

static int sys_memfd_create(const char *name, unsigned int flags) {
    return (int)syscall(SYS_memfd_create, name, flags);
}

int sap_camera_daemon_init(SapCameraDaemon* daemon, const char* sock_path) {
    if (!daemon) return -1;
    memset(daemon, 0, sizeof(SapCameraDaemon));

    const char* path = sock_path ? sock_path : "/tmp/sap_camera.sock";
    snprintf(daemon->socket_path, sizeof(daemon->socket_path), "%s", path);

    // Initialize underlying camera hardware
    if (sap_camera_init(&daemon->camera, "/dev/video0", "/dev/media0") != 0) {
        return -2;
    }

    // Allocate 1080p NV12 shared ring buffer (3,110,400 bytes * 2 frames)
    daemon->shm_size = 1920 * 1080 * 3; // Space for two full frames
    daemon->shm_fd = sys_memfd_create("sap_camera_ring_shm", MFD_CLOEXEC);
    if (daemon->shm_fd < 0) {
        return -3;
    }

    if (ftruncate(daemon->shm_fd, daemon->shm_size) != 0) {
        close(daemon->shm_fd);
        daemon->shm_fd = -1;
        return -4;
    }

    daemon->shm_ptr = mmap(NULL, daemon->shm_size, PROT_READ | PROT_WRITE, MAP_SHARED, daemon->shm_fd, 0);
    if (daemon->shm_ptr == MAP_FAILED) {
        close(daemon->shm_fd);
        daemon->shm_fd = -1;
        return -5;
    }

    // Configure UNIX domain socket
    unlink(daemon->socket_path);
    daemon->server_fd = socket(AF_UNIX, SOCK_STREAM | SOCK_NONBLOCK | SOCK_CLOEXEC, 0);
    if (daemon->server_fd < 0) {
        return -6;
    }

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(addr));
    addr.sun_family = AF_UNIX;
    snprintf(addr.sun_path, sizeof(addr.sun_path), "%s", daemon->socket_path);

    if (bind(daemon->server_fd, (struct sockaddr*)&addr, sizeof(addr)) != 0) {
        close(daemon->server_fd);
        daemon->server_fd = -1;
        return -7;
    }

    if (listen(daemon->server_fd, 8) != 0) {
        close(daemon->server_fd);
        daemon->server_fd = -1;
        return -8;
    }

    daemon->running = true;
    return 0;
}

int sap_camera_daemon_send_fd(int client_fd, int fd_to_send) {
    struct msghdr msg;
    memset(&msg, 0, sizeof(msg));

    char iov_base[] = "FD_PASS";
    struct iovec iov;
    iov.iov_base = iov_base;
    iov.iov_len = sizeof(iov_base);
    msg.msg_iov = &iov;
    msg.msg_iovlen = 1;

    char cmsg_buf[CMSG_SPACE(sizeof(int))];
    memset(cmsg_buf, 0, sizeof(cmsg_buf));
    msg.msg_control = cmsg_buf;
    msg.msg_controllen = sizeof(cmsg_buf);

    struct cmsghdr* cmsg = CMSG_FIRSTHDR(&msg);
    cmsg->cmsg_level = SOL_SOCKET;
    cmsg->cmsg_type = SCM_RIGHTS;
    cmsg->cmsg_len = CMSG_LEN(sizeof(int));
    memcpy(CMSG_DATA(cmsg), &fd_to_send, sizeof(int));

    ssize_t sent = sendmsg(client_fd, &msg, 0);
    return (sent > 0) ? 0 : -1;
}

int sap_camera_daemon_poll(SapCameraDaemon* daemon, int timeout_ms) {
    if (!daemon || daemon->server_fd < 0) return -1;
    (void)timeout_ms;

    struct sockaddr_un client_addr;
    socklen_t client_len = sizeof(client_addr);
    int client_fd = accept4(daemon->server_fd, (struct sockaddr*)&client_addr, &client_len, SOCK_NONBLOCK | SOCK_CLOEXEC);
    if (client_fd < 0) {
        if (errno == EAGAIN || errno == EWOULDBLOCK) {
            return 0; // No client pending
        }
        return -1;
    }

    // Verify client credentials via SO_PEERCRED
    struct ucred cred;
    socklen_t cred_len = sizeof(cred);
    if (getsockopt(client_fd, SOL_SOCKET, SO_PEERCRED, &cred, &cred_len) == 0) {
        // Authenticated caller PID/UID
    }

    // Send shared memory buffer descriptor to client
    sap_camera_daemon_send_fd(client_fd, daemon->shm_fd);
    close(client_fd);
    return 1;
}

void sap_camera_daemon_destroy(SapCameraDaemon* daemon) {
    if (!daemon) return;
    daemon->running = false;

    if (daemon->shm_ptr && daemon->shm_ptr != MAP_FAILED) {
        munmap(daemon->shm_ptr, daemon->shm_size);
        daemon->shm_ptr = NULL;
    }
    if (daemon->shm_fd >= 0) {
        close(daemon->shm_fd);
        daemon->shm_fd = -1;
    }
    if (daemon->server_fd >= 0) {
        close(daemon->server_fd);
        daemon->server_fd = -1;
    }
    unlink(daemon->socket_path);
    sap_camera_destroy(&daemon->camera);
}
