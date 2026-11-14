#define _GNU_SOURCE
#include "sap_notifications.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static sap_notif_queue_t g_queue;
static uint32_t g_next_id = 1;
static bool g_notif_initialized = false;

static uint64_t get_time_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_REALTIME, &ts);
    return (uint64_t)ts.tv_sec * 1000ULL + (ts.tv_nsec / 1000000ULL);
}

int sap_notifications_init(void) {
    memset(&g_queue, 0, sizeof(g_queue));
    g_next_id = 1;
    g_notif_initialized = true;
    return 0;
}

int sap_notifications_dispatch(const char *app_id, const char *title, const char *body, sap_notif_priority_t priority, uint32_t *out_id) {
    if (!app_id || !title || !body) return -1;
    if (!g_notif_initialized) sap_notifications_init();

    if (g_queue.count >= SAP_NOTIF_QUEUE_CAPACITY) {
        /* Queue full: drop lowest priority item to make room for new high/urgent item */
        if (priority <= SAP_NOTIF_PRIORITY_LOW) return -1; // Drop incoming low if full
        g_queue.head = (g_queue.head + 1) % SAP_NOTIF_QUEUE_CAPACITY;
        g_queue.count--;
    }

    uint32_t idx = g_queue.tail;
    sap_notification_item_t *item = &g_queue.items[idx];

    item->id = g_next_id++;
    strncpy(item->app_id, app_id, sizeof(item->app_id) - 1);
    strncpy(item->title, title, sizeof(item->title) - 1);
    strncpy(item->body, body, sizeof(item->body) - 1);
    item->priority = priority;
    item->timestamp_ms = get_time_ms();
    item->delivered = false;

    g_queue.tail = (g_queue.tail + 1) % SAP_NOTIF_QUEUE_CAPACITY;
    g_queue.count++;
    g_queue.total_dispatched++;

    if (out_id) *out_id = item->id;
    return 0;
}

int sap_notifications_poll_next(sap_notification_item_t *out_item) {
    if (!out_item || g_queue.count == 0) return -1;
    if (!g_notif_initialized) sap_notifications_init();

    /* Find highest priority item in queue */
    int highest_idx = -1;
    sap_notif_priority_t highest_prio = SAP_NOTIF_PRIORITY_LOW;

    for (uint32_t i = 0; i < g_queue.count; i++) {
        uint32_t slot = (g_queue.head + i) % SAP_NOTIF_QUEUE_CAPACITY;
        if (!g_queue.items[slot].delivered) {
            if (highest_idx < 0 || g_queue.items[slot].priority > highest_prio) {
                highest_idx = slot;
                highest_prio = g_queue.items[slot].priority;
            }
        }
    }

    if (highest_idx < 0) return -1;

    memcpy(out_item, &g_queue.items[highest_idx], sizeof(sap_notification_item_t));
    g_queue.items[highest_idx].delivered = true;

    /* Advance head past delivered entries */
    while (g_queue.count > 0 && g_queue.items[g_queue.head].delivered) {
        g_queue.head = (g_queue.head + 1) % SAP_NOTIF_QUEUE_CAPACITY;
        g_queue.count--;
    }

    return 0;
}

uint32_t sap_notifications_get_pending_count(void) {
    return g_queue.count;
}

int sap_notifications_dismiss(uint32_t id) {
    for (uint32_t i = 0; i < g_queue.count; i++) {
        uint32_t slot = (g_queue.head + i) % SAP_NOTIF_QUEUE_CAPACITY;
        if (g_queue.items[slot].id == id) {
            g_queue.items[slot].delivered = true;
            return 0;
        }
    }
    return -1;
}
