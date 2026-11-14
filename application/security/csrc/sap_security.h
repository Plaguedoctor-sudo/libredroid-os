#ifndef SAP_SECURITY_H
#define SAP_SECURITY_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

/* --- Telemetry Poisoning Engine --- */
typedef struct {
    char event_type[32];        // e.g., "app_launch", "ad_view", "geo_ping"
    char synthetic_gaid[37];    // Dynamic UUIDv4 / GAID
    char synthetic_idfa[37];
    char spoofed_device[32];    // Rotating device model
    char high_entropy_seed[33]; // High-entropy 128-bit hex string
    double fake_lat;            // Randomized plausible coordinate
    double fake_lon;
    uint64_t timestamp_ms;
} sap_poison_telemetry_t;

// Initialize telemetry poisoner with system entropy
int sap_poison_init(void);

// Generate high-entropy, realistic poisoned surveillance payload (JSON)
int sap_poison_generate_json(char *out_buf, size_t max_len, size_t *out_len);

// Intercept outgoing HTTP/socket tracking request and replace with poisoned payload
int sap_poison_intercept_payload(const char *raw_request, char *out_poisoned, size_t max_len);

/* --- Anti-Predatory Dark Pattern Detector --- */
typedef enum {
    DARK_PATTERN_NONE               = 0,
    DARK_PATTERN_FAKE_URGENCY       = 1 << 0, // "only 1 left", "timer expires in", "hurry"
    DARK_PATTERN_LOOTBOX_GAMBLING   = 1 << 1, // "free spin", "mystery chest", "lucky draw"
    DARK_PATTERN_CONFIRMSHAMING     = 1 << 2, // "no thanks, I hate saving", "lose progress forever"
    DARK_PATTERN_HIDDEN_SUBSCRIPTION= 1 << 3, // "auto-renews annually", "billed $X/week"
    DARK_PATTERN_DISGUISED_AD       = 1 << 4, // "sponsored download", "claim your prize"
    DARK_PATTERN_FORCED_CONTINUITY  = 1 << 5, // "cannot delete account", "subscription locked"
} sap_dark_pattern_flags_t;

typedef struct {
    uint32_t flags;               // Bitmask of detected categories
    uint32_t pattern_count;       // Total matches found
    float predatory_score;        // Heuristic score [0.0 - 1.0]
    char matched_patterns[8][64]; // Extracted offending snippets
} sap_predatory_analysis_t;

// Scan text / DOM / rendered UI for predatory dark patterns
int sap_anti_predatory_scan(const char *ui_text, sap_predatory_analysis_t *out_analysis);

#endif // SAP_SECURITY_H
