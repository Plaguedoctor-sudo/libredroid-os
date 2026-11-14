use crate::grammar::SovereignCommand;

pub struct IntentCompiler;

impl IntentCompiler {
    pub fn compile(natural_input: &str) -> SovereignCommand {
        let input_lower = natural_input.to_lowercase();
        if input_lower.contains("mute mic") || input_lower.contains("mute microphone") {
            SovereignCommand::MuteMicrophone(true)
        } else if input_lower.contains("unmute mic") {
            SovereignCommand::MuteMicrophone(false)
        } else if input_lower.contains("airplane mode on") {
            SovereignCommand::ToggleAirplaneMode(true)
        } else if input_lower.contains("airplane mode off") {
            SovereignCommand::ToggleAirplaneMode(false)
        } else if input_lower.starts_with("launch ") {
            let app = natural_input[7..].trim().to_string();
            SovereignCommand::LaunchApp(app)
        } else if input_lower.starts_with("freeze ") {
            let app = natural_input[7..].trim().to_string();
            SovereignCommand::FreezeApp(app)
        } else {
            SovereignCommand::Unknown(natural_input.to_string())
        }
    }
}
