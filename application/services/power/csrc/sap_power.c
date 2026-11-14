#define _GNU_SOURCE
#include "sap_power.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <fcntl.h>
#include <unistd.h>
#include <time.h>

#define MAX_WAKELOCKS 32

typedef struct {
    char name[64];
    uint64_t expire_time_ms;
    bool active;
} wakelock_entry_t;

static bool g_power_initialized = false;
static char g_battery_sysfs_path[512] = {0};
static bool g_has_hw_battery = false;
static wakelock_entry_t g_wakelocks[MAX_WAKELOCKS];

/* Mock injection defaults */
static bool g_mock_override = false;
static bool g_mock_has_battery = true;
static uint32_t g_mock_cap_pct = 85;
static float g_mock_temp_c = 42.5f;

static uint64_t get_time_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint64_t)ts.tv_sec * 1000ULL + (ts.tv_nsec / 1000000ULL);
}

static int read_sysfs_int(const char *path, int *out_val) {
    int fd = open(path, O_RDONLY);
    if (fd < 0) return -1;
    char buf[64];
    ssize_t n = read(fd, buf, sizeof(buf) - 1);
    close(fd);
    if (n <= 0) return -1;
    buf[n] = '\0';
    *out_val = atoi(buf);
    return 0;
}

static int read_sysfs_str(const char *path, char *out_buf, size_t max_len) {
    int fd = open(path, O_RDONLY);
    if (fd < 0) return -1;
    ssize_t n = read(fd, out_buf, max_len - 1);
    close(fd);
    if (n <= 0) return -1;
    out_buf[n] = '\0';
    /* Strip trailing newline */
    if (n > 0 && out_buf[n - 1] == '\n') out_buf[n - 1] = '\0';
    return 0;
}

int sap_power_init(void) {
    if (g_power_initialized) return 0;

    memset(g_wakelocks, 0, sizeof(g_wakelocks));

    /* Search for battery power supply */
    DIR *dir = opendir("/sys/class/power_supply");
    if (dir) {
        struct dirent *ent;
        while ((ent = readdir(dir)) != NULL) {
            if (ent->d_name[0] == '.') continue;
            char type_path[512];
            snprintf(type_path, sizeof(type_path), "/sys/class/power_supply/%.64s/type", ent->d_name);
            char type_buf[32];
            if (read_sysfs_str(type_path, type_buf, sizeof(type_buf)) == 0) {
                if (strncmp(type_buf, "Battery", 7) == 0) {
                    snprintf(g_battery_sysfs_path, sizeof(g_battery_sysfs_path), "/sys/class/power_supply/%.64s", ent->d_name);
                    g_has_hw_battery = true;
                    break;
                }
            }
        }
        closedir(dir);
    }

    g_power_initialized = true;
    return 0;
}

void sap_power_inject_mock_state(bool has_battery, uint32_t cap_pct, float temp_c) {
    g_mock_override = true;
    g_mock_has_battery = has_battery;
    g_mock_cap_pct = (cap_pct > 100) ? 100 : cap_pct;
    g_mock_temp_c = temp_c;
}

int sap_power_get_battery(sap_battery_info_t *out_info) {
    if (!out_info) return -1;
    if (!g_power_initialized) sap_power_init();

    memset(out_info, 0, sizeof(sap_battery_info_t));

    if (g_mock_override) {
        out_info->has_battery = g_mock_has_battery;
        out_info->capacity_pct = g_mock_cap_pct;
        out_info->status = SAP_BATTERY_STATUS_DISCHARGING;
        out_info->current_ua = -450000; // -450 mA
        out_info->voltage_uv = 3850000; // 3.85 V
        strncpy(out_info->battery_name, "mock-bat0", sizeof(out_info->battery_name) - 1);
        return 0;
    }

    if (!g_has_hw_battery) {
        /* AC powered system without battery */
        out_info->has_battery = false;
        out_info->capacity_pct = 100;
        out_info->status = SAP_BATTERY_STATUS_NOT_CHARGING;
        strncpy(out_info->battery_name, "ac-mains", sizeof(out_info->battery_name) - 1);
        return 0;
    }

    out_info->has_battery = true;
    char path[512];
    int val = 0;

    snprintf(path, sizeof(path), "%.400s/capacity", g_battery_sysfs_path);
    if (read_sysfs_int(path, &val) == 0) out_info->capacity_pct = (uint32_t)val;

    snprintf(path, sizeof(path), "%.400s/voltage_now", g_battery_sysfs_path);
    if (read_sysfs_int(path, &val) == 0) out_info->voltage_uv = (uint32_t)val;

    snprintf(path, sizeof(path), "%.400s/current_now", g_battery_sysfs_path);
    if (read_sysfs_int(path, &val) == 0) out_info->current_ua = val;

    char status_str[32];
    snprintf(path, sizeof(path), "%.400s/status", g_battery_sysfs_path);
    if (read_sysfs_str(path, status_str, sizeof(status_str)) == 0) {
        if (strncmp(status_str, "Charging", 8) == 0) out_info->status = SAP_BATTERY_STATUS_CHARGING;
        else if (strncmp(status_str, "Discharging", 11) == 0) out_info->status = SAP_BATTERY_STATUS_DISCHARGING;
        else if (strncmp(status_str, "Full", 4) == 0) out_info->status = SAP_BATTERY_STATUS_FULL;
        else out_info->status = SAP_BATTERY_STATUS_NOT_CHARGING;
    }

    return 0;
}

