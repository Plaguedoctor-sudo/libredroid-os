# FreeStack Acceptance Specification (A1–A14)
SPDX-License-Identifier: GPL-3.0-or-later

This document defines the 14 formal acceptance criteria required for every FreeStack release.
All criteria must be verified automatically via `tests/acceptance.bats` and `tools/certify.sh`.

| ID | Title | Requirement | Verification Method |
|----|-------|-------------|---------------------|
| **A1** | Zero Core Blobs | The core OS rootfs must contain 0 binary blobs without explicit `--allow-blobs=1` waiver. | Inspect `freestack.manifest.yaml` and staged rootfs. |
| **A2** | No Account Mandate | First-boot setup must complete 100% offline without requiring accounts or network. | `tools/fs-setup.py --test-headless` |
| **A3** | Default-Deny Egress | Any process not bound to an explicit egress rule has zero network route. | `tests/net-lockdown.sh` & `config/nftables/default.nft` |
| **A4** | Threshold Root of Trust | System manifests must be signed by at least 3 of 5 sovereign threshold keys. | `fsbuild manifest verify` |
| **A5** | Bit-for-Bit Repro | Binary diff between independent builders must yield 0 non-deterministic bytes. | `tests/repro-rebuild.sh` & `tools/rebuild-attest.py` |
| **A6** | Strong Copyleft Core | Core platform code must carry GPL-3.0-or-later / Apache-2.0 patent grants. | License audit against `AGENTS.md` and `LICENSE` |
| **A7** | SELinux Confinement | Every service must execute under an unprivileged `fs_<svc>_t` domain; neverallow guards active. | `config/selinux/neverallow.te` & `services.te` |
| **A8** | Seccomp & Bwrap Jail | Every background service unit must run under bubblewrap with unshared namespaces and seccomp filter. | `config/seccomp/*.json` & `config/dinit/*.service` |
| **A9** | DM-Verity Integrity | Read-only rootfs must be sealed with dm-verity; corrupt blocks must trigger I/O error. | `tests/verity-flip.bats` |
| **A10**| Keystore & Attestation | Cryptographic secrets managed by `fskeystored` isolated with TPM2 PCR policy sealing. | `keystore/test_keystore` |
| **A11**| Keyboard-Only UX | All navigation, window management, and setup workflows accessible via standard keybindings. | `docs/KEYBOARD-NAV.md` |
| **A12**| Screen Reader / A11y | All custom UI elements export AtkObject interfaces over AT-SPI2 bus. | `tools/fs-atk-bridge.c` & `tests/a11y-smoke.md` |
| **A13**| Zero Telemetry | Platform contains 0 telemetry endpoints, tracking IDs, or crash uploaders enabled by default. | Audit all configuration and source trees. |
| **A14**| Signed Transparency | All release artifacts must carry cosign signatures and verifiable Rekor log entries. | `docs/MIRRORS.md` & `fsbuild sign-dry` |
