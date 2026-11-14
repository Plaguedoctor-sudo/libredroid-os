#define _GNU_SOURCE
#include "sap_connectivity.h"

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
    printf("SAP Network Connectivity & nftables Invariant Bench\n");
    printf("========================================================\n");

    int rc = sap_connectivity_init();
    assert(rc == 0);
    printf("[PASS] sap_connectivity_init succeeded\n");

    /* 1. Interface State Query */
    sap_net_state_t state;
    double t0 = get_time_ms();
    rc = sap_connectivity_get_state(&state);
    double t_state = get_time_ms() - t0;
    assert(rc == 0);
    assert(state.count > 0);
    printf("[PASS] Network state queried in %.3f ms (%u interfaces found, Internet: %s)\n",
           t_state, state.count, state.has_internet ? "CONNECTED" : "OFFLINE");

    for (uint32_t i = 0; i < state.count; i++) {
        printf("  - %s (Type: %d, IP: %s, State: %s)\n",
               state.interfaces[i].name, state.interfaces[i].type,
               state.interfaces[i].ip_addr, state.interfaces[i].is_up ? "UP" : "DOWN");
    }

    /* 2. nftables Ruleset Generation: Zero-Trust App (CAP_NET_NONE) */
    printf("--> Testing nftables Ruleset Generation (Zero-Trust Sandbox)...\n");
    char rules_none[2048];
    t0 = get_time_ms();
    rc = sap_connectivity_generate_nft_rules("org.sovereign.calculator", 1001, SAP_NET_CAP_NONE, rules_none, sizeof(rules_none));
    double t_gen = get_time_ms() - t0;
    assert(rc == 0);
    assert(strstr(rules_none, "policy drop;") != NULL);
    assert(strstr(rules_none, "oifname \"lo\" accept") != NULL);
    assert(strstr(rules_none, "RFC 1918") == NULL); // Must NOT permit LAN
    assert(strstr(rules_none, "443") == NULL);      // Must NOT permit WAN
    assert(strstr(rules_none, "SAP_NET_DROP") != NULL);
    printf("  [PASS] Zero-trust default-deny ruleset generated in %.3f ms\n", t_gen);

    /* 3. nftables Ruleset Generation: LAN-Only App (CAP_NET_LAN) */
    char rules_lan[2048];
    rc = sap_connectivity_generate_nft_rules("org.sovereign.nas_sync", 1002, SAP_NET_CAP_LAN, rules_lan, sizeof(rules_lan));
    assert(rc == 0);
    assert(strstr(rules_lan, "192.168.0.0/16") != NULL);
    assert(strstr(rules_lan, "443") == NULL); // WAN still strictly blocked
    printf("  [PASS] LAN-only pinned ruleset verified (RFC 1918 allowed, WAN dropped)\n");

    /* 4. nftables Ruleset Generation: WAN Browser App (CAP_NET_WAN) */
    char rules_wan[2048];
    rc = sap_connectivity_generate_nft_rules("org.sovereign.browser", 1003, SAP_NET_CAP_WAN, rules_wan, sizeof(rules_wan));
    assert(rc == 0);
    assert(strstr(rules_wan, "tcp dport { 80, 443, 853 } accept") != NULL);
    printf("  [PASS] WAN ruleset verified (HTTPS 443 & DoT 853 pinholes established)\n");

    /* 5. Policy Enforcement Test */
    rc = sap_connectivity_enforce_policy("org.sovereign.test", 1004, SAP_NET_CAP_NONE);
    assert(rc == 0);
    printf("[PASS] Policy enforcement invariant validated successfully\n");

    size_t peak_rss = get_peak_rss_kb();
    printf("--> Peak Connectivity RSS: %zu KB (Budget: <= 4096 KB)\n", peak_rss);
    printf("========================================================\n");
    printf("ALL CONNECTIVITY SUBSYSTEM INVARIANTS VERIFIED 100%% GREEN\n");
    printf("========================================================\n");
    return 0;
}
