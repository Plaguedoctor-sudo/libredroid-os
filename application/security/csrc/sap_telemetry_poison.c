#define _GNU_SOURCE
#include "sap_security.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <time.h>

static int g_rand_fd = -1;
static const char *s_device_models[] = {
    "SM-S928B (Galaxy S24 Ultra)",
    "Pixel 8 Pro (husky)",
    "iPhone16,2 (iPhone 15 Pro Max)",
    "23127PN0CG (Xiaomi 14)",
    "CPH2581 (OnePlus 12)"
};

static const char *s_event_types[] = {
    "ad_impression",
    "screen_view",
    "search_query",
    "content_interaction",
    "purchase_intent",
    "location_heartbeat"
};

int sap_poison_init(void) {
    if (g_rand_fd < 0) {
        g_rand_fd = open("/dev/urandom", O_RDONLY | O_CLOEXEC);
        if (g_rand_fd < 0) return -1;
    }
    return 0;
}

static void generate_uuid_v4(char out_uuid[37]) {
    uint8_t bytes[16];
    if (g_rand_fd >= 0 && read(g_rand_fd, bytes, 16) == 16) {
        /* RFC 4122 variant */
        bytes[6] = (bytes[6] & 0x0F) | 0x40; // Version 4
        bytes[8] = (bytes[8] & 0x3F) | 0x80; // Variant 1
    } else {
        /* Fallback */
        for (int i = 0; i < 16; i++) bytes[i] = (uint8_t)(rand() & 0xFF);
        bytes[6] = 0x40;
        bytes[8] = 0x80;
    }

    snprintf(out_uuid, 37,
        "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
        bytes[0], bytes[1], bytes[2], bytes[3],
        bytes[4], bytes[5],
        bytes[6], bytes[7],
        bytes[8], bytes[9],
        bytes[10], bytes[11], bytes[12], bytes[13], bytes[14], bytes[15]
    );
}

int sap_poison_generate_json(char *out_buf, size_t max_len, size_t *out_len) {
    if (!out_buf || max_len < 256 || !out_len) return -1;
    if (g_rand_fd < 0) sap_poison_init();

    sap_poison_telemetry_t payload;
    memset(&payload, 0, sizeof(payload));

    generate_uuid_v4(payload.synthetic_gaid);
    generate_uuid_v4(payload.synthetic_idfa);

    uint32_t r = 0;
    if (g_rand_fd >= 0) {
        if (read(g_rand_fd, &r, sizeof(r)) != sizeof(r)) r = (uint32_t)rand();
    } else {
        r = (uint32_t)rand();
    }

    strncpy(payload.spoofed_device, s_device_models[r % 5], sizeof(payload.spoofed_device) - 1);
    strncpy(payload.event_type, s_event_types[(r >> 3) % 6], sizeof(payload.event_type) - 1);

    /* Generate 128-bit hex entropy */
    uint8_t entropy_bytes[16];
    if (g_rand_fd >= 0) {
        if (read(g_rand_fd, entropy_bytes, 16) != 16) memset(entropy_bytes, 0xA5, 16);
    } else {
        memset(entropy_bytes, 0x5A, 16);
    }

    for (int i = 0; i < 16; i++) {
        snprintf(payload.high_entropy_seed + (i * 2), 3, "%02x", entropy_bytes[i]);
    }

    /* Plausible geo coordinates (jittered latitude/longitude) */
    payload.fake_lat = 37.7749 + (((double)(r & 0xFFFF) / 65535.0) - 0.5) * 0.1;
    payload.fake_lon = -122.4194 + (((double)((r >> 16) & 0xFFFF) / 65535.0) - 0.5) * 0.1;

    struct timespec ts;
    clock_gettime(CLOCK_REALTIME, &ts);
    payload.timestamp_ms = (uint64_t)ts.tv_sec * 1000 + (ts.tv_nsec / 1000000);

    int written = snprintf(out_buf, max_len,
        "{\"event\":\"%s\","
        "\"ad_id\":\"%s\","
        "\"idfa\":\"%s\","
        "\"device\":\"%s\","
        "\"entropy\":\"%s\","
        "\"geo\":{\"lat\":%.6f,\"lon\":%.6f},"
        "\"timestamp_ms\":%lu,"
        "\"poisoned\":true}",
        payload.event_type,
        payload.synthetic_gaid,
        payload.synthetic_idfa,
        payload.spoofed_device,
        payload.high_entropy_seed,
        payload.fake_lat,
        payload.fake_lon,
        payload.timestamp_ms
    );

    if (written < 0 || (size_t)written >= max_len) return -1;
    *out_len = (size_t)written;
    return 0;
}

int sap_poison_intercept_payload(const char *raw_request, char *out_poisoned, size_t max_len) {
    if (!raw_request || !out_poisoned || max_len < 256) return -1;

    /* Detect telemetry / tracking signatures in HTTP request */
    bool is_telemetry = (strstr(raw_request, "telemetry") != NULL ||
                         strstr(raw_request, "analytics") != NULL ||
                         strstr(raw_request, "graph.facebook.com") != NULL ||
                         strstr(raw_request, "app-measurement.com") != NULL ||
                         strstr(raw_request, "adjust.com") != NULL ||
                         strstr(raw_request, "appsflyer") != NULL);

    if (!is_telemetry) {
        /* Passthrough */
        strncpy(out_poisoned, raw_request, max_len - 1);
        out_poisoned[max_len - 1] = '\0';
        return 0;
    }

    /* Replace body with high-entropy poisoned payload */
    size_t poison_len = 0;
    return sap_poison_generate_json(out_poisoned, max_len, &poison_len);
}
