use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AppState {
    Uninitialized,
    Created,
    Active,
    Background,
    Frozen,
    Destroyed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateTransition {
    pub from: AppState,
    pub to: AppState,
    pub timestamp_ns: u64,
    pub reason: String,
}

impl AppState {
    pub fn can_transition_to(&self, next: AppState) -> bool {
        match (self, next) {
            (AppState::Uninitialized, AppState::Created) => true,
            (AppState::Created, AppState::Active) => true,
            (AppState::Active, AppState::Background) => true,
            (AppState::Active, AppState::Frozen) => true,
            (AppState::Background, AppState::Active) => true,
            (AppState::Background, AppState::Frozen) => true,
            (AppState::Frozen, AppState::Active) => true,
            (AppState::Frozen, AppState::Background) => true,
            (_, AppState::Destroyed) => true,
            _ => false,
        }
    }
}
