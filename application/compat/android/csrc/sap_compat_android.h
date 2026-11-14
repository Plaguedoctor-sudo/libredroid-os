#ifndef SAP_COMPAT_ANDROID_H
#define SAP_COMPAT_ANDROID_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    ANDROID_STATE_STOPPED = 0,
    ANDROID_STATE_STARTING = 1,
    ANDROID_STATE_RUNNING = 2,
    ANDROID_STATE_FROZEN = 3,
    ANDROID_STATE_ERROR = 4
} SapAndroidState;

typedef struct {
    char imei[32];
    char mac_address[32];
    char android_id[32];
    double gps_latitude;
    double gps_longitude;
    double gps_accuracy_meters;
    bool privacy_spoofing_active;
} SapSyntheticSensors;

typedef struct {
    SapAndroidState state;
    char container_name[64];
    char netns_name[64];
    char host_veth[32];
    char guest_veth[32];
    char container_ip[32];
    char gateway_ip[32];
    char wayland_socket[128];
    char drm_render_node[64];
    char binder_fs_path[64];
    SapSyntheticSensors sensors;
    int container_pid;
} SapAndroidContainer;

// Initialize Android compatibility container controller
int sap_android_init(SapAndroidContainer* container, const char* config_path);

// Setup isolated network namespace and veth pair (lrd-android0)
int sap_android_setup_netns(SapAndroidContainer* container);

// Configure synthetic privacy sensor spoofing (zero-trust dummy location, IMEI, MAC)
int sap_android_setup_sensor_spoofing(SapAndroidContainer* container);

// Route Android Binder and Ashmem IPC device nodes
int sap_android_setup_binder_nodes(SapAndroidContainer* container);

// Launch Android container domain
int sap_android_start(SapAndroidContainer* container);

// Terminate Android container domain and clean up resources
int sap_android_stop(SapAndroidContainer* container);

// Format container telemetry and state into JSON string
int sap_android_get_status_json(const SapAndroidContainer* container, char* out_buf, size_t max_len);

#ifdef __cplusplus
}
#endif

#endif // SAP_COMPAT_ANDROID_H
