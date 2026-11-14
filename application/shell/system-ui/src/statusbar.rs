//! Status bar indicators: battery percentage, cellular signal, Tor status, domain badge.

pub struct StatusBarModel {
    pub battery_pct: u8,
    pub is_charging: bool,
    pub cellular_signal_bars: u8,
    pub is_tor_active: bool,
    pub active_domain_color: String,
}

impl Default for StatusBarModel {
    fn default() -> Self {
        Self {
            battery_pct: 100,
            is_charging: false,
            cellular_signal_bars: 4,
            is_tor_active: true,
            active_domain_color: "#10b981".to_string(), // Green Whonix/Sovereign Tor
        }
    }
}
