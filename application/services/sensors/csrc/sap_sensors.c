#define _GNU_SOURCE
#include "sap_sensors.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <fcntl.h>
#include <unistd.h>
#include <time.h>
#include <math.h>

#define RAD_TO_DEG 57.29577951308232f

static bool g_sensors_initialized = false;
static bool g_privacy_fuzzing = false;
static char g_accel_iio_path[512] = {0};
static float g_accel_scale = 0.00980665f; // Standard m/s^2 scale default
static bool g_has_hardware_iio = false;

/* Injected state for CI/containers */
static float g_mock_ax = 0.0f;
static float g_mock_ay = 9.80665f;
static float g_mock_az = 0.0f;
static float g_mock_hinge = 180.0f;

static uint64_t get_time_ns(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint64_t)ts.tv_sec * 1000000000ULL + ts.tv_nsec;
}

static int read_sysfs_float(const char *path, float *out_val) {
    int fd = open(path, O_RDONLY);
    if (fd < 0) return -1;
    char buf[64];
    ssize_t n = read(fd, buf, sizeof(buf) - 1);
    close(fd);
    if (n <= 0) return -1;
    buf[n] = '\0';
    *out_val = (float)atof(buf);
    return 0;
}

int sap_sensors_init(void) {
    if (g_sensors_initialized) return 0;

    /* Scan Linux IIO subsystem: /sys/bus/iio/devices */
    DIR *dir = opendir("/sys/bus/iio/devices");
    if (dir) {
        struct dirent *ent;
        while ((ent = readdir(dir)) != NULL) {
            if (strncmp(ent->d_name, "iio:device", 10) == 0) {
                char test_path[512];
                snprintf(test_path, sizeof(test_path), "/sys/bus/iio/devices/%.64s/in_accel_x_raw", ent->d_name);
                if (access(test_path, R_OK) == 0) {
                    snprintf(g_accel_iio_path, sizeof(g_accel_iio_path), "/sys/bus/iio/devices/%.64s", ent->d_name);
                    g_has_hardware_iio = true;

                    char scale_path[512];
                    snprintf(scale_path, sizeof(scale_path), "%.400s/in_accel_scale", g_accel_iio_path);
                    float scale = 0.0f;
                    if (read_sysfs_float(scale_path, &scale) == 0 && scale > 0.0f) {
                        g_accel_scale = scale;
                    }
                    break;
                }
            }
        }
        closedir(dir);
    }

    g_sensors_initialized = true;
    return 0;
}

void sap_sensors_set_privacy_fuzzing(bool enable) {
    g_privacy_fuzzing = enable;
}

int sap_sensors_inject_mock_iio(float ax, float ay, float az, float hinge_deg) {
    g_mock_ax = ax;
    g_mock_ay = ay;
    g_mock_az = az;
    g_mock_hinge = hinge_deg;
    return 0;
}

int sap_sensors_read_frame(sap_sensor_frame_t *out_frame) {
    if (!out_frame) return -1;
    if (!g_sensors_initialized) sap_sensors_init();

    memset(out_frame, 0, sizeof(sap_sensor_frame_t));
    uint64_t now_ns = get_time_ns();

    float ax = 0.0f, ay = 0.0f, az = 9.80665f;
    float hinge_deg = 180.0f;

    if (g_has_hardware_iio) {
        char path[512];
        float raw_x = 0, raw_y = 0, raw_z = 0;
        snprintf(path, sizeof(path), "%.400s/in_accel_x_raw", g_accel_iio_path);
        read_sysfs_float(path, &raw_x);
        snprintf(path, sizeof(path), "%.400s/in_accel_y_raw", g_accel_iio_path);
        read_sysfs_float(path, &raw_y);
        snprintf(path, sizeof(path), "%.400s/in_accel_z_raw", g_accel_iio_path);
        read_sysfs_float(path, &raw_z);

        ax = raw_x * g_accel_scale;
        ay = raw_y * g_accel_scale;
        az = raw_z * g_accel_scale;
    } else {
        /* Use active injected state */
        ax = g_mock_ax;
        ay = g_mock_ay;
        az = g_mock_az;
        hinge_deg = g_mock_hinge;
    }

    /* Privacy / Zero-Trust Sanitization Guard */
    if (g_privacy_fuzzing) {
        out_frame->privacy_fuzzing_active = true;
        // Strip fine-grained motion signatures to prevent acoustic / keystroke leakage
        out_frame->accel.x = 0.0f;
        out_frame->accel.y = 9.80665f;
        out_frame->accel.z = 0.0f;
        out_frame->gyro.x = 0.0f;
        out_frame->gyro.y = 0.0f;
        out_frame->gyro.z = 0.0f;
        out_frame->light.lux = 300.0f; // Neutral indoor ambient
        out_frame->hinge.angle_deg = 180.0f;
        out_frame->hinge.is_flat = true;
        out_frame->orientation = SAP_ORIENT_PORTRAIT_UP;
        out_frame->pitch_deg = 0.0f;
        out_frame->roll_deg = 0.0f;
        return 0;
    }

    out_frame->privacy_fuzzing_active = false;
    out_frame->accel.x = ax;
    out_frame->accel.y = ay;
    out_frame->accel.z = az;
    out_frame->accel.timestamp_ns = now_ns;

    out_frame->gyro.x = 0.0f;
    out_frame->gyro.y = 0.0f;
    out_frame->gyro.z = 0.0f;
    out_frame->gyro.timestamp_ns = now_ns;

    out_frame->light.lux = 250.0f;
    out_frame->light.timestamp_ns = now_ns;

    /* Hinge evaluation */
    out_frame->hinge.angle_deg = hinge_deg;
    out_frame->hinge.is_folded = (hinge_deg <= 25.0f);
    out_frame->hinge.is_flat = (hinge_deg >= 160.0f && hinge_deg <= 200.0f);
    out_frame->hinge.is_tent = (hinge_deg > 200.0f && hinge_deg < 340.0f);

    /* Mathematical Sensor Fusion: Pitch & Roll */
    float norm_sq = ax * ax + ay * ay + az * az;
    if (norm_sq > 0.01f) {
        float pitch = atan2f(-ax, sqrtf(ay * ay + az * az)) * RAD_TO_DEG;
        float roll  = atan2f(ay, az) * RAD_TO_DEG;
        out_frame->pitch_deg = pitch;
        out_frame->roll_deg = roll;

        /* Orientation state machine */
        if (fabsf(pitch) < 30.0f && fabsf(roll) < 30.0f && az > 5.0f) {
            out_frame->orientation = SAP_ORIENT_FLAT_UP;
        } else if (fabsf(pitch) < 30.0f && fabsf(roll) < 30.0f && az < -5.0f) {
            out_frame->orientation = SAP_ORIENT_FLAT_DOWN;
        } else if (ay > 5.0f && fabsf(ax) < 4.0f) {
            out_frame->orientation = SAP_ORIENT_PORTRAIT_UP;
        } else if (ay < -5.0f && fabsf(ax) < 4.0f) {
            out_frame->orientation = SAP_ORIENT_PORTRAIT_DOWN;
        } else if (ax > 5.0f) {
            out_frame->orientation = SAP_ORIENT_LANDSCAPE_RIGHT;
        } else if (ax < -5.0f) {
            out_frame->orientation = SAP_ORIENT_LANDSCAPE_LEFT;
        } else {
            out_frame->orientation = SAP_ORIENT_PORTRAIT_UP;
        }
    } else {
        out_frame->orientation = SAP_ORIENT_UNKNOWN;
    }

    return 0;
}
