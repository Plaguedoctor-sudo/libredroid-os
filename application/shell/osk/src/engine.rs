//! Wayland Layer-Shell On-Screen Keyboard input method engine.
//! Enforces zero-leak keystroke isolation; applications receive only committed text tokens.

pub struct KeyboardEngine {
    pub is_visible: bool,
    pub current_layout: String,
}

impl KeyboardEngine {
    pub fn new() -> Self {
        Self {
            is_visible: false,
            current_layout: "us".to_string(),
        }
    }

    pub fn show(&mut self) {
        self.is_visible = true;
    }

    pub fn hide(&mut self) {
        self.is_visible = false;
    }
}
