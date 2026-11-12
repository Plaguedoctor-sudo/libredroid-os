# FreeStack Conformance & Behavioural Acceptance Specification
SPDX-License-Identifier: GPL-3.0-or-later

This document defines the formal acceptance criteria required for every FreeStack release.
Verification is partitioned into two dedicated suites executed in CI:
1. `tests/behaviour.bats` — Live behavioural verification, negative constraint assertions, and fault injection (A1–A14).
2. `tests/rules.bats` — Constitutional ruleset and static topology conformance (R1–R14).

---

## Part 1: Behavioural Acceptance Suite (`tests/behaviour.bats`)

| ID | Title | Behavioural Requirement | Negative / Verification Mechanism |
|----|-------|-------------------------|-----------------------------------|
| **A1** | Sub-Threshold Rejection | Manifest with 2-of-5 valid signatures must be strictly rejected with exit code 41. | `FSBUILD_SIGFILE=tests/fixtures/manifest_2sigs.sig fsbuild manifest verify` -> exit 41 |
| **A2** | Threshold Acceptance | Manifest with ≥3-of-5 valid signatures must be verified and accepted with exit code 0. | `FSBUILD_SIGFILE=tests/fixtures/manifest_3sigs.sig fsbuild manifest verify` -> exit 0 |
| **A3** | Blob Without Block Rejection | Component flagged `tier: blob` lacking mandatory `blob` declaration or waiver must fail rule check with exit 43. | `FSBUILD_MANIFEST=tests/fixtures/manifest_blob_noblock.yaml fsbuild rules check` -> exit 43 |
| **A4** | Expired Waiver Rejection | Any waiver whose expiry date precedes the current date must fail rule check with exit 43. | `FSBUILD_MANIFEST=tests/fixtures/manifest_expired_waiver.yaml fsbuild rules check` -> exit 43 |
| **A5** | Isolated Build Network Egress | Build sandbox must deny external network access without an explicit mirror declaration. | `bwrap --unshare-all curl ...` -> connection failure (exit non-zero) |
| **A6** | Default-Deny Egress | Process running without an explicit routing rule is blocked from accessing external endpoints. | `unshare -r -n curl ... http://1.1.1.1` -> connection refused (exit non-zero) |
| **A7** | Explicit Route Clearance | Process in network namespace with configured local/loopback route communicates successfully. | `unshare -r -n ... lo up && curl localhost` -> exit 0 |
| **A8** | Core Stage Blob Omission | Rootfs staging without `--allow-blobs` must omit all blob artifacts and delete `etc/blob-manifest.txt`. | `fsbuild stage --target x200-libreboot` -> assert absence of `blob-manifest.txt` |
| **A9** | Blob Manifest & DM-Verity Fault Injection | Staging with `--allow-blobs` records quarantined blobs in `etc/blob-manifest.txt`; flipped block fails DM-Verity verification. | `dd` block byte flip -> `veritysetup verify` fails (exit non-zero) |
| **A10**| Keystore PCR Sealing & Attestation | Cryptographic keys managed by `fskeystored` daemon with TPM2 PCR sealing and attestation. | Live execution of `keystore/test_keystore` exercising Ed25519, crypto, and PCR attestation statement |
| **A11**| Staged Root Anti-Tamper | Staged target rootfs contains 0 instances of `systemd-resolved` or Google Mobile Services (GMS). | Negative grep across populated staged rootfs |
| **A12**| Zero Default Telemetry | System and overlay configuration contains 0 default-on analytics or tracking flags. | Negative recursive audit across `config/` |
| **A13**| Universal Daemon Sandboxing | Every long-running process unit in `config/dinit/` executes inside a hardened bubblewrap sandbox. | Audit all `type = process` service definitions for `bwrap` |
| **A14**| Bit-for-Bit Independent Rebuild | Multi-party independent rebuild under varying umask, timezone, and locale yields bit-for-bit identical hashes. | `tests/repro-rebuild.sh` -> zero diffs confirmed |

---

## Part 2: Constitutional Rules Suite (`tests/rules.bats`)

| ID | Title | Constitutional Rule Verified |
|----|-------|------------------------------|
| **R1** | Zero Core Blobs | Manifest topology and core staging enforce R1/R2 zero-blob baseline. |
| **R2** | Accountless First-Boot | First-boot setup scripts execute 100% offline with zero cloud mandate. |
| **R3** | Default-Deny Policy | `config/nftables/default.nft` defines default-drop on input, forward, and output chains. |
| **R4** | Threshold Signing | 3-of-5 root keys ceremony verified across key files and fixtures. |
| **R5** | Reproducibility Taxonomy | `docs/REPRO-DIFF-TAXONOMY.md` and `diff-classifier.py` available and operational. |
| **R6** | Strong Copyleft Core | Licensing and patent grants conform to GPL-3.0-or-later. |
| **R7** | SELinux Neverallow Policy | Per-service SELinux policy files and `neverallow.te` rules enforced. |
| **R8** | Seccomp System Filters | System call filter policies present in `config/seccomp/`. |
| **R9** | DM-Verity Testability | Hash tree verification tooling and test harnesses verified. |
| **R10**| Keystore Architecture | Keystore headers and TPM2 key generation contracts verified. |
| **R11**| Keyboard-Only UX | Super key navigation contracts specified in `docs/KEYBOARD-NAV.md`. |
| **R12**| Accessibility Bridge | AT-SPI2 / AtkObject interface bridge code present and compilation-tested. |
| **R13**| Telemetry Elimination | Recursive configuration audit verifies zero tracking flags. |
| **R14**| Transparency Log Integration | Release mirrors and Cosign / Rekor attestation documented. |
