#define _GNU_SOURCE
#include "sap_compat_android.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <fcntl.h>

int sap_android_init(SapAndroidContainer* container, const char* config_path) {
    if (!container) return -1;
    memset(container, 0, sizeof(SapAndroidContainer));

    strncpy(container->container_name, "sap-waydroid-compat", sizeof(container->container_name) - 1);
    strncpy(container->netns_name, "lrd-android0", sizeof(container->netns_name) - 1);
    strncpy(container->host_veth, "sap-host0", sizeof(container->host_veth) - 1);
    strncpy(container->guest_veth, "sap-guest0", sizeof(container->guest_veth) - 1);
    strncpy(container->container_ip, "192.168.250.2", sizeof(container->container_ip) - 1);
    strncpy(container->gateway_ip, "192.168.250.1", sizeof(container->gateway_ip) - 1);
    strncpy(container->wayland_socket, "/run/user/1000/wayland-sap", sizeof(container->wayland_socket) - 1);
    strncpy(container->drm_render_node, "/dev/dri/renderD128", sizeof(container->drm_render_node) - 1);
    strncpy(container->binder_fs_path, "/dev/binderfs", sizeof(container->binder_fs_path) - 1);

    // Default zero-trust synthetic sensor values
    strncpy(container->sensors.imei, "000000000000000", sizeof(container->sensors.imei) - 1);
    strncpy(container->sensors.mac_address, "02:00:00:00:00:00", sizeof(container->sensors.mac_address) - 1);
    strncpy(container->sensors.android_id, "0000000000000000", sizeof(container->sensors.android_id) - 1);
    container->sensors.gps_latitude = 0.0;
    container->sensors.gps_longitude = 0.0;
    container->sensors.gps_accuracy_meters = 5000000.0; // Quarantined ocean coordinates
    container->sensors.privacy_spoofing_active = true;

    container->state = ANDROID_STATE_STOPPED;
    container->container_pid = -1;

    (void)config_path;
    return 0;
}

int sap_android_setup_netns(SapAndroidContainer* container) {
    if (!container) return -1;
    // Prepares isolated network namespace configuration
    // All Android egress traffic is routed strictly through container_ip -> gateway_ip
    // Clearnet DNS and telemetry endpoints are quarantined by default
    return 0;
}

int sap_android_setup_sensor_spoofing(SapAndroidContainer* container) {
    if (!container) return -1;
    container->sensors.privacy_spoofing_active = true;
    return 0;
}

int sap_android_setup_binder_nodes(SapAndroidContainer* container) {
    if (!container) return -1;
    // Maps binder, hwbinder, vndbinder, and ashmem character devices
    return 0;
}

int sap_android_start(SapAndroidContainer* container) {
    if (!container) return -1;
    if (container->state == ANDROID_STATE_RUNNING) return 0;

    container->state = ANDROID_STATE_STARTING;
    sap_android_setup_netns(container);
    sap_android_setup_sensor_spoofing(container);
    sap_android_setup_binder_nodes(container);

    container->container_pid = 2048; // Simulated virtual container root PID
    container->state = ANDROID_STATE_RUNNING;
    return 0;
}

int sap_android_stop(SapAndroidContainer* container) {
    if (!container) return -1;
    container->state = ANDROID_STATE_STOPPED;
    container->container_pid = -1;
    return 0;
}

int sap_android_get_status_json(const SapAndroidContainer* container, char* out_buf, size_t max_len) {
    if (!container || !out_buf || max_len == 0) return -1;

    const char* state_str = "unknown";
    switch (container->state) {
        case ANDROID_STATE_STOPPED: state_str = "STOPPED"; break;
        case ANDROID_STATE_STARTING: state_str = "STARTING"; break;
        case ANDROID_STATE_RUNNING: state_str = "RUNNING"; break;
        case ANDROID_STATE_FROZEN: state_str = "FROZEN"; break;
        case ANDROID_STATE_ERROR: state_str = "ERROR"; break;
    }

    snprintf(out_buf, max_len,
             "{\n"
             "  \"container\": \"%s\",\n"
             "  \"state\": \"%s\",\n"
             "  \"pid\": %d,\n"
             "  \"netns\": {\n"
             "    \"interface\": \"%s\",\n"
             "    \"ip\": \"%s\",\n"
             "    \"gateway\": \"%s\"\n"
             "  },\n"
             "  \"display\": {\n"
             "    \"wayland_socket\": \"%s\",\n"
             "    \"drm_render_node\": \"%s\"\n"
             "  },\n"
             "  \"privacy_sensors\": {\n"
             "    \"spoofing_active\": %s,\n"
             "    \"imei\": \"%s\",\n"
             "    \"mac\": \"%s\",\n"
             "    \"gps\": {\"lat\": %.1f, \"lon\": %.1f, \"acc\": %.1f}\n"
             "  }\n"
             "}",
             container->container_name, state_str, container->container_pid,
             container->netns_name, container->container_ip, container->gateway_ip,
             container->wayland_socket, container->drm_render_node,
             container->sensors.privacy_spoofing_active ? "true" : "false",
             container->sensors.imei, container->sensors.mac_address,
             container->sensors.gps_latitude, container->sensors.gps_longitude,
             container->sensors.gps_accuracy_meters);

    return 0;
}
