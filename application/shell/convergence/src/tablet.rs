//! Tablet multi-pane layout with stylus pencil rejection.

pub struct TabletLayoutManager {
    pub multi_window_split: f32, // Split percentage (0.5 = 50/50 split)
}

impl TabletLayoutManager {
    pub fn new() -> Self {
        Self {
            multi_window_split: 0.5,
        }
    }
}
