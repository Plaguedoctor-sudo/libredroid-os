#ifndef SAP_IPC_ROUTER_H
#define SAP_IPC_ROUTER_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include <sys/types.h>

#ifdef __cplusplus
extern "C" {
#endif

#define SAP_BUS_SOCK_PRIMARY "/run/sap/bus.sock"
#define SAP_BUS_SOCK_FALLBACK "/tmp/sap_bus.sock"
#define SAP_DEFAULT_PORT 3000

typedef struct {
    int battery_pct;
    bool is_charging;
    int temp_c;
    int brightness_pct;
    uint64_t rx_bytes;
    uint64_t tx_bytes;
    bool tor_active;
} SapSystemTelemetry;

typedef struct {
    char socket_path[256];
    int unix_fd;
    int http_fd;
    int listen_port;
    volatile bool is_running;
    uint64_t rpc_requests_served;
    double avg_latency_us;
} SapIpcRouter;

// Initialize native system IPC router daemon
int sap_ipc_router_init(SapIpcRouter* router, const char* sock_path, int port);

// Poll and dispatch one iteration of IPC and HTTP/JSON-RPC events
int sap_ipc_router_poll(SapIpcRouter* router, int timeout_ms);

// Read hardware telemetry directly from sysfs (zero subshells, microsecond speed)
int sap_ipc_get_telemetry(SapSystemTelemetry* telem);

// Dispatch a JSON-RPC 2.0 request string and produce response string
int sap_ipc_dispatch_rpc(const char* request_json, char* response_buffer, size_t max_len, pid_t client_pid, uid_t client_uid);

// Shutdown router
void sap_ipc_router_destroy(SapIpcRouter* router);

#ifdef __cplusplus
}
#endif

#endif // SAP_IPC_ROUTER_H
