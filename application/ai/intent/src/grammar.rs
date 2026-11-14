//! Zero-cloud deterministic intent grammar for system control.

#[derive(Debug, PartialEq, Eq)]
pub enum SovereignCommand {
    AdjustBrightness(u8),
    SetVolume(u8),
    ToggleAirplaneMode(bool),
    FreezeApp(String),
    LaunchApp(String),
    MuteMicrophone(bool),
    Unknown(String),
}
