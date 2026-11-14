use crate::handle::{CapHandle, PERM_LEASE_EPHEMERAL};
use sha2::{Digest, Sha256};

pub struct LeaseManager;

impl LeaseManager {
    pub const MAX_LEASE_DURATION_NS: u64 = 10_000_000_000; // 10 seconds

    pub fn issue_lease(
        resource_id: &str,
        recipient: &str,
        permissions: u32,
        duration_ns: u64,
        current_time_ns: u64,
    ) -> Result<CapHandle, &'static str> {
        let clamped_duration = duration_ns.min(Self::MAX_LEASE_DURATION_NS);
        let expires_at_ns = current_time_ns + clamped_duration;

        let mut hasher = Sha256::new();
        hasher.update(resource_id.as_bytes());
        hasher.update(recipient.as_bytes());
        hasher.update(&current_time_ns.to_le_bytes());
        let id_hash: [u8; 32] = hasher.finalize().into();

        Ok(CapHandle {
            id: id_hash,
            resource_id: resource_id.to_string(),
            permissions: permissions | PERM_LEASE_EPHEMERAL,
            issuer: "sap.authority".to_string(),
            recipient: recipient.to_string(),
            issued_at_ns: current_time_ns,
            expires_at_ns,
        })
    }
}
