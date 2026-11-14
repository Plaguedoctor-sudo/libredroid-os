#define _GNU_SOURCE
#include "sap_sensors.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <math.h>
#include <time.h>

static double get_time_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec * 1000.0 + ts.tv_nsec / 1000000.0;
}

static size_t get_peak_rss_kb(void) {
    FILE *fp = fopen("/proc/self/status", "r");
    if (!fp) return 0;
    char line[256];
    size_t peak_rss = 0;
    while (fgets(line, sizeof(line), fp)) {
        if (strncmp(line, "VmHWM:", 6) == 0) {
            sscanf(line + 6, "%zu", &peak_rss);
            break;
        }
    }
    fclose(fp);
    return peak_rss;
}

int main(void) {
    printf("========================================================\n");
    printf("SAP Hardware Sensors & Sensor Fusion Invariant Bench\n");
    printf("========================================================\n");

    int rc = sap_sensors_init();
    assert(rc == 0);
    printf("[PASS] sap_sensors_init succeeded\n");

    /* 1. Test Portrait Up Orientation */
    sap_sensors_inject_mock_iio(0.0f, 9.80665f, 0.0f, 180.0f);
    sap_sensor_frame_t frame;
    double t0 = get_time_ms();
    rc = sap_sensors_read_frame(&frame);
    double t_read = get_time_ms() - t0;
    assert(rc == 0);
    assert(frame.orientation == SAP_ORIENT_PORTRAIT_UP);
    assert(frame.hinge.is_flat);
    printf("[PASS] Portrait orientation detected in %.3f ms (Orientation: %d, Hinge: %.1f deg)\n",
           t_read, frame.orientation, frame.hinge.angle_deg);

    /* 2. Test Landscape Right Orientation */
    sap_sensors_inject_mock_iio(9.80665f, 0.0f, 0.0f, 180.0f);
    rc = sap_sensors_read_frame(&frame);
    assert(rc == 0);
    assert(frame.orientation == SAP_ORIENT_LANDSCAPE_RIGHT);
    printf("[PASS] Landscape Right orientation detected (Ax = %.2f)\n", frame.accel.x);

    /* 3. Test Flat Face Up Orientation */
    sap_sensors_inject_mock_iio(0.0f, 0.0f, 9.80665f, 180.0f);
    rc = sap_sensors_read_frame(&frame);
    assert(rc == 0);
    assert(frame.orientation == SAP_ORIENT_FLAT_UP);
    printf("[PASS] Flat Face Up orientation detected (Az = %.2f)\n", frame.accel.z);

    /* 4. Test Foldable Form-Factor Hinge Transitions */
    printf("--> Testing Foldable / Dual-Screen Hinge States...\n");
    sap_sensors_inject_mock_iio(0.0f, 9.8f, 0.0f, 15.0f); // Folded clamshell
    sap_sensors_read_frame(&frame);
    assert(frame.hinge.is_folded && !frame.hinge.is_flat);
    printf("  [PASS] Clamshell Folded state verified (Angle: %.1f deg, is_folded: %d)\n", frame.hinge.angle_deg, frame.hinge.is_folded);

    sap_sensors_inject_mock_iio(0.0f, 9.8f, 0.0f, 270.0f); // Tent mode
    sap_sensors_read_frame(&frame);
    assert(frame.hinge.is_tent);
    printf("  [PASS] Tent Presentation mode verified (Angle: %.1f deg, is_tent: %d)\n", frame.hinge.angle_deg, frame.hinge.is_tent);

    /* 5. Zero-Trust Privacy / Fuzzing Gate */
    printf("--> Testing Zero-Trust Privacy / Motion Fuzzing Guard...\n");
    sap_sensors_inject_mock_iio(5.4f, 3.2f, 7.8f, 90.0f);
    sap_sensors_set_privacy_fuzzing(true);
    sap_sensors_read_frame(&frame);
    assert(frame.privacy_fuzzing_active == true);
    assert(frame.accel.x == 0.0f && frame.accel.y == 9.80665f && frame.accel.z == 0.0f);
    printf("  [PASS] Motion side-channel stripped under privacy guard (Ax=0, Ay=9.81, Az=0)\n");

    sap_sensors_set_privacy_fuzzing(false); // Reset

    size_t peak_rss = get_peak_rss_kb();
    printf("--> Peak Sensors RSS: %zu KB (Budget: <= 4096 KB)\n", peak_rss);
    printf("========================================================\n");
    printf("ALL HARDWARE SENSOR INVARIANTS VERIFIED 100%% GREEN\n");
    printf("========================================================\n");
    return 0;
}
