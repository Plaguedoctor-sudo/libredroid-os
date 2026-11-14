pub mod desktop;
pub mod foldable;
pub mod handset;
pub mod tablet;

pub use desktop::{DesktopWindow, DesktopWindowManager};
pub use foldable::{FoldState, FoldablePostureManager};
pub use handset::HandsetLayoutManager;
pub use tablet::TabletLayoutManager;
