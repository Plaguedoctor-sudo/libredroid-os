# Changelog

All notable changes to LibreDroid OS and the FreeStack Reproducible Subsystem will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-10

### Added
- **LibreDroid Core OS Architecture (Phases 0–16)**:
  - System daemon `lrdd` with Ring 0/1 IPC privilege tiering and removal of mock services.
  - Native Wayland shell and compositor architecture with layer-shell virtual keyboard (`squeekboard`).
  - Active telemetry defenses sinkholing Firebase/DoH egress via nftables kernel packet filter.
  - Hardware microVM domain isolation for Vault and Tor Gateway using KVM and bubblewrap.
  - Halium + GKI sovereign mobile base with dual-slot (A/B) OTA updates, watchdog rollback protection, and PCR 0/4/7/9 TPM2 / LUKS2 sealing.
  - Cellular Voice, VoLTE/VoNR, SMS stack via ModemManager with automatic Halium RIL bridge.
  - Dynamic partition super-mapper and MicroSD rootfs support for devices with locked bootloader userspace (Option 4).
- **FreeStack Subsystem (Phases FS-0 – FS-5)**:
  - Formal manifest specification (`freestack.manifest.yaml`) across 50 components and 16 OS layers with strict JSON schema validation.
  - 3-of-5 Minisign threshold key ceremony and multi-signature verification.
  - Pinned toolchain and hermetic store caching layer (`.store/`).
  - Sandboxed base toolchain build with `musl`, `dinit`, `toybox`, and `bubblewrap`.
  - Staging targets for `x200-libreboot` and `reform-imx8mq` with hardware blob quarantine.
  - Multi-party independent rebuild verification with zero diffs and bit-for-bit reproducibility attestations.
  - Full SBOM generation in SPDX 2.3 and CycloneDX 1.6 formats.
