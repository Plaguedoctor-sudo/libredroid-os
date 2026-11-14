#ifndef SAP_POWER_H
#define SAP_POWER_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

typedef enum {
    SAP_BATTERY_STATUS_UNKNOWN = 0,
    SAP_BATTERY_STATUS_CHARGING,
    SAP_BATTERY_STATUS_DISCHARGING,
    SAP_BATTERY_STATUS_FULL,
    SAP_BATTERY_STATUS_NOT_CHARGING,
} sap_battery_status_t;

typedef enum {
    SAP_THERMAL_NORMAL = 0,     // < 65 C
    SAP_THERMAL_WARM,           // 65 - 75 C
    SAP_THERMAL_THROTTLING,     // 75 - 85 C (triggers AI/GPU backoff)
    SAP_THERMAL_CRITICAL,       // > 85 C (emergency thermal shutdown)
} sap_thermal_state_t;

typedef enum {
    SAP_SUSPEND_FREEZE = 0, // s2idle
    SAP_SUSPEND_MEM    = 1, // deep ram suspend
} sap_suspend_mode_t;

typedef struct {
    bool has_battery;
    uint32_t capacity_pct;           // 0 - 100
    sap_battery_status_t status;
    int32_t current_ua;              // microamps (+ charging, - discharging)
    uint32_t voltage_uv;             // microvolts
    char battery_name[32];
} sap_battery_info_t;

typedef struct {
    float max_temp_c;
    sap_thermal_state_t state;
    uint32_t zone_count;
} sap_thermal_info_t;

// Initialize power subsystem: probes /sys/class/power_supply and /sys/class/thermal
int sap_power_init(void);

// Read current battery statistics
int sap_power_get_battery(sap_battery_info_t *out_info);

// Read current thermal zones and throttling state
int sap_power_get_thermal(sap_thermal_info_t *out_info);

// Acquire named wake-lock with timeout (seconds) to prevent battery drain
int sap_power_acquire_wakelock(const char *name, uint32_t timeout_sec);

// Release named wake-lock
int sap_power_release_wakelock(const char *name);

// Get number of currently active wake-locks
uint32_t sap_power_get_active_wakelocks(void);

// Request system suspend (returns error if wake-locks are held)
int sap_power_request_suspend(sap_suspend_mode_t mode);

// Mock injection for CI / virtual environments without battery
void sap_power_inject_mock_state(bool has_battery, uint32_t cap_pct, float temp_c);

#endif // SAP_POWER_H
