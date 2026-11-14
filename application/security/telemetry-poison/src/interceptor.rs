//! Outbound network packet interceptor matching known surveillance endpoints.

pub struct TelemetryInterceptor;

impl TelemetryInterceptor {
    pub const SURVEILLANCE_DOMAINS: &'static [&'static str] = &[
        "google-analytics.com",
        "app-measurement.com",
        "graph.facebook.com",
        "api.amplitude.com",
        "app.adjust.com",
        "inappcheck.itunes.apple.com",
    ];

    pub fn is_tracking_beacon(host: &str) -> bool {
        Self::SURVEILLANCE_DOMAINS
            .iter()
            .any(|d| host.ends_with(d))
    }
}
