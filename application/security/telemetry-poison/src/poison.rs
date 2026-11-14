//! High-entropy synthetic data generator for poisoning surveillance graphs.

pub struct SyntheticTelemetryGenerator;

impl SyntheticTelemetryGenerator {
    pub fn generate_poisoned_payload() -> String {
        r#"{"event":"app_open","ad_id":"00000000-0000-0000-0000-000000000000","device_model":"SovereignDevice-X","entropy":"a8f3b2c1d4e5"}"#.to_string()
    }
}
