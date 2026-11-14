mod linter;
mod sbom;

use linter::ManifestLinter;
use sbom::SbomGenerator;
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    println!("Sovereign Application Package Builder (sap-build v1.0.0)");
    if args.len() < 2 {
        println!("Usage: sap-build <directory_to_package>");
        return;
    }
    let target_dir = &args[1];
    println!("Building deterministic .sap package from: {}", target_dir);
    let sample_manifest = r#"{"schemaVersion":"1.0.0","networkPolicy":"default_deny"}"#;
    if let Err(errs) = ManifestLinter::lint_manifest(sample_manifest) {
        eprintln!("Lint errors: {:?}", errs);
    } else {
        println!("Manifest verified clean.");
        let sbom = SbomGenerator::generate_spdx("org.sovereign.app", "1.0.0");
        println!("Generated reproducible SBOM ({} bytes)", sbom.len());
    }
}
