use crate::handle::CapHandle;

pub struct CapVerifier;

impl CapVerifier {
    pub fn verify_access(
        handle: &CapHandle,
        resource_id: &str,
        requested_perm: u32,
        current_time_ns: u64,
    ) -> Result<(), &'static str> {
        if handle.is_expired(current_time_ns) {
            return Err("Capability lease has expired");
        }

        if handle.resource_id != resource_id && !resource_id.starts_with(&handle.resource_id) {
            return Err("Capability resource mismatch");
        }

        if !handle.allows(requested_perm) {
            return Err("Insufficient capability permissions");
        }

        Ok(())
    }

    pub fn attenuate(
        parent: &CapHandle,
        attenuated_perms: u32,
        sub_resource: &str,
        current_time_ns: u64,
    ) -> Result<CapHandle, &'static str> {
        if (parent.permissions & attenuated_perms) != attenuated_perms {
            return Err("Cannot attenuate to permissions not held by parent");
        }

        let mut child = parent.clone();
        child.permissions = attenuated_perms;
        if !sub_resource.is_empty() {
            child.resource_id = format!("{}/{}", parent.resource_id, sub_resource);
        }
        child.issued_at_ns = current_time_ns;

        Ok(child)
    }
}
