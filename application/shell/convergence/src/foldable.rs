//! Foldable posture manager: reads hinge angle and splits surfaces across crease.

#[derive(Debug, PartialEq, Eq)]
pub enum FoldState {
    ClosedHandset,
    HalfFoldedTent,
    HalfFoldedLaptop,
    FullyUnfoldedTablet,
}

pub struct FoldablePostureManager;

impl FoldablePostureManager {
    pub fn classify_angle(angle_deg: f32) -> FoldState {
        if angle_deg < 15.0 {
            FoldState::ClosedHandset
        } else if angle_deg >= 75.0 && angle_deg <= 115.0 {
            FoldState::HalfFoldedLaptop
        } else if angle_deg >= 165.0 {
            FoldState::FullyUnfoldedTablet
        } else {
            FoldState::HalfFoldedTent
        }
    }
}
