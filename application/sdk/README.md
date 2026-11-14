# Developer SDK & Verification Tools (`sdk/`)

Everything a third-party developer needs to build, package, test, and verify sovereign applications for the Sovereign Application Platform.

## Subdirectories

- [`cli/`](file:///home/nitin/fkgugal/application/sdk/cli): The `sapp` command-line developer utility:
  - `sapp create <app_id>`: Scaffold a new project from official templates.
  - `sapp build`: Compiles native ELF / WASM and generates reproducible SBOMs.
  - `sapp sign`: Signs the bundle with an Ed25519 developer key.
  - `sapp verify`: Validates package invariants, schema compliance, and signatures.
  - `sapp run`: Launches the application inside a local microVM/namespace sandbox.
- [`templates/`](file:///home/nitin/fkgugal/application/sdk/templates):
  - `rust-native`: High-performance, zero-waste native Rust template.
  - `wasm-modular`: Portable, memory-isolated WASI / WebAssembly component template.
- [`test-harness/`](file:///home/nitin/fkgugal/application/sdk/test-harness): Automated test scripts and QEMU integration harness testing process lifecycle, capability leases, and freeze states.
