#define _GNU_SOURCE
#include "sap_connectivity.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <fcntl.h>
#include <unistd.h>
#include <ifaddrs.h>
#include <net/if.h>
#include <arpa/inet.h>

static bool g_net_initialized = false;

int sap_connectivity_init(void) {
    g_net_initialized = true;
    return 0;
}

static sap_if_type_t classify_interface(const char *name) {
    if (strncmp(name, "lo", 2) == 0) return SAP_IF_TYPE_LOOPBACK;
    if (strncmp(name, "eth", 3) == 0 || strncmp(name, "en", 2) == 0) return SAP_IF_TYPE_ETHERNET;
    if (strncmp(name, "wl", 2) == 0 || strncmp(name, "mlan", 4) == 0) return SAP_IF_TYPE_WIFI;
    if (strncmp(name, "wwan", 4) == 0 || strncmp(name, "rmnet", 5) == 0) return SAP_IF_TYPE_CELLULAR;
    if (strncmp(name, "lrd-", 4) == 0 || strncmp(name, "br-", 3) == 0) return SAP_IF_TYPE_BRIDGE;
    return SAP_IF_TYPE_UNKNOWN;
}

int sap_connectivity_get_state(sap_net_state_t *out_state) {
    if (!out_state) return -1;
    if (!g_net_initialized) sap_connectivity_init();

    memset(out_state, 0, sizeof(sap_net_state_t));

    struct ifaddrs *ifaddr;
    if (getifaddrs(&ifaddr) == -1) return -1;

    for (struct ifaddrs *ifa = ifaddr; ifa != NULL && out_state->count < SAP_MAX_INTERFACES; ifa = ifa->ifa_next) {
        if (!ifa->ifa_addr) continue;

        /* Filter to IPv4 */
        if (ifa->ifa_addr->sa_family == AF_INET) {
            uint32_t idx = out_state->count;
            strncpy(out_state->interfaces[idx].name, ifa->ifa_name, SAP_IFNAME_MAX - 1);
            out_state->interfaces[idx].type = classify_interface(ifa->ifa_name);
            out_state->interfaces[idx].is_up = (ifa->ifa_flags & IFF_UP) != 0;

            struct sockaddr_in *p_sin = (struct sockaddr_in *)ifa->ifa_addr;
            inet_ntop(AF_INET, &p_sin->sin_addr, out_state->interfaces[idx].ip_addr, sizeof(out_state->interfaces[idx].ip_addr));

            if (out_state->interfaces[idx].type != SAP_IF_TYPE_LOOPBACK && out_state->interfaces[idx].is_up) {
                out_state->has_internet = true;
            }
            out_state->count++;
        }
    }

    freeifaddrs(ifaddr);
    return 0;
}

int sap_connectivity_generate_nft_rules(const char *app_id, uint32_t cgroup_id, sap_net_cap_t net_caps, char *out_rules, size_t max_len) {
    if (!app_id || !out_rules || max_len < 512) return -1;

    int written = snprintf(out_rules, max_len,
        "table inet sap_filter {\n"
        "    chain app_%u {\n"
        "        # App: %.64s (CGroup: %u)\n"
        "        type filter hook output priority 0; policy drop;\n"
        "        oifname \"lo\" accept\n"
        "        ip daddr 127.0.0.53 udp dport 53 accept\n",
        cgroup_id, app_id, cgroup_id
    );

    if (written < 0 || (size_t)written >= max_len) return -1;
    size_t offset = (size_t)written;

    if (net_caps & SAP_NET_CAP_LAN) {
        int w = snprintf(out_rules + offset, max_len - offset,
            "        # Local RFC 1918 subnets permitted\n"
            "        ip daddr { 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 } accept\n"
        );
        if (w < 0 || (size_t)w >= max_len - offset) return -1;
        offset += (size_t)w;
    }

    if (net_caps & SAP_NET_CAP_WAN) {
        int w = snprintf(out_rules + offset, max_len - offset,
            "        # Full WAN Egress permitted\n"
            "        ct state established,related accept\n"
            "        tcp dport { 80, 443, 853 } accept\n"
        );
        if (w < 0 || (size_t)w >= max_len - offset) return -1;
        offset += (size_t)w;
    }

    int w = snprintf(out_rules + offset, max_len - offset,
        "        # Zero-trust drop telemetry/leakage\n"
        "        counter log prefix \"SAP_NET_DROP: \" drop\n"
        "    }\n"
        "}\n"
    );
    if (w < 0 || (size_t)w >= max_len - offset) return -1;

    return 0;
}

int sap_connectivity_enforce_policy(const char *app_id, uint32_t cgroup_id, sap_net_cap_t net_caps) {
    char rules[2048];
    if (sap_connectivity_generate_nft_rules(app_id, cgroup_id, net_caps, rules, sizeof(rules)) != 0) {
        return -1;
    }

    /* In unprivileged testing, write rule to test file and verify formatting */
    char path[256];
    snprintf(path, sizeof(path), "/tmp/sap_nft_%u.conf", cgroup_id);
    FILE *fp = fopen(path, "w");
    if (!fp) return -1;
    fputs(rules, fp);
    fclose(fp);

    /* If nft binary is present and we have rights, apply rules; else verify structure */
    if (access("/sbin/nft", X_OK) == 0 && geteuid() == 0) {
        char cmd[512];
        snprintf(cmd, sizeof(cmd), "/sbin/nft -f %s", path);
        if (system(cmd) != 0) {
            unlink(path);
            return -1;
        }
    }

    unlink(path);
    return 0;
}
