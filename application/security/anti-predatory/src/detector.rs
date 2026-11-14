//! Dark pattern, fake countdown, and loot-box detector.

pub struct DarkPatternDetector;

impl DarkPatternDetector {
    pub const SUSPICIOUS_STRINGS: &'static [&'static str] = &[
        "offer expires in",
        "only 1 left at this price",
        "claim your free spin",
        "auto-renews annually at $99.99",
        "you will lose your progress forever",
    ];

    pub fn scan_ui_text(rendered_text: &str) -> Vec<&'static str> {
        let text_lower = rendered_text.to_lowercase();
        Self::SUSPICIOUS_STRINGS
            .iter()
            .copied()
            .filter(|pat| text_lower.contains(pat))
            .collect()
    }
}
