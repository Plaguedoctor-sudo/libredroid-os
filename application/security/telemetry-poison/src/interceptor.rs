//! Outbound network packet interceptor matching known surveillance endpoints.
//! Intercepts tracking beacons and routes them to the synthetic poisoning engine.

pub struct TelemetryInterceptor;

impl TelemetryInterceptor {
    pub const SURVEILLANCE_DOMAINS: &'static [&'static str] = &[
        "google-analytics.com",
        "app-measurement.com",
        "graph.facebook.com",
        "api.amplitude.com",
        "app.adjust.com",
        "inappcheck.itunes.apple.com",
        "api2.branch.io",
        "t.appsflyer.com",
        "telemetry.dropbox.com",
        "crashlytics.com",
        "criteo.com",
        "events.data.microsoft.com",
    ];

    pub fn is_tracking_beacon(host: &str) -> bool {
        let clean_host = host.to_lowercase();
        Self::SURVEILLANCE_DOMAINS
            .iter()
            .any(|d| clean_host == *d || clean_host.ends_with(&format!(".{}", d)))
    }

    pub fn sanitize_or_poison_url(url: &str) -> Option<String> {
        let clean = url.to_lowercase();
        if Self::is_tracking_beacon(&clean) {
            Some("/tmp/sap_poison_sink".to_string())
        } else {
            None
        }
    }
}
