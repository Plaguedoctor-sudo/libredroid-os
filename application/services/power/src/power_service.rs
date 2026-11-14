//! Sovereign Power Service: S0ix modern standby & mobile wake-lock coordinator.

pub struct PowerService {
    active_wake_locks: u32,
}

impl PowerService {
    pub fn new() -> Self {
        Self { active_wake_locks: 0 }
    }

    pub fn acquire_wake_lock(&mut self) {
        self.active_wake_locks += 1;
    }

    pub fn release_wake_lock(&mut self) {
        self.active_wake_locks = self.active_wake_locks.saturating_sub(1);
    }

    pub fn enter_s0ix_deep_sleep(&self) -> Result<(), &'static str> {
        if self.active_wake_locks > 0 {
            return Err("Cannot sleep: active wake-locks present");
        }
        // Echo "s2idle" > /sys/power/mem_sleep; echo "mem" > /sys/power/state
        Ok(())
    }
}
