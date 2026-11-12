# FreeStack Subsystem Status Matrix

This living register tracks the 21 architectural subsystems across FreeStack releases.

| Subsystem | Scope | Verification Status | Implementation Path |
|---|---|---|---|
| **§0 Manifest & Roots** | 3-of-5 threshold signing, frozen fixtures | **COMPLETE** | `manifest/`, `keys/`, `tools/sign-manifest.sh` |
| **§1 Capability Primitives**| Leases, Budgets, Confirm, Monotonic Atten | **COMPLETE** | `interface/lease.capnp`, `tools/fs-policy.py` |
| **§2 Schemas & IPC** | 25 Cap'n Proto capability schemas | **COMPLETE** | `interface/*.capnp`, `tools/schema-freeze.py` |
| **§3 Independent Rebuild** | Multi-party disparate builder proof (Phase B)| **COMPLETE** | `tests/repro-rebuild.sh`, `tools/run-beta-vm.sh` |
| **§4 Kernel Hardening** | KSPP fragments, Landlock, Seccomp, Driver Allowlist | **COMPLETE** | `config/kernel/`, `docs/DRIVER-POLICY.md` |
| **§5 Storage & Crypto** | LUKS2 Argon2id, dm-verity, fscrypt | **COMPLETE** | `config/initramfs/`, `tools/firstboot-keygen.sh` |
| **§6 Keystore & TPM2** | TPM2 PCR sealing, quota management, audit ledger | **COMPLETE** | `keystore/`, `tools/fs-tpm-seal`, `tests/a10_keystore.bats` |
| **§7 SELinux MAC** | Strict per-service domains, zero blanket allow | **COMPLETE** | `config/selinux/`, `docs/SELINUX.md` |
| **§8 Confinement** | Namespaces (`bwrap`), Seccomp-BPF profiles | **COMPLETE** | `config/seccomp/`, `config/dinit/` |
| **§9 Continuous Fuzzing** | ASan/UBSan harnesses, automated triage | **COMPLETE** | `fuzz/`, `fuzz/soak-triage.sh` |
| **§10 Distribution** | Multi-transport mirrors, Tor v3, Rekor transparency | **COMPLETE** | `docs/MIRRORS.md`, `tests/mirrors.bats` |
| **§11 Accessibility** | Orca speech bridge, AT-SPI2, 100% keyboard nav | **COMPLETE** | `tools/fs-atk-bridge.c`, `docs/KEYBOARD-NAV.md` |
| **§12 UX & Settings** | Offline setup, 12 Cap'n Proto settings panels | **COMPLETE** | `tools/fs-setup.py`, `tools/panels/` |
| **§13 Localization** | `po4a`, Weblate readiness, HarfBuzz text shaping | **COMPLETE** | `po/`, `interface/i18n.capnp` |
| **§14 Developer SDK** | Meson templates, Flatpak manifests, sysroots | **COMPLETE** | `sdk/`, `docs/API-STABILITY.md` |
| **§15 Conformance** | Bats R1–R14 + A1–A15 suites, self-certification | **COMPLETE** | `tests/`, `tools/certify.sh` |
| **§16 Release Ceremony** | Clean-clone gates, SBOM generation, threshold tag | **COMPLETE** | `Makefile`, `.ci/build-gate.sh` |
| **§17 Future Services** | 25 capability-driven service specs | **COMPLETE** | `interface/*.capnp`, `policy/capabilities.toml` |
| **§18 Governance** | Threat model, blob audit, fork policy | **COMPLETE** | `GOVERNANCE.md`, `THREAT-MODEL.md` |
| **§19 Hardware Qual** | ThinkPad X200, MNT Reform qualification | **COMPLETE** | `targets/`, `config/power/` |
| **§20 Halium Adaptation**| Musl-hybris compatibility, isolated vendor blobs | **COMPLETE** | `targets/reform-imx8mq.json` |
