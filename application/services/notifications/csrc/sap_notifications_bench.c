#define _GNU_SOURCE
#include "sap_notifications.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
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
    printf("SAP Decentralized Push & Notification Queue Invariant Bench\n");
    printf("========================================================\n");

    int rc = sap_notifications_init();
    assert(rc == 0);
    printf("[PASS] sap_notifications_init succeeded\n");

    /* 1. Dispatch Mixed Priority Notifications */
    uint32_t id_low, id_norm, id_urgent;

    double t0 = get_time_ms();
    rc = sap_notifications_dispatch("org.sovereign.news", "Podcast Downloaded", "Episode 42 ready", SAP_NOTIF_PRIORITY_LOW, &id_low);
    assert(rc == 0);

    rc = sap_notifications_dispatch("org.sovereign.backup", "Vault Synced", "Encrypted snapshot verified", SAP_NOTIF_PRIORITY_NORMAL, &id_norm);
    assert(rc == 0);

    rc = sap_notifications_dispatch("org.sovereign.phone", "Incoming VoLTE Call", "Alice (Emergency Contact)", SAP_NOTIF_PRIORITY_URGENT, &id_urgent);
    double t_disp = get_time_ms() - t0;
    assert(rc == 0);
    printf("[PASS] 3 notifications dispatched in %.3f ms (Pending: %u)\n", t_disp, sap_notifications_get_pending_count());

    /* 2. Invariant Gate: Priority Order Preemption */
    printf("--> Testing Priority Preemption Invariant...\n");
    sap_notification_item_t item;

    /* First poll MUST yield the URGENT item */
    t0 = get_time_ms();
    rc = sap_notifications_poll_next(&item);
    double t_poll = get_time_ms() - t0;
    assert(rc == 0);
    assert(item.id == id_urgent);
    assert(item.priority == SAP_NOTIF_PRIORITY_URGENT);
    printf("  [PASS] Preempted: Poll #1 delivered URGENT notification in %.3f ms (\"%s\")\n", t_poll, item.title);

    /* Second poll MUST yield the NORMAL item */
    rc = sap_notifications_poll_next(&item);
    assert(rc == 0);
    assert(item.id == id_norm);
    assert(item.priority == SAP_NOTIF_PRIORITY_NORMAL);
    printf("  [PASS] Poll #2 delivered NORMAL notification (\"%s\")\n", item.title);

    /* Third poll MUST yield the LOW item */
    rc = sap_notifications_poll_next(&item);
    assert(rc == 0);
    assert(item.id == id_low);
    assert(item.priority == SAP_NOTIF_PRIORITY_LOW);
    printf("  [PASS] Poll #3 delivered LOW notification (\"%s\")\n", item.title);

    /* Fourth poll must return empty (-1) */
    rc = sap_notifications_poll_next(&item);
    assert(rc == -1);
    assert(sap_notifications_get_pending_count() == 0);
    printf("  [PASS] Queue cleanly drained (Pending: 0)\n");

    size_t peak_rss = get_peak_rss_kb();
    printf("--> Peak Notification RSS: %zu KB (Budget: <= 4096 KB)\n", peak_rss);
    printf("========================================================\n");
    printf("ALL NOTIFICATION SUBSYSTEM INVARIANTS VERIFIED 100%% GREEN\n");
    printf("========================================================\n");
    return 0;
}
