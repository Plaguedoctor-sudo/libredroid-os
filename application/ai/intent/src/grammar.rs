//! Zero-cloud deterministic intent grammar for system control.

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum SovereignCommand {
    AdjustBrightness(u8),
    SetVolume(u8),
    ToggleAirplaneMode(bool),
    ToggleWifi(bool),
    ToggleBluetooth(bool),
    ToggleTor(bool),
    FreezeApp(String),
    LaunchApp(String),
    MuteMicrophone(bool),
    DialNumber(String),
    SendSms { recipient: String, message: String },
    EmergencyPanicLock,
    GetSystemStatus,
    Unknown(String),
}
