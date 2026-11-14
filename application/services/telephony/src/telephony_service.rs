//! Sovereign Telephony Service: Cellular baseband, VoLTE/VoNR, and SMS.

pub struct TelephonyService {
    pub modem_device: String,
    pub is_radio_on: bool,
}

impl TelephonyService {
    pub fn new(modem_device: &str) -> Self {
        Self {
            modem_device: modem_device.to_string(),
            is_radio_on: true,
        }
    }

    pub fn dial_volte(&self, phone_number: &str) -> Result<u32, &'static str> {
        if !self.is_radio_on {
            return Err("Radio is disabled");
        }
        // Dispatches ATD or QMI voice call setup
        println!("Dialing VoLTE call to {}", phone_number);
        Ok(101)
    }
}