int sap_power_get_thermal(sap_thermal_info_t *out_info) {
    if (!out_info) return -1;
    memset(out_info, 0, sizeof(sap_thermal_info_t));

    if (g_mock_override) {
        out_info->max_temp_c = g_mock_temp_c;
        out_info->zone_count = 1;
    } else {
        float max_t = 0.0f;
        uint32_t count = 0;
        DIR *dir = opendir("/sys/class/thermal");
        if (dir) {
            struct dirent *ent;
            while ((ent = readdir(dir)) != NULL) {
                if (strncmp(ent->d_name, "thermal_zone", 12) == 0) {
                    char t_path[512];
                    snprintf(t_path, sizeof(t_path), "/sys/class/thermal/%.64s/temp", ent->d_name);
                    int raw_temp = 0;
                    if (read_sysfs_int(t_path, &raw_temp) == 0 && raw_temp > 0) {
                        float deg = (float)raw_temp / 1000.0f;
                        if (deg > max_t) max_t = deg;
                        count++;
                    }
                }
            }
            closedir(dir);
        }
        out_info->max_temp_c = (count > 0) ? max_t : 38.0f;
        out_info->zone_count = count;
    }

    /* Evaluate throttling classification */
    if (out_info->max_temp_c >= 85.0f) {
        out_info->state = SAP_THERMAL_CRITICAL;
    } else if (out_info->max_temp_c >= 75.0f) {
        out_info->state = SAP_THERMAL_THROTTLING;
    } else if (out_info->max_temp_c >= 65.0f) {
        out_info->state = SAP_THERMAL_WARM;
    } else {
        out_info->state = SAP_THERMAL_NORMAL;
    }

    return 0;
}

int sap_power_acquire_wakelock(const char *name, uint32_t timeout_sec) {
    if (!name || strlen(name) == 0 || timeout_sec == 0) return -1;
    uint64_t now_ms = get_time_ms();
    uint64_t expire_ms = now_ms + ((uint64_t)timeout_sec * 1000ULL);

    int free_slot = -1;
    for (int i = 0; i < MAX_WAKELOCKS; i++) {
        if (g_wakelocks[i].active && strcmp(g_wakelocks[i].name, name) == 0) {
            /* Update existing lease */
            g_wakelocks[i].expire_time_ms = expire_ms;
            return 0;
        }
        if (!g_wakelocks[i].active && free_slot < 0) {
            free_slot = i;
        }
    }

    if (free_slot < 0) return -1; // Wake lock table exhausted

    strncpy(g_wakelocks[free_slot].name, name, sizeof(g_wakelocks[free_slot].name) - 1);
    g_wakelocks[free_slot].expire_time_ms = expire_ms;
    g_wakelocks[free_slot].active = true;

    /* Write to kernel wake_lock if accessible */
    int fd = open("/sys/power/wake_lock", O_WRONLY);
    if (fd >= 0) {
        if (write(fd, name, strlen(name)) < 0) {
            /* Handled */
        }
        close(fd);
    }

    return 0;
}

int sap_power_release_wakelock(const char *name) {
    if (!name) return -1;
    for (int i = 0; i < MAX_WAKELOCKS; i++) {
        if (g_wakelocks[i].active && strcmp(g_wakelocks[i].name, name) == 0) {
            g_wakelocks[i].active = false;

            int fd = open("/sys/power/wake_unlock", O_WRONLY);
            if (fd >= 0) {
                if (write(fd, name, strlen(name)) < 0) {
                    /* Handled */
                }
                close(fd);
            }
            return 0;
        }
    }
    return -1; // Not found
}

uint32_t sap_power_get_active_wakelocks(void) {
    uint64_t now_ms = get_time_ms();
    uint32_t active_count = 0;

    for (int i = 0; i < MAX_WAKELOCKS; i++) {
        if (g_wakelocks[i].active) {
            if (now_ms >= g_wakelocks[i].expire_time_ms) {
                /* Auto-reap expired vampire wake-lock */
                g_wakelocks[i].active = false;
            } else {
                active_count++;
            }
        }
    }
    return active_count;
}

int sap_power_request_suspend(sap_suspend_mode_t mode) {
    (void)mode;
    uint32_t held = sap_power_get_active_wakelocks();
    if (held > 0) {
        /* Suspend rejected: active wake-locks prevent sleep! */
        return -2;
    }

    /* Real suspend command to Linux kernel */
    int fd = open("/sys/power/state", O_WRONLY);
    if (fd >= 0) {
        const char *state_str = (mode == SAP_SUSPEND_FREEZE) ? "freeze" : "mem";
        ssize_t n = write(fd, state_str, strlen(state_str));
        close(fd);
        if (n > 0) return 0;
    }

    /* Simulated suspend success when running unprivileged */
    return 0;
}
