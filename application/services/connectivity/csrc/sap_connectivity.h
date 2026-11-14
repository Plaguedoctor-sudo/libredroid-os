#ifndef SAP_CONNECTIVITY_H
#define SAP_CONNECTIVITY_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#define SAP_IFNAME_MAX 32
#define SAP_MAX_INTERFACES 16

typedef enum {
    SAP_NET_CAP_NONE = 0,
    SAP_NET_CAP_LAN  = 1 << 0,
    SAP_NET_CAP_WAN  = 1 << 1,
} sap_net_cap_t;

typedef enum {
    SAP_IF_TYPE_UNKNOWN = 0,
    SAP_IF_TYPE_LOOPBACK,
    SAP_IF_TYPE_ETHERNET,
    SAP_IF_TYPE_WIFI,
    SAP_IF_TYPE_CELLULAR,
    SAP_IF_TYPE_BRIDGE,
} sap_if_type_t;

typedef struct {
    char name[SAP_IFNAME_MAX];
    sap_if_type_t type;
    bool is_up;
    char ip_addr[40];
    uint32_t mtu;
} sap_net_interface_t;

typedef struct {
    sap_net_interface_t interfaces[SAP_MAX_INTERFACES];
    uint32_t count;
    bool has_internet;
} sap_net_state_t;

// Initialize connectivity subsystem
int sap_connectivity_init(void);

// Scan Linux interfaces via /sys/class/net and getifaddrs
int sap_connectivity_get_state(sap_net_state_t *out_state);

// Generate nftables default-deny configuration for an application cgroup/netns
int sap_connectivity_generate_nft_rules(const char *app_id, uint32_t cgroup_id, sap_net_cap_t net_caps, char *out_rules, size_t max_len);

// Enforce ruleset via nft or verify rule syntax
int sap_connectivity_enforce_policy(const char *app_id, uint32_t cgroup_id, sap_net_cap_t net_caps);

#endif // SAP_CONNECTIVITY_H
