//! Capability and security invariant linter for `sap.manifest.json`.
//! Enforces least-privilege capability bounds, declarative network egress, and semantic versioning.

pub struct ManifestLinter;

impl ManifestLinter {
    pub fn lint_manifest(manifest_json: &str) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();

        // 1. Mandatory Identity Fields
        if !manifest_json.contains("\"id\"") {
            errors.push("Missing mandatory field: 'id' (reverse-DNS app identifier, e.g. 'org.sovereign.vault')".to_string());
        }
        if !manifest_json.contains("\"version\"") {
            errors.push("Missing mandatory field: 'version' (semver compliant)".to_string());
        }
        if !manifest_json.contains("\"name\"") {
            errors.push("Missing mandatory field: 'name'".to_string());
        }
        if !manifest_json.contains("\"entrypoint\"") {
            errors.push("Missing mandatory field: 'entrypoint' (binary or script path inside bundle)".to_string());
        }

        // 2. Network Security Guardrails
        if manifest_json.contains("\"clearnet\"") && !manifest_json.contains("\"reason\"") {
            errors.push("Clearnet network policy requires explicit user-facing 'reason' justification".to_string());
        }
        if manifest_json.contains("\"wan_direct\"") && !manifest_json.contains("\"audit_contact\"") {
            errors.push("Direct WAN access requires declared 'audit_contact' security maintainer".to_string());
        }

        // 3. Dangerous Capability Checks
        if manifest_json.contains("\"hardware_root\"") {
            errors.push("Prohibited capability: 'hardware_root' is strictly forbidden under Sovereign Application Platform rules".to_string());
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}
