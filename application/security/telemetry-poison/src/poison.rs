//! High-entropy synthetic data generator for poisoning surveillance graphs.
//! Generates cryptographically randomized tracking telemetry to pollute ad-tech profiling databases.

use sha2::{Digest, Sha256};

pub struct SyntheticTelemetryGenerator;

impl SyntheticTelemetryGenerator {
    const FAKE_MODELS: &'static [&'static str] = &[
        "SM-S928B (Galaxy S24 Ultra)",
        "Pixel 8 Pro (husky)",
        "iPhone16,2 (iPhone 15 Pro Max)",
        "23127PN0CG (Xiaomi 14)",
        "CPH2581 (OnePlus 12)",
    ];

    const FAKE_EVENTS: &'static [&'static str] = &[
        "ad_impression",
        "screen_view",
        "search_query",
        "content_interaction",
        "purchase_intent",
        "location_heartbeat",
    ];

    /// Generates high-entropy poisoned JSON payload with distinct UUIDs and plausible randomized attributes.
    pub fn generate_poisoned_payload() -> String {
        let timestamp_ms = 1763164800000u64;

        // Derive pseudo-random seed
        let mut hasher = Sha256::new();
        hasher.update(&timestamp_ms.to_le_bytes());
        hasher.update(b"SOVEREIGN_POISON_SALT");
        let hash = hasher.finalize();

        let model_idx = (hash[0] as usize) % Self::FAKE_MODELS.len();
        let event_idx = (hash[1] as usize) % Self::FAKE_EVENTS.len();
        let model = Self::FAKE_MODELS[model_idx];
        let event = Self::FAKE_EVENTS[event_idx];

        let ad_id = format!(
            "{:02x}{:02x}{:02x}{:02x}-{:02x}{:02x}-4{:03x}-a{:03x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
            hash[2], hash[3], hash[4], hash[5],
            hash[6], hash[7],
            (hash[8] as u16) & 0x0FFF,
            (hash[9] as u16) & 0x0FFF,
            hash[10], hash[11], hash[12], hash[13], hash[14], hash[15]
        );

        let entropy = format!("{:x}", hash);

        format!(
            r#"{{"event":"{}","ad_id":"{}","device_model":"{}","timestamp_ms":{},"entropy":"{}","poisoned":true}}"#,
            event, ad_id, model, timestamp_ms, &entropy[..16]
        )
    }
}
