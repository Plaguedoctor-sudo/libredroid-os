//! Hardware quick toggles: Wi-Fi, Tor, Airplane mode, Camera privacy shutter, Mic mute.

pub struct QuickSettingsState {
    pub airplane_mode: bool,
    pub tor_circuit: bool,
    pub camera_privacy_kill: bool,
    pub mic_privacy_kill: bool,
}

impl Default for QuickSettingsState {
    fn default() -> Self {
        Self {
            airplane_mode: false,
            tor_circuit: true,
            camera_privacy_kill: false,
            mic_privacy_kill: false,
        }
    }
}
