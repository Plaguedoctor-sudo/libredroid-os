//! Capability and security invariant linter for `sap.manifest.json`.

pub struct ManifestLinter;

impl ManifestLinter {
    pub fn lint_manifest(manifest_json: &str) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();
        if manifest_json.contains("\"clearnet\"") && !manifest_json.contains("\"reason\"") {
            errors.push("Clearnet network policy requires explicit user justification".to_string());
        }
        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}
