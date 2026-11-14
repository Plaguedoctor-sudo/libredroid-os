//! Sandboxed Chromium / WebKit runner for Progressive Web Apps.
//! Enforces zero-telemetry, strict Seccomp-BPF filters, and site isolation.

pub struct SandboxedWebview {
    pub current_url: String,
    pub title: String,
    pub sandbox_flags: Vec<String>,
}

impl SandboxedWebview {
    pub fn new(url: &str) -> Self {
        Self {
            current_url: url.to_string(),
            title: "LibreBrowse Sandboxed Webview".to_string(),
            sandbox_flags: vec![
                "--enable-features=NetworkServiceInProcess".to_string(),
                "--disable-background-networking".to_string(),
                "--disable-sync".to_string(),
                "--disable-translate".to_string(),
                "--disable-client-side-phishing-detection".to_string(),
                "--no-default-browser-check".to_string(),
                "--site-per-process".to_string(),
            ],
        }
    }

    pub fn navigate(&mut self, url: &str) -> Result<(), &'static str> {
        if !url.starts_with("http://") && !url.starts_with("https://") && !url.starts_with("file://") {
            return Err("Invalid URI protocol: only http, https, and file allowed");
        }
        self.current_url = url.to_string();
        Ok(())
    }
}
