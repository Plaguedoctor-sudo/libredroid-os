#define _GNU_SOURCE
#include "sap_security.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

typedef struct {
    const char *pattern;
    uint32_t flag;
    float weight;
} dark_pattern_rule_t;

static const dark_pattern_rule_t s_rules[] = {
    /* Fake Urgency & Scarcity */
    {"offer expires in",             DARK_PATTERN_FAKE_URGENCY, 0.25f},
    {"only 1 left",                  DARK_PATTERN_FAKE_URGENCY, 0.30f},
    {"only 2 left",                  DARK_PATTERN_FAKE_URGENCY, 0.25f},
    {"limited time only",            DARK_PATTERN_FAKE_URGENCY, 0.15f},
    {"hurry! sale ends",             DARK_PATTERN_FAKE_URGENCY, 0.25f},
    {"countdown",                    DARK_PATTERN_FAKE_URGENCY, 0.10f},

    /* Lootbox & Gambling Patterns */
    {"claim your free spin",         DARK_PATTERN_LOOTBOX_GAMBLING, 0.35f},
    {"mystery box",                  DARK_PATTERN_LOOTBOX_GAMBLING, 0.30f},
    {"lucky wheel",                  DARK_PATTERN_LOOTBOX_GAMBLING, 0.30f},
    {"unlock crate",                 DARK_PATTERN_LOOTBOX_GAMBLING, 0.30f},
    {"variable reward",              DARK_PATTERN_LOOTBOX_GAMBLING, 0.25f},

    /* Confirmshaming */
    {"no thanks, i hate saving",     DARK_PATTERN_CONFIRMSHAMING, 0.40f},
    {"lose your progress forever",   DARK_PATTERN_CONFIRMSHAMING, 0.45f},
    {"give up your discount",        DARK_PATTERN_CONFIRMSHAMING, 0.35f},
    {"i don't want free gifts",      DARK_PATTERN_CONFIRMSHAMING, 0.40f},

    /* Hidden Subscriptions & Billing */
    {"auto-renews annually",         DARK_PATTERN_HIDDEN_SUBSCRIPTION, 0.35f},
    {"billed weekly at",             DARK_PATTERN_HIDDEN_SUBSCRIPTION, 0.40f},
    {"converts to paid subscription",DARK_PATTERN_HIDDEN_SUBSCRIPTION, 0.30f},
    {"hidden recurring fee",         DARK_PATTERN_HIDDEN_SUBSCRIPTION, 0.45f},

    /* Disguised Ads */
    {"system virus detected",        DARK_PATTERN_DISGUISED_AD, 0.50f},
    {"you won an iphone",            DARK_PATTERN_DISGUISED_AD, 0.50f},
    {"fake update ready",            DARK_PATTERN_DISGUISED_AD, 0.40f},

    /* Forced Continuity / Roach Motel */
    {"call support to cancel",       DARK_PATTERN_FORCED_CONTINUITY, 0.50f},
    {"cannot delete account online", DARK_PATTERN_FORCED_CONTINUITY, 0.45f},
    {"cancellation penalty",         DARK_PATTERN_FORCED_CONTINUITY, 0.40f}
};

static void str_to_lower(const char *src, char *dst, size_t max_len) {
    size_t i = 0;
    while (src[i] && i < max_len - 1) {
        dst[i] = (char)tolower((unsigned char)src[i]);
        i++;
    }
    dst[i] = '\0';
}

int sap_anti_predatory_scan(const char *ui_text, sap_predatory_analysis_t *out_analysis) {
    if (!ui_text || !out_analysis) return -1;

    memset(out_analysis, 0, sizeof(sap_predatory_analysis_t));

    size_t text_len = strlen(ui_text);
    char *lower_buf = malloc(text_len + 1);
    if (!lower_buf) return -1;
    str_to_lower(ui_text, lower_buf, text_len + 1);

    size_t num_rules = sizeof(s_rules) / sizeof(s_rules[0]);
    float accumulated_score = 0.0f;

    for (size_t i = 0; i < num_rules; i++) {
        if (strstr(lower_buf, s_rules[i].pattern) != NULL) {
            out_analysis->flags |= s_rules[i].flag;
            accumulated_score += s_rules[i].weight;

            if (out_analysis->pattern_count < 8) {
                strncpy(out_analysis->matched_patterns[out_analysis->pattern_count],
                        s_rules[i].pattern, 63);
                out_analysis->matched_patterns[out_analysis->pattern_count][63] = '\0';
                out_analysis->pattern_count++;
            }
        }
    }

    /* Clamp score [0.0 - 1.0] */
    if (accumulated_score > 1.0f) accumulated_score = 1.0f;
    out_analysis->predatory_score = accumulated_score;

    free(lower_buf);
    return 0;
}
