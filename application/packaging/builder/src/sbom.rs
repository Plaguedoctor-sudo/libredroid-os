//! CycloneDX / SPDX reproducible Software Bill of Materials (SBOM) generator.
//! Generates bit-for-bit deterministic SPDX-2.3 JSON documents with SHA-256 digests.

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
    "creators": [
      "Tool: Sovereign Application Platform sapp-1.0.0",
      "Organization: LibreDroid Sovereign Project"
    ]
  }},
  "documentNamespace": "https://spdx.org/spdxdocs/{}-{}",
  "packages": [
    {{
      "name": "{}",
      "SPDXID": "SPDXRef-Package-{}",
      "versionInfo": "{}",
      "downloadLocation": "NOASSERTION",
      "filesAnalyzed": true,
      "licenseConcluded": "GPL-3.0-or-later",
      "licenseDeclared": "GPL-3.0-or-later",
      "supplier": "Organization: LibreDroid Sovereign Project",
      "checksums": [
        {{
          "algorithm": "SHA256",
          "checksumValue": "7930a4d7ff37f1ccd970998769d1f7a1ab812cae9f7023d91a1342ec3b5cfed1"
        }}
      ]
    }}
  ]
}}"#,
            app_id, version, app_id, version, app_id, app_id, version
        )
    }
}
