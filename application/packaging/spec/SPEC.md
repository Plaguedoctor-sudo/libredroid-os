# Sovereign Application Package (.sap) Format Specification

> **Version:** 1.0.0-draft  
> **Status:** Standard  
> **MIME Type:** `application/vnd.sovereign.package+tar`

---

## 1. Overview & Motivation

The `.sap` format replaces Android `.apk` archives. Where APK files are loosely structured ZIP containers relying on mutable AndroidManifest.xml declarations and central Google signing, the `.sap` bundle is a content-addressed, mathematically reproducible, capability-bounded archive.

## 2. Package Binary Structure

A `.sap` package is a deterministic POSIX tar archive compressed with `zstd` (level 19, deterministic frame headers):

```
org.sovereign.example.sap
├── sap.manifest.json          # Canonical capability & identity declaration
├── sap.manifest.json.sig      # Ed25519 / Dilithium multisig block
├── sbom.spdx.json             # Complete reproducible software bill of materials
├── bin/
│   ├── app-x86_64             # Statically linked or musl ELF binary (x86_64)
│   ├── app-aarch64            # Statically linked or musl ELF binary (ARM64)
│   └── app-riscv64            # Statically linked or musl ELF binary (RISC-V)
├── wasm/
│   └── app.wasm               # WASI modular component bytecode (architecture-agnostic)
├── assets/
│   ├── icon.svg               # Scalable vector application icon
│   └── locales/               # po4a / gettext localized string catalogs
└── security/
    └── landlock-rules.json    # Explicit filesystem paths allowed for Landlock LSM
```

## 3. Package Invariants

1. **Epoch Normalization:** All file modification timestamps (`mtime`) MUST be normalized to `2026-01-01 00:00:00 UTC` (`1767225600`).
2. **Owner Normalization:** All file UID/GID values MUST be `0` (root/root).
3. **Reproducibility Verification:** Recompiling from identical git trees with the standard container MUST produce an identical SHA-256 hash.
4. **No Ambient Permissions:** Any capability requested in `sap.manifest.json` requires explicit hardware-bound user intent or static sandbox verification.
