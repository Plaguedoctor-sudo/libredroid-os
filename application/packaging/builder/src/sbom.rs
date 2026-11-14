//! CycloneDX / SPDX reproducible Software Bill of Materials (SBOM) generator.

pub struct SbomGenerator;

impl SbomGenerator {
    pub fn generate_spdx(app_id: &str, version: &str) -> String {
        format!(
            r#"{{
  "spdxVersion": "SPDX-2.3",
  "dataLicense": "CC0-1.0",
  "SPDXID": "SPDXRef-DOCUMENT",
  "name": "{}",
  "packageVersion": "{}",
  "creationInfo": {{
    "created": "2026-01-01T00:00:00Z",
    "creators": ["Tool: sap-build-1.0.0"]
  }}
}}"#,
            app_id, version
        )
    }
}
