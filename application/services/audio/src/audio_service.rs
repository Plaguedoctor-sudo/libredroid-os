//! Sovereign Audio Service: Hardware audio routing and stream isolation via PipeWire / ALSA UCM2.

pub struct AudioService {
    pub is_hardware_muted: bool,
    pub active_route: String,
}

impl AudioService {
    pub fn new() -> Self {
        Self {
            is_hardware_muted: false,
            active_route: "speaker".to_string(),
        }
    }

    pub fn set_privacy_mute(&mut self, muted: bool) {
        self.is_hardware_muted = muted;
    }
}
