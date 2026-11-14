//! Sandboxed Chromium / WebKit runner for Progressive Web Apps.

pub struct SandboxedWebview {
    pub current_url: String,
}

impl SandboxedWebview {
    pub fn new(url: &str) -> Self {
        Self {
            current_url: url.to_string(),
        }
    }
}
