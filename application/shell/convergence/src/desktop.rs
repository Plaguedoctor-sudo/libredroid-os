//! Desktop window manager: floating, draggable, resizable windows, snapping, multi-monitor.

#[derive(Debug, Clone)]
pub struct DesktopWindow {
    pub id: u64,
    pub title: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub is_minimized: bool,
    pub is_maximized: bool,
}

pub struct DesktopWindowManager {
    pub windows: Vec<DesktopWindow>,
}

impl DesktopWindowManager {
    pub fn new() -> Self {
        Self { windows: Vec::new() }
    }

    pub fn spawn_window(&mut self, id: u64, title: &str, width: u32, height: u32) {
        self.windows.push(DesktopWindow {
            id,
            title: title.to_string(),
            x: 100,
            y: 100,
            width,
            height,
            is_minimized: false,
            is_maximized: false,
        });
    }
}
