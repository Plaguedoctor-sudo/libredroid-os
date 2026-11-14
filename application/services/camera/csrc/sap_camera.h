#ifndef SAP_CAMERA_H
#define SAP_CAMERA_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    SAP_LENS_FRONT_SELFIE = 0,    // OmniVision OV5640 5MP MIPI CSI-2
    SAP_LENS_BACK_MAIN = 1,       // Sony IMX258 13MP MIPI CSI-2
    SAP_LENS_BACK_ULTRAWIDE = 2,
    SAP_LENS_BACK_TELEPHOTO = 3,
    SAP_LENS_PRIVACY_SYNTHETIC = 4 // Zero-trust synthetic noise frame stream
} SapCameraLens;

typedef enum {
    SAP_PIX_FMT_NV12 = 0,   // Two planes: Y + interleaved UV (Default V4L2 mobile format)
    SAP_PIX_FMT_YUV420 = 1, // Three planes: Y + U + V
    SAP_PIX_FMT_RGB24 = 2   // Packed 24-bit RGB
} SapPixelFormat;

typedef struct {
    SapCameraLens lens;
    uint32_t width;
    uint32_t height;
    uint32_t fps;
    SapPixelFormat format;
} SapCameraStreamConfig;

typedef struct {
    uint64_t frame_index;
    uint64_t timestamp_ns;
    uint32_t exposure_time_us;
    float analog_gain;
    uint32_t color_temperature_k;
    uint32_t width;
    uint32_t height;
    uint32_t stride;
    size_t data_len;
    uint8_t* data_ptr;
    bool is_synthetic;
} SapCameraFrame;

#define MAX_CAMERA_BUFFERS 4

typedef struct {
    char device_node[64];
    char media_node[64];
    char isp_name[64];
    SapCameraStreamConfig config;
    bool is_streaming;
    bool is_hardware_shutter_closed;
    bool synthetic_mode_active;
    bool torch_enabled;
    uint64_t frame_counter;
    uint8_t* buffer_pool[MAX_CAMERA_BUFFERS];
    size_t buffer_size;
    uint32_t current_buffer_idx;
} SapCamera;

// Initialize native camera & ISP subsystem
int sap_camera_init(SapCamera* cam, const char* dev_node, const char* media_node);

// Hardware privacy shutter control (physical GPIO sensor power cut)
int sap_camera_set_hardware_privacy_shutter(SapCamera* cam, bool closed);

// Enable/disable zero-trust synthetic privacy mode (replaces feed with synthetic testcard/noise)
int sap_camera_set_synthetic_privacy_mode(SapCamera* cam, bool enabled);

// Configure and start camera video stream
int sap_camera_start_stream(SapCamera* cam, const SapCameraStreamConfig* config);

// Acquire next video frame with ISP 3A metadata
int sap_camera_acquire_frame(SapCamera* cam, SapCameraFrame* frame);

// Release acquired video frame back to circular buffer pool
int sap_camera_release_frame(SapCamera* cam, SapCameraFrame* frame);

// Toggle camera LED flash / torch
int sap_camera_set_torch(SapCamera* cam, bool enabled);

// Stop active video stream and release V4L2 buffers
int sap_camera_stop_stream(SapCamera* cam);

// Cleanup and destroy camera subsystem
void sap_camera_destroy(SapCamera* cam);

#ifdef __cplusplus
}
#endif

#endif // SAP_CAMERA_H
