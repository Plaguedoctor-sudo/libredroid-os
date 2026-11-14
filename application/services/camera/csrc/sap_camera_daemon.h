#ifndef SAP_CAMERA_DAEMON_H
#define SAP_CAMERA_DAEMON_H

#include "sap_camera.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    SapCamera camera;
    char socket_path[104];
    int server_fd;
    int shm_fd;
    size_t shm_size;
    void* shm_ptr;
    bool running;
} SapCameraDaemon;

// Initialize camera daemon on UNIX domain socket
int sap_camera_daemon_init(SapCameraDaemon* daemon, const char* sock_path);

// Run single non-blocking iteration of camera daemon server loop
int sap_camera_daemon_poll(SapCameraDaemon* daemon, int timeout_ms);

// Pass shared memory buffer FD across container boundary to client PID using SCM_RIGHTS
int sap_camera_daemon_send_fd(int client_fd, int fd_to_send);

// Cleanup and terminate camera daemon
void sap_camera_daemon_destroy(SapCameraDaemon* daemon);

#ifdef __cplusplus
}
#endif

#endif // SAP_CAMERA_DAEMON_H
