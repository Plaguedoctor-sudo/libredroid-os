//! Sovereign Anti-Predatory Engine: Dark pattern, fake countdown, confirmshaming,
//! hidden recurring subscriptions, disguised ads, and predatory loot-box detector.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DarkPatternCategory {
    FakeUrgency,
    LootboxGambling,
    Confirmshaming,
    HiddenSubscription,
    DisguisedAd,
    ForcedContinuity,
    TrickQuestions,
}

#[derive(Debug, Clone)]
pub struct DarkPatternMatch {
    pub pattern: &'static str,
    pub category: DarkPatternCategory,
    pub weight: f32,
    pub description: &'static str,
}

#[derive(Debug, Clone)]
pub struct ScanResult {
    pub matches: Vec<DarkPatternMatch>,
    pub hostility_score: f32,
    pub should_defuse: bool,
    pub defuse_actions: Vec<&'static str>,
}

pub struct DarkPatternDetector;

impl DarkPatternDetector {
    pub const RULES: &'static [(&'static str, DarkPatternCategory, f32, &'static str)] = &[
        // Fake Urgency & Scarcity
        ("offer expires in", DarkPatternCategory::FakeUrgency, 0.30, "Artificially induced FOMO urgency timer"),
        ("only 1 left", DarkPatternCategory::FakeUrgency, 0.35, "Simulated artificial inventory scarcity"),
        ("only 2 left", DarkPatternCategory::FakeUrgency, 0.30, "Simulated artificial inventory scarcity"),
        ("limited time only", DarkPatternCategory::FakeUrgency, 0.20, "Synthetic urgency countdown"),
        ("hurry! sale ends", DarkPatternCategory::FakeUrgency, 0.30, "Psychological pressure countdown"),
        ("price increases in", DarkPatternCategory::FakeUrgency, 0.35, "Price intimidation clock"),

        // Lootbox & In-App Gambling
        ("claim your free spin", DarkPatternCategory::LootboxGambling, 0.40, "Gambling mechanic hook"),
        ("mystery box", DarkPatternCategory::LootboxGambling, 0.35, "Variable ratio reward lootbox"),
        ("lucky wheel", DarkPatternCategory::LootboxGambling, 0.35, "Gambling casino mechanic"),
        ("unlock crate", DarkPatternCategory::LootboxGambling, 0.35, "Gacha loot crate trap"),
        ("variable reward", DarkPatternCategory::LootboxGambling, 0.30, "Dopamine-loop variable reinforcement"),

        // Confirmshaming & Guilt Tripping
        ("no thanks, i hate saving", DarkPatternCategory::Confirmshaming, 0.45, "Emotional manipulation / confirmshaming"),
        ("lose your progress forever", DarkPatternCategory::Confirmshaming, 0.50, "Coercive retention threat"),
        ("give up your discount", DarkPatternCategory::Confirmshaming, 0.40, "Guilt-inducing decline button"),
        ("i don't want free gifts", DarkPatternCategory::Confirmshaming, 0.40, "Confirmshaming opt-out text"),

        // Hidden Subscriptions & Trap Billing
        ("auto-renews annually", DarkPatternCategory::HiddenSubscription, 0.40, "Undisclosed recurring subscription"),
        ("billed weekly at", DarkPatternCategory::HiddenSubscription, 0.45, "High-frequency micro-subscription trap"),
        ("converts to paid subscription", DarkPatternCategory::HiddenSubscription, 0.35, "Automatic trial-to-paid conversion"),
        ("hidden recurring fee", DarkPatternCategory::HiddenSubscription, 0.50, "Undisclosed recurring charge"),

        // Disguised Advertisements
        ("system virus detected", DarkPatternCategory::DisguisedAd, 0.60, "Scareware rogue security prompt"),
        ("you won an iphone", DarkPatternCategory::DisguisedAd, 0.60, "Deceptive prize clickbait ad"),
        ("fake update ready", DarkPatternCategory::DisguisedAd, 0.50, "Trojan update banner disguised as OS notice"),

        // Forced Continuity (Roach Motel)
        ("call support to cancel", DarkPatternCategory::ForcedContinuity, 0.55, "Asymmetric cancellation barrier"),
        ("cannot delete account online", DarkPatternCategory::ForcedContinuity, 0.50, "Data hostage retention barrier"),
    ];

    pub fn scan_ui_text(rendered_text: &str) -> Vec<&'static str> {
        let text_lower = rendered_text.to_lowercase();
        Self::RULES
            .iter()
            .filter(|(pat, _, _, _)| text_lower.contains(pat))
            .map(|(pat, _, _, _)| *pat)
            .collect()
    }

    pub fn analyze(rendered_text: &str) -> ScanResult {
        let text_lower = rendered_text.to_lowercase();
        let mut matches = Vec::new();
        let mut total_weight = 0.0f32;

        for (pattern, category, weight, description) in Self::RULES {
            if text_lower.contains(pattern) {
                matches.push(DarkPatternMatch {
                    pattern,
                    category: *category,
                    weight: *weight,
                    description,
                });
                total_weight += weight;
            }
        }

        let hostility_score = (total_weight).min(1.0);
        let should_defuse = hostility_score >= 0.40;

        let mut defuse_actions = Vec::new();
        if should_defuse {
            defuse_actions.push("DEFUSE_COUNTDOWNS");
            defuse_actions.push("FREEZE_IN_APP_PURCHASE_API");
            defuse_actions.push("NEUTRALIZE_CONFIRMSHAMING_OVERLAY");
        }

        ScanResult {
            matches,
            hostility_score,
            should_defuse,
            defuse_actions,
        }
    }
}
