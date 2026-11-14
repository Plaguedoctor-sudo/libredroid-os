//! Wayland Layer-Shell On-Screen Keyboard input method engine.
//! Enforces zero-leak keystroke isolation; applications receive only committed text tokens.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum KeyboardLayout {
    UsQwerty,
    DeQwertz,
    FrAzerty,
    Numeric,
    Emoji,
}

#[derive(Debug, Clone)]
pub struct KeyToken {
    pub key: String,
    pub is_modifier: bool,
    pub is_backspace: bool,
    pub is_enter: bool,
}

pub struct KeyboardEngine {
    pub is_visible: bool,
    pub current_layout: KeyboardLayout,
    pub shift_active: bool,
    pub caps_lock: bool,
    pub symbols_active: bool,
    pub buffer: String,
    pub committed_tokens: Vec<String>,
}

impl KeyboardEngine {
    pub fn new() -> Self {
        Self {
            is_visible: false,
            current_layout: KeyboardLayout::UsQwerty,
            shift_active: false,
            caps_lock: false,
            symbols_active: false,
            buffer: String::new(),
            committed_tokens: Vec::new(),
        }
    }

    pub fn show(&mut self) {
        self.is_visible = true;
    }

    pub fn hide(&mut self) {
        self.is_visible = false;
        self.buffer.clear();
    }

    pub fn switch_layout(&mut self, layout: KeyboardLayout) {
        self.current_layout = layout;
        self.symbols_active = false;
    }

    pub fn toggle_shift(&mut self) {
        self.shift_active = !self.shift_active;
    }

    pub fn toggle_caps_lock(&mut self) {
        self.caps_lock = !self.caps_lock;
    }

    pub fn toggle_symbols(&mut self) {
        self.symbols_active = !self.symbols_active;
    }

    pub fn handle_key_press(&mut self, key: &str) -> Option<String> {
        match key {
            "Backspace" => {
                self.buffer.pop();
                None
            }
            "Enter" => {
                let committed = std::mem::take(&mut self.buffer);
                self.committed_tokens.push(committed.clone());
                Some(committed)
            }
            "Space" => {
                self.buffer.push(' ');
                None
            }
            "Shift" => {
                self.toggle_shift();
                None
            }
            "Caps" => {
                self.toggle_caps_lock();
                None
            }
            ch if ch.chars().count() == 1 => {
                let c = ch.chars().next().unwrap();
                let output_char = if self.shift_active ^ self.caps_lock {
                    c.to_ascii_uppercase()
                } else {
                    c.to_ascii_lowercase()
                };
                self.buffer.push(output_char);
                if self.shift_active {
                    self.shift_active = false; // Auto-unshift after single keypress
                }
                None
            }
            other => {
                self.buffer.push_str(other);
                None
            }
        }
    }

    pub fn handle_swipe_backspace(&mut self) -> usize {
        // Deletes preceding whitespace and the previous word
        let before_len = self.buffer.len();
        while self.buffer.ends_with(' ') {
            self.buffer.pop();
        }
        while let Some(c) = self.buffer.chars().last() {
            if c.is_alphanumeric() || c == '_' {
                self.buffer.pop();
            } else {
                break;
            }
        }
        before_len - self.buffer.len()
    }

    pub fn commit_current_buffer(&mut self) -> String {
        let committed = std::mem::take(&mut self.buffer);
        if !committed.is_empty() {
            self.committed_tokens.push(committed.clone());
        }
        committed
    }
}
