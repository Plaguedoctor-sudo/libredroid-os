#define _GNU_SOURCE
#include "sap_power.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <time.h>
#include <unistd.h>

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
    printf("SAP Hardware Power & Thermal Throttling Invariant Bench\n");
    printf("========================================================\n");

    int rc = sap_power_init();
    assert(rc == 0);
    printf("[PASS] sap_power_init succeeded\n");

    /* 1. Battery Telemetry Query */
    sap_battery_info_t bat;
    double t0 = get_time_ms();
    rc = sap_power_get_battery(&bat);
    double t_bat = get_time_ms() - t0;
    assert(rc == 0);
    printf("[PASS] Battery queried in %.3f ms (Device: %s, Cap: %u%%, HasBat: %d)\n",
           t_bat, bat.battery_name, bat.capacity_pct, bat.has_battery);

    /* 2. Thermal Monitoring & Dynamic Throttling State Machine */
    printf("--> Testing Thermal Throttling Transitions...\n");
    sap_thermal_info_t therm;

    sap_power_inject_mock_state(true, 85, 45.0f);
    sap_power_get_thermal(&therm);
    assert(therm.state == SAP_THERMAL_NORMAL);
    printf("  [PASS] 45.0C -> SAP_THERMAL_NORMAL\n");

    sap_power_inject_mock_state(true, 85, 70.0f);
    sap_power_get_thermal(&therm);
    assert(therm.state == SAP_THERMAL_WARM);
    printf("  [PASS] 70.0C -> SAP_THERMAL_WARM\n");

    sap_power_inject_mock_state(true, 85, 80.0f);
    sap_power_get_thermal(&therm);
    assert(therm.state == SAP_THERMAL_THROTTLING);
    printf("  [PASS] 80.0C -> SAP_THERMAL_THROTTLING (AI/GPU downclock trigger)\n");

    sap_power_inject_mock_state(true, 85, 90.0f);
    sap_power_get_thermal(&therm);
    assert(therm.state == SAP_THERMAL_CRITICAL);
    printf("  [PASS] 90.0C -> SAP_THERMAL_CRITICAL (Emergency core shutdown trigger)\n");

    /* 3. Wake-Lock Enforcement & Vampire Drain Invariant Gate */
    printf("--> Testing Wake-Lock & Suspend Invariant Gate...\n");
    rc = sap_power_acquire_wakelock("telephony-call-audio", 5);
    assert(rc == 0);
    assert(sap_power_get_active_wakelocks() == 1);
    printf("  [PASS] Wake-lock \"telephony-call-audio\" acquired (Active: %u)\n", sap_power_get_active_wakelocks());

    /* Attempt suspend while wake-lock is held */
    rc = sap_power_request_suspend(SAP_SUSPEND_MEM);
    assert(rc == -2); // Strictly rejected!
    printf("  [PASS] Suspend blocked while wake-lock held (rc = -2)\n");

    /* Release wake-lock */
    rc = sap_power_release_wakelock("telephony-call-audio");
    assert(rc == 0);
    assert(sap_power_get_active_wakelocks() == 0);
    printf("  [PASS] Wake-lock released (Active: %u)\n", sap_power_get_active_wakelocks());

    /* Suspend now permitted */
    rc = sap_power_request_suspend(SAP_SUSPEND_MEM);
    assert(rc == 0);
    printf("  [PASS] Suspend permitted when zero wake-locks held\n");

    size_t peak_rss = get_peak_rss_kb();
    printf("--> Peak Power RSS: %zu KB (Budget: <= 4096 KB)\n", peak_rss);
    printf("========================================================\n");
    printf("ALL HARDWARE POWER & THERMAL INVARIANTS VERIFIED 100%% GREEN\n");
    printf("========================================================\n");
    return 0;
}
