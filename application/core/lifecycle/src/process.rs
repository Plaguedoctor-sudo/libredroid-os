use crate::state::AppState;
use nix::sys::signal::{kill, Signal};
use nix::unistd::Pid;
use std::collections::HashMap;

pub struct ProcessSupervisor {
    tracked_apps: HashMap<String, (Pid, AppState)>,
}

impl ProcessSupervisor {
    pub fn new() -> Self {
        Self {
            tracked_apps: HashMap::new(),
        }
    }

    pub fn register(&mut self, app_id: String, pid: Pid) {
        self.tracked_apps.insert(app_id, (pid, AppState::Created));
    }

    pub fn freeze(&mut self, app_id: &str) -> Result<(), String> {
        if let Some((pid, state)) = self.tracked_apps.get_mut(app_id) {
            if state.can_transition_to(AppState::Frozen) {
                // In production, writing to /sys/fs/cgroup/sap/<app>/cgroup.freeze or SIGSTOP
                kill(*pid, Signal::SIGSTOP).map_err(|e| e.to_string())?;
                *state = AppState::Frozen;
                Ok(())
            } else {
                Err(format!("Cannot freeze app in state {:?}", state))
            }
        } else {
            Err("App not found".to_string())
        }
    }

    pub fn unfreeze(&mut self, app_id: &str) -> Result<(), String> {
        if let Some((pid, state)) = self.tracked_apps.get_mut(app_id) {
            if *state == AppState::Frozen {
                kill(*pid, Signal::SIGCONT).map_err(|e| e.to_string())?;
                *state = AppState::Active;
                Ok(())
            } else {
                Err("App is not frozen".to_string())
            }
        } else {
            Err("App not found".to_string())
        }
    }
}
