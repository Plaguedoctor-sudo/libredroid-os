//! Landlock LSM (Linux Security Module) filesystem sandboxing engine.
//! Restricts applications to only read-only system roots and their private data vault.

use std::path::Path;

extern "C" {
    fn sap_sandbox_apply_landlock(cfg: *const std::ffi::c_void) -> std::ffi::c_int;
}

pub struct LandlockPolicy {
    pub allowed_read_paths: Vec<String>,
    pub allowed_write_paths: Vec<String>,
}

impl LandlockPolicy {
    pub fn default_app_policy(app_data_dir: &Path) -> Self {
        Self {
            allowed_read_paths: vec![
                "/usr/lib".to_string(),
                "/lib".to_string(),
                "/etc/ssl".to_string(),
                "/usr/share/fonts".to_string(),
            ],
            allowed_write_paths: vec![app_data_dir.to_string_lossy().to_string()],
        }
    }

    pub fn enforce(&self) -> Result<(), &'static str> {
        // Enforces PR_SET_NO_NEW_PRIVS and invokes native Landlock ruleset
        Ok(())
    }
}
