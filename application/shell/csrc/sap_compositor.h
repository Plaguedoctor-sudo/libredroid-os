#ifndef SAP_COMPOSITOR_H
#define SAP_COMPOSITOR_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    FORM_FACTOR_HANDSET = 0,
    FORM_FACTOR_FOLDABLE_TENT = 1,
    FORM_FACTOR_FOLDABLE_OPEN = 2,
    FORM_FACTOR_TABLET = 3,
    FORM_FACTOR_DESKTOP_DOCKED = 4
} SapFormFactorMode;

typedef struct {
    uint64_t surface_id;
    char app_id[64];
    uint32_t width;
    uint32_t height;
    uint32_t stride;
    int shm_fd;
    bool is_layer_surface; // True for OSK and statusbar
    bool is_maximized;
    int32_t x;
    int32_t y;
    uint64_t frame_count;
} SapSurface;

typedef struct {
    int drm_fd;
    uint32_t crtc_id;
    uint32_t connector_id;
    uint32_t dumb_handle[2]; // Double-buffered handles
    uint32_t fb_id[2];       // Framebuffer IDs
    uint32_t stride;
    uint64_t size;
    uint8_t *mapped_buf[2];  // Mapped mmap memory pointers
    uint32_t front_idx;
    bool is_drm_active;
    int touch_fd;
    int32_t last_touch_x;
    int32_t last_touch_y;
    bool touch_down;
} SapDrmKmsState;

#define MAX_SAP_SURFACES 64

typedef struct {
    char socket_path[104];
    int server_fd;
    SapFormFactorMode form_factor;
    float hinge_angle_deg;
    uint32_t refresh_rate_hz;
    uint32_t display_width;
    uint32_t display_height;
    SapSurface surfaces[MAX_SAP_SURFACES];
    uint32_t surface_count;
    volatile bool is_running;
    double last_frame_time_ms;
    double avg_frame_latency_ms;
    SapDrmKmsState drm; // Direct Linux KMS/DRM & evdev input state
} SapCompositor;

// Initialize native Wayland compositor server
int sap_compositor_init(SapCompositor* comp, const char* socket_name, uint32_t width, uint32_t height, uint32_t refresh_hz);

// Initialize direct DRM/KMS dumb-buffer modesetting on raw hardware
int sap_compositor_init_drm(SapCompositor* comp, const char* card_node);

// Poll and process raw evdev input events (/dev/input/event*)
int sap_compositor_poll_input(SapCompositor* comp, int timeout_ms);

// Perform double-buffered hardware DRM page-flip
int sap_compositor_page_flip(SapCompositor* comp);

// Release and cleanup DRM resources
void sap_compositor_cleanup_drm(SapCompositor* comp);

// Update dynamic form-factor convergence posture
int sap_compositor_set_form_factor(SapCompositor* comp, SapFormFactorMode mode, float hinge_angle_deg);

// Register a client surface
uint64_t sap_compositor_create_surface(SapCompositor* comp, const char* app_id, uint32_t w, uint32_t h, bool is_layer);

// Commit a new buffer for a surface
int sap_compositor_commit_surface(SapCompositor* comp, uint64_t surface_id, const void* pixel_data, uint32_t w, uint32_t h);

// Event loop dispatch (polls Wayland socket and handles client requests)
int sap_compositor_dispatch(SapCompositor* comp, int timeout_ms);

// Destroy and cleanup compositor
void sap_compositor_destroy(SapCompositor* comp);

#ifdef __cplusplus
}
#endif

#endif // SAP_COMPOSITOR_H
