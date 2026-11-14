#ifndef SAP_NOTIFICATIONS_H
#define SAP_NOTIFICATIONS_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#define SAP_NOTIF_MAX_TITLE 64
#define SAP_NOTIF_MAX_BODY 256
#define SAP_NOTIF_MAX_APP_ID 64
#define SAP_NOTIF_QUEUE_CAPACITY 32

typedef enum {
    SAP_NOTIF_PRIORITY_LOW = 0,
    SAP_NOTIF_PRIORITY_NORMAL,
    SAP_NOTIF_PRIORITY_HIGH,
    SAP_NOTIF_PRIORITY_URGENT, // Critical alarms, incoming calls, E911
} sap_notif_priority_t;

typedef struct {
    uint32_t id;
    char app_id[SAP_NOTIF_MAX_APP_ID];
    char title[SAP_NOTIF_MAX_TITLE];
    char body[SAP_NOTIF_MAX_BODY];
    sap_notif_priority_t priority;
    uint64_t timestamp_ms;
    bool delivered;
} sap_notification_item_t;

typedef struct {
    sap_notification_item_t items[SAP_NOTIF_QUEUE_CAPACITY];
    uint32_t head;
    uint32_t tail;
    uint32_t count;
    uint32_t total_dispatched;
} sap_notif_queue_t;

// Initialize notifications subsystem
int sap_notifications_init(void);

// Enqueue and dispatch a notification with priority and rate-limiting
int sap_notifications_dispatch(const char *app_id, const char *title, const char *body, sap_notif_priority_t priority, uint32_t *out_id);

// Pop the highest priority pending notification for display in shell system-ui
int sap_notifications_poll_next(sap_notification_item_t *out_item);

// Get current pending notification count
uint32_t sap_notifications_get_pending_count(void);

// Dismiss or acknowledge notification by ID
int sap_notifications_dismiss(uint32_t id);

#endif // SAP_NOTIFICATIONS_H
