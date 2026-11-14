use serde::{Deserialize, Serialize};

pub const PERM_READ: u32 = 1 << 0;
pub const PERM_WRITE: u32 = 1 << 1;
pub const PERM_EXECUTE: u32 = 1 << 2;
pub const PERM_LEASE_EPHEMERAL: u32 = 1 << 3;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CapHandle {
    pub id: [u8; 32],
    pub resource_id: String,
    pub permissions: u32,
    pub issuer: String,
    pub recipient: String,
    pub issued_at_ns: u64,
    pub expires_at_ns: u64, // 0 = indefinite
}

impl CapHandle {
    pub fn is_expired(&self, current_time_ns: u64) -> bool {
        if self.expires_at_ns == 0 {
            false
        } else {
            current_time_ns >= self.expires_at_ns
        }
    }

    pub fn allows(&self, required_perm: u32) -> bool {
        (self.permissions & required_perm) == required_perm
    }
}
