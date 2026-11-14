//! Sovereign Storage Service: fscrypt per-app vaults & local CRDT synchronization.

pub struct StorageService;

impl StorageService {
    pub fn setup_app_vault(app_id: &str) -> String {
        format!("/var/lib/sap/vaults/{}", app_id)
    }
}
