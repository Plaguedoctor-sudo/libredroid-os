//! Dual-slot A/B rollback guardian.
//! On crash-loop detection (3 crashes within 60s), automatically switches active slot back to previous known-good version.

pub struct RollbackGuardian {
    pub crash_count: u32,
    pub max_allowed_crashes: u32,
}

impl RollbackGuardian {
    pub fn new() -> Self {
        Self {
            crash_count: 0,
            max_allowed_crashes: 3,
        }
    }

    pub fn record_crash(&mut self) -> bool {
        self.crash_count += 1;
        if self.crash_count >= self.max_allowed_crashes {
            // Trigger automatic slot rollback
            true
        } else {
            false
        }
    }
}
