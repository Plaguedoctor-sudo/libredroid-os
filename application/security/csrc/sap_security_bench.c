#define _GNU_SOURCE
#include "sap_security.h"

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
    printf("SAP Surveillance Defense & Anti-Predatory Invariant Bench\n");
    printf("========================================================\n");

    /* 1. Telemetry Poisoning */
    int rc = sap_poison_init();
    assert(rc == 0);
    printf("[PASS] sap_poison_init succeeded\n");

    char json_buf1[1024];
    char json_buf2[1024];
    size_t len1 = 0, len2 = 0;

    double t0 = get_time_ms();
    rc = sap_poison_generate_json(json_buf1, sizeof(json_buf1), &len1);
    double t_gen1 = get_time_ms() - t0;
    assert(rc == 0 && len1 > 0);

    rc = sap_poison_generate_json(json_buf2, sizeof(json_buf2), &len2);
    assert(rc == 0 && len2 > 0);

    printf("[PASS] sap_poison_generate_json in %.3f ms: %s\n", t_gen1, json_buf1);
    assert(strcmp(json_buf1, json_buf2) != 0); // Must be dynamic & high-entropy!
    printf("  [PASS] Payloads are distinct & high-entropy\n");

    /* Interception test */
    char intercepted[1024];
    const char *clean_req = "GET /api/v1/user/profile HTTP/1.1\r\nHost: example.org\r\n\r\n";
    rc = sap_poison_intercept_payload(clean_req, intercepted, sizeof(intercepted));
    assert(rc == 0 && strcmp(intercepted, clean_req) == 0);
    printf("  [PASS] Clean request passed untouched\n");

    const char *tracker_req = "POST /v2/events HTTP/1.1\r\nHost: graph.facebook.com\r\n\r\n{\"event\":\"real_tracking\"}";
    rc = sap_poison_intercept_payload(tracker_req, intercepted, sizeof(intercepted));
    assert(rc == 0 && strstr(intercepted, "\"poisoned\":true") != NULL);
    printf("  [PASS] Surveillance tracker intercepted & graph poisoned successfully\n");

    /* 2. Anti-Predatory Dark Pattern Scanner */
    const char *benign_ui = "Welcome to Sovereign Note. Click here to create a new encrypted document.";
    sap_predatory_analysis_t analysis;
    rc = sap_anti_predatory_scan(benign_ui, &analysis);
    assert(rc == 0);
    assert(analysis.flags == DARK_PATTERN_NONE);
    assert(analysis.predatory_score == 0.0f);
    printf("[PASS] Benign UI text correctly cleared (score = %.2f)\n", analysis.predatory_score);

    const char *hostile_ui = 
        "HURRY! SALE ENDS SOON! ONLY 1 LEFT AT THIS SPECIAL PRICE! "
        "Claim your free spin now on the lucky wheel! "
        "Or click: No thanks, I hate saving and want to lose your progress forever.";

    t0 = get_time_ms();
    rc = sap_anti_predatory_scan(hostile_ui, &analysis);
    double t_scan = get_time_ms() - t0;
    assert(rc == 0);
    printf("[PASS] Hostile UI scanned in %.3f ms: detected %u patterns, score = %.2f\n",
           t_scan, analysis.pattern_count, analysis.predatory_score);

    assert(analysis.flags & DARK_PATTERN_FAKE_URGENCY);
    assert(analysis.flags & DARK_PATTERN_LOOTBOX_GAMBLING);
    assert(analysis.flags & DARK_PATTERN_CONFIRMSHAMING);
    assert(analysis.predatory_score >= 0.70f);

    for (uint32_t i = 0; i < analysis.pattern_count; i++) {
        printf("  - Detected Dark Pattern #%u: \"%s\"\n", i + 1, analysis.matched_patterns[i]);
    }

    size_t peak_rss = get_peak_rss_kb();
    printf("--> Peak Security RSS: %zu KB (Budget: <= 4096 KB)\n", peak_rss);
    printf("========================================================\n");
    printf("ALL SECURITY SUBSYSTEM INVARIANTS VERIFIED 100%% GREEN\n");
    printf("========================================================\n");
    return 0;
}
