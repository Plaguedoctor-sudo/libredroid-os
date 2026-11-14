use crate::grammar::SovereignCommand;

pub struct IntentCompiler;

impl IntentCompiler {
    pub fn compile(natural_input: &str) -> SovereignCommand {
        let input_lower = natural_input.to_lowercase();
        let trimmed = natural_input.trim();

        // 1. Microphone controls
        if input_lower.contains("mute mic") || input_lower.contains("mute microphone") {
            return SovereignCommand::MuteMicrophone(true);
        }
        if input_lower.contains("unmute mic") || input_lower.contains("unmute microphone") {
            return SovereignCommand::MuteMicrophone(false);
        }

        // 2. Airplane mode
        if input_lower.contains("airplane mode on") || input_lower.contains("enable airplane mode") {
            return SovereignCommand::ToggleAirplaneMode(true);
        }
        if input_lower.contains("airplane mode off") || input_lower.contains("disable airplane mode") {
            return SovereignCommand::ToggleAirplaneMode(false);
        }

        // 3. Wi-Fi controls
        if input_lower.contains("turn on wifi") || input_lower.contains("enable wifi") {
            return SovereignCommand::ToggleWifi(true);
        }
        if input_lower.contains("turn off wifi") || input_lower.contains("disable wifi") {
            return SovereignCommand::ToggleWifi(false);
        }

        // 4. Bluetooth controls
        if input_lower.contains("turn on bluetooth") || input_lower.contains("enable bluetooth") {
            return SovereignCommand::ToggleBluetooth(true);
        }
        if input_lower.contains("turn off bluetooth") || input_lower.contains("disable bluetooth") {
            return SovereignCommand::ToggleBluetooth(false);
        }

        // 5. Tor anonymity circuit
        if input_lower.contains("enable tor") || input_lower.contains("onion routing on") {
            return SovereignCommand::ToggleTor(true);
        }
        if input_lower.contains("disable tor") || input_lower.contains("onion routing off") {
            return SovereignCommand::ToggleTor(false);
        }

        // 6. Volume controls
        if input_lower.starts_with("set volume to ") || input_lower.starts_with("volume ") {
            let digits: String = input_lower.chars().filter(|c| c.is_ascii_digit()).collect();
            if let Ok(pct) = digits.parse::<u8>() {
                return SovereignCommand::SetVolume(pct.min(100));
            }
        }

        // 7. Brightness controls
        if input_lower.starts_with("set brightness to ") || input_lower.starts_with("brightness ") {
            let digits: String = input_lower.chars().filter(|c| c.is_ascii_digit()).collect();
            if let Ok(pct) = digits.parse::<u8>() {
                return SovereignCommand::AdjustBrightness(pct.min(100));
            }
        }

        // 8. Panic / Emergency Lock
        if input_lower.contains("panic lock") || input_lower.contains("emergency lock") || input_lower == "lock system" {
            return SovereignCommand::EmergencyPanicLock;
        }

        // 9. System status
        if input_lower.contains("system status") || input_lower.contains("device health") || input_lower == "status" {
            return SovereignCommand::GetSystemStatus;
        }

        // 10. Call / Dial
        if input_lower.starts_with("call ") || input_lower.starts_with("dial ") {
            let num = trimmed[4..].trim().to_string();
            return SovereignCommand::DialNumber(num);
        }

        // 11. App lifecycle
        if input_lower.starts_with("launch ") || input_lower.starts_with("open ") {
            let app = trimmed.split_whitespace().skip(1).collect::<Vec<&str>>().join(" ");
            return SovereignCommand::LaunchApp(app);
        }
        if input_lower.starts_with("freeze ") || input_lower.starts_with("close ") {
            let app = trimmed.split_whitespace().skip(1).collect::<Vec<&str>>().join(" ");
            return SovereignCommand::FreezeApp(app);
        }

        SovereignCommand::Unknown(natural_input.to_string())
    }
}
