#ifndef SAP_SENSORS_H
#define SAP_SENSORS_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

typedef enum {
    SAP_ORIENT_UNKNOWN = 0,
    SAP_ORIENT_PORTRAIT_UP,
    SAP_ORIENT_PORTRAIT_DOWN,
    SAP_ORIENT_LANDSCAPE_LEFT,
    SAP_ORIENT_LANDSCAPE_RIGHT,
    SAP_ORIENT_FLAT_UP,
    SAP_ORIENT_FLAT_DOWN,
} sap_orientation_t;

typedef struct {
    float x; // m/s^2
    float y;
    float z;
    uint64_t timestamp_ns;
} sap_accel_data_t;

typedef struct {
    float x; // rad/s
    float y;
    float z;
    uint64_t timestamp_ns;
} sap_gyro_data_t;

typedef struct {
    float lux;
    uint64_t timestamp_ns;
} sap_light_data_t;

typedef struct {
    float angle_deg; // 0.0 (closed) to 360.0 (fully flipped)
    bool is_folded;
    bool is_flat;
    bool is_tent;
} sap_hinge_data_t;

typedef struct {
    sap_accel_data_t accel;
    sap_gyro_data_t  gyro;
    sap_light_data_t light;
    sap_hinge_data_t hinge;
    sap_orientation_t orientation;
    float pitch_deg;
    float roll_deg;
    bool privacy_fuzzing_active; // If true, raw readings are sanitized to prevent side-channel surveillance
} sap_sensor_frame_t;

// Initialize sensors subsystem: probes Linux IIO devices /sys/bus/iio/devices/
int sap_sensors_init(void);

// Set privacy / zero-trust fuzzing mode (quarantines apps lacking CAP_SENSORS)
void sap_sensors_set_privacy_fuzzing(bool enable);

// Read latest consolidated sensor frame
int sap_sensors_read_frame(sap_sensor_frame_t *out_frame);

// Inject synthetic raw values (used in container test environments without physical silicon)
int sap_sensors_inject_mock_iio(float ax, float ay, float az, float hinge_deg);

#endif // SAP_SENSORS_H
