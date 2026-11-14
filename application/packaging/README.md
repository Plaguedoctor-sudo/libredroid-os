# Sovereign Application Package Tooling (`packaging/`)

Provides compiler, linter, cryptographic signing, and atomic installation tools for the `.sap` package ecosystem.

## Subdirectories

- [`builder/`](file:///home/nitin/fkgugal/application/packaging/builder): Compiles source packages into deterministic, timestamp-normalized `.sap` bundles with CycloneDX/SPDX SBOMs.
- [`verifier/`](file:///home/nitin/fkgugal/application/packaging/verifier): Validates Ed25519/Dilithium multisig blocks and checks Rekor transparency logs.
- [`installer/`](file:///home/nitin/fkgugal/application/packaging/installer): Unpacks and mounts applications as read-only cryptographic squashfs images backed by `dm-verity` with dual-slot A/B rollback protection.
- [`spec/`](file:///home/nitin/fkgugal/application/packaging/spec): Formal JSON schema and binary package specification.
