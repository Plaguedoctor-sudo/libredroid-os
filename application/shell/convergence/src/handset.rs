//! Handset layout: single-column, bottom navigation pill, swipe-from-edge gestures.

pub struct HandsetLayoutManager {
    pub screen_width: u32,
    pub screen_height: u32,
}

impl HandsetLayoutManager {
    pub fn new(width: u32, height: u32) -> Self {
        Self {
            screen_width: width,
            screen_height: height,
        }
    }

    pub fn compute_app_bounds(&self) -> (u32, u32, u32, u32) {
        // (x, y, w, h) - leaves 28px for status bar, 48px for gesture bar
        (0, 28, self.screen_width, self.screen_height.saturating_sub(76))
    }
}
