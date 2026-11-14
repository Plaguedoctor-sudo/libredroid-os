#define _GNU_SOURCE
#include "sap_camera.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>
#include <errno.h>

int sap_camera_init(SapCamera* cam, const char* dev_node, const char* media_node) {
    if (!cam) return -1;
    memset(cam, 0, sizeof(SapCamera));

    const char* dev = dev_node ? dev_node : "/dev/video0";
    const char* media = media_node ? media_node : "/dev/media0";

    strncpy(cam->device_node, dev, sizeof(cam->device_node) - 1);
    strncpy(cam->media_node, media, sizeof(cam->media_node) - 1);
    strncpy(cam->isp_name, "rkisp1-isp (Rockchip MIPI CSI-2)", sizeof(cam->isp_name) - 1);

    cam->is_streaming = false;
    cam->is_hardware_shutter_closed = false;
    cam->synthetic_mode_active = false;
    cam->torch_enabled = false;
    cam->frame_counter = 0;
    cam->buffer_size = 0;
    cam->current_buffer_idx = 0;

    return 0;
}

int sap_camera_set_hardware_privacy_shutter(SapCamera* cam, bool closed) {
    if (!cam) return -1;
    cam->is_hardware_shutter_closed = closed;
    return 0;
}

int sap_camera_set_synthetic_privacy_mode(SapCamera* cam, bool enabled) {
    if (!cam) return -1;
    cam->synthetic_mode_active = enabled;
    return 0;
}

int sap_camera_start_stream(SapCamera* cam, const SapCameraStreamConfig* config) {
    if (!cam || !config) return -1;

    // If hardware privacy switch is engaged, sensor rail is dead
    if (cam->is_hardware_shutter_closed) {
        return -2; // EPERM / Hardware shutter closed
    }

    if (config->width == 0 || config->height == 0) {
        return -3; // Invalid dimensions
    }

    cam->config = *config;

    // Calculate frame buffer size based on pixel format
    size_t size = 0;
    switch (config->format) {
        case SAP_PIX_FMT_NV12:
        case SAP_PIX_FMT_YUV420:
            size = (size_t)config->width * config->height * 3 / 2;
            break;
        case SAP_PIX_FMT_RGB24:
            size = (size_t)config->width * config->height * 3;
            break;
    }
    cam->buffer_size = size;

    // Allocate circular ring buffer pool for V4L2 zero-copy DMA streaming
    for (int i = 0; i < MAX_CAMERA_BUFFERS; i++) {
        if (cam->buffer_pool[i]) {
            free(cam->buffer_pool[i]);
        }
        cam->buffer_pool[i] = (uint8_t*)calloc(1, cam->buffer_size);
        if (!cam->buffer_pool[i]) {
            sap_camera_stop_stream(cam);
            return -4;
        }
    }

    cam->is_streaming = true;
    cam->frame_counter = 0;
    cam->current_buffer_idx = 0;

    return 0;
}

int sap_camera_acquire_frame(SapCamera* cam, SapCameraFrame* frame) {
    if (!cam || !frame) return -1;
    if (!cam->is_streaming) return -2;

    // Strict privacy gate: Physical shutter immediately vetoes capture
    if (cam->is_hardware_shutter_closed) {
        return -3; // Hardware kill active
    }

    uint32_t buf_idx = cam->current_buffer_idx % MAX_CAMERA_BUFFERS;
    cam->current_buffer_idx++;
    uint8_t* buf = cam->buffer_pool[buf_idx];

    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    uint64_t now_ns = (uint64_t)ts.tv_sec * 1000000000ULL + (uint64_t)ts.tv_nsec;

    frame->frame_index = ++cam->frame_counter;
    frame->timestamp_ns = now_ns;
    frame->exposure_time_us = 12500; // 1/80s typical auto-exposure
    frame->analog_gain = 1.75f;
    frame->color_temperature_k = 5500; // D55 daylight AWB
    frame->width = cam->config.width;
    frame->height = cam->config.height;
    frame->stride = cam->config.width;
    frame->data_len = cam->buffer_size;
    frame->data_ptr = buf;

    bool is_synth = cam->synthetic_mode_active || (cam->config.lens == SAP_LENS_PRIVACY_SYNTHETIC);
    frame->is_synthetic = is_synth;

    if (is_synth) {
        // Zero-trust synthetic noise: Fill buffer with pseudo-random pattern
        // Guaranteed zero photons from physical sensor
        uint32_t seed = (uint32_t)(frame->frame_index ^ now_ns);
        for (size_t i = 0; i < cam->buffer_size; i++) {
            seed = seed * 1664525 + 1013904223;
            buf[i] = (uint8_t)((seed >> 16) & 0xFF);
        }
    } else {
        // Physical sensor frame: Render simulated ISP luma gradient with frame counter watermark
        size_t luma_size = (size_t)cam->config.width * cam->config.height;
        for (size_t y = 0; y < cam->config.height; y++) {
            uint8_t row_val = (uint8_t)((y + cam->frame_counter) % 256);
            memset(buf + (y * cam->config.width), row_val, cam->config.width);
        }
        if (cam->buffer_size > luma_size) {
            // Neutral chroma UV plane
            memset(buf + luma_size, 128, cam->buffer_size - luma_size);
        }
    }

    return 0;
}

int sap_camera_release_frame(SapCamera* cam, SapCameraFrame* frame) {
    if (!cam || !frame) return -1;
    frame->data_ptr = NULL;
    return 0;
}

int sap_camera_set_torch(SapCamera* cam, bool enabled) {
    if (!cam) return -1;
    cam->torch_enabled = enabled;
    return 0;
}

int sap_camera_stop_stream(SapCamera* cam) {
    if (!cam) return -1;
    for (int i = 0; i < MAX_CAMERA_BUFFERS; i++) {
        if (cam->buffer_pool[i]) {
            free(cam->buffer_pool[i]);
            cam->buffer_pool[i] = NULL;
        }
    }
    cam->is_streaming = false;
    cam->buffer_size = 0;
    return 0;
}

void sap_camera_destroy(SapCamera* cam) {
    if (!cam) return;
    sap_camera_stop_stream(cam);
    cam->torch_enabled = false;
}
