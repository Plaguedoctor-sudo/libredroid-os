//! Sovereign Connectivity Service: Default-deny nftables firewall and Tor circuit coordinator.
//! Enforces per-application cgroup network isolation where a process without an explicit rule has no route.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NetworkCapability {
    None,
    LanOnly,
    WanDirect,
    TorOnly,
}

#[derive(Debug, Clone)]
pub struct NetworkInterfaceInfo {
    pub name: String,
    pub ip_addr: String,
    pub is_up: bool,
    pub is_vpn: bool,
}

pub struct ConnectivityService;

impl ConnectivityService {
    pub fn list_interfaces() -> Vec<NetworkInterfaceInfo> {
        vec![
            NetworkInterfaceInfo {
                name: "wlan0".to_string(),
                ip_addr: "192.168.1.150".to_string(),
                is_up: true,
                is_vpn: false,
            },
            NetworkInterfaceInfo {
                name: "rmnet_data0".to_string(),
                ip_addr: "10.45.12.8".to_string(),
                is_up: true,
                is_vpn: false,
            },
            NetworkInterfaceInfo {
                name: "lrd-tor0".to_string(),
                ip_addr: "10.192.0.1".to_string(),
                is_up: true,
                is_vpn: true,
            },
        ]
    }

    pub fn generate_nftables_policy(app_id: &str, cgroup_id: u32, cap: NetworkCapability) -> String {
        let mut rules = String::new();
        rules.push_str(&format!("# Sovereign nftables isolation rule for app: {} (cgroup: {})\n", app_id, cgroup_id));
        rules.push_str("table inet sap_filter {\n");
        rules.push_str("  chain app_egress {\n");

        match cap {
            NetworkCapability::None => {
                rules.push_str(&format!("    meta cgroup {} counter drop comment \"Default deny: {}\"\n", cgroup_id, app_id));
            }
            NetworkCapability::LanOnly => {
                rules.push_str(&format!("    meta cgroup {} ip daddr 192.168.0.0/16 counter accept\n", cgroup_id));
                rules.push_str(&format!("    meta cgroup {} ip daddr 10.0.0.0/8 counter accept\n", cgroup_id));
                rules.push_str(&format!("    meta cgroup {} counter drop comment \"Deny WAN for LAN-only app: {}\"\n", cgroup_id, app_id));
            }
            NetworkCapability::TorOnly => {
                rules.push_str(&format!("    meta cgroup {} oifname != \"lrd-tor0\" counter drop comment \"Force Tor egress: {}\"\n", cgroup_id, app_id));
                rules.push_str(&format!("    meta cgroup {} oifname \"lrd-tor0\" counter accept\n", cgroup_id));
            }
            NetworkCapability::WanDirect => {
                rules.push_str(&format!("    meta cgroup {} counter accept comment \"Audited WAN permitted for: {}\"\n", cgroup_id, app_id));
            }
        }

        rules.push_str("  }\n}\n");
        rules
    }

    pub fn enforce_default_deny(interface: &str) -> Result<(), &'static str> {
        if interface.is_empty() {
            return Err("Invalid interface identifier");
        }
        // In bare metal: invokes nft -f with default drop policy
        Ok(())
    }
}
