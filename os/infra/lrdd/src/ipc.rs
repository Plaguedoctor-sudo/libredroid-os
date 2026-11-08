use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", content = "payload")]
pub enum RequestMessage {
    GetStatus,
    GetPowerInfo,
    PowerAction { action: String }, // "poweroff", "reboot", "suspend", "lock"
    ListDomains,
    StartDomain { domain: String },
    StopDomain { domain: String },
    SetDomainLimits { domain: String, memory_mb: Option<u64>, cpu_shares: Option<u64> },
    GetNetworkState,
    ScanWifi,
    SetTelemetryMode { mode: String }, // "active_poison", "honeytoken_dns", "block", "passthrough"
    GetDoctorReport,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", content = "payload")]
pub enum ResponseMessage {
    Status {
        version: String,
        backend: String,
        uptime_secs: u64,
        native_engine: bool,
        memory_usage_kb: u64,
    },
    PowerInfo {
        battery_percentage: u8,
        is_charging: bool,
        power_save_active: bool,
        temperature_c: f32,
    },
    DomainList {
        domains: Vec<DomainInfo>,
    },
    NetworkState {
        connected: bool,
        interface: String,
        ssid: Option<String>,
        ip_address: Option<String>,
        mac_randomized: bool,
    },
    Success { message: String },
    Error { code: u16, error: String },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DomainInfo {
    pub name: String,
    pub tier: String, // "tier1_container" or "tier2_microvm"
    pub state: String, // "running", "stopped", "isolated"
    pub memory_current_mb: u64,
    pub memory_max_mb: u64,
    pub wayland_socket: String,
}
