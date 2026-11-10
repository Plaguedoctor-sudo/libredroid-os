# FreeStack Trust Architecture & Multi-Signature Specification

FreeStack guarantees that no single developer, corporation, vendor, or build machine holds unilateral authority over system binaries, configurations, or updates. This document outlines the cryptographic trust model, key ceremony governance, and content verification mechanisms.

---

## 1. Multi-Signature Root of Trust (§0, R6)

FreeStack utilizes a 3-of-5 threshold signature model based on the Ed25519 signature algorithm (implemented via Minisign / Libsodium).

### Root Key Holders

The initial offline key ceremony established five distinct keypairs held across separated physical custody domains:

| Key Identifier | Domain / Role | Custody Model |
| :--- | :--- | :--- |
| `foundation-a` | Foundation Core Council | Hardware Security Token (FIDO2/YubiKey) |
| `foundation-b` | Foundation Infrastructure Lead | Air-gapped cold storage |
| `foundation-auditor` | Independent Security Auditor | Separate legal entity |
| `community-a` | Open Source Community Delegate 1 | Verified contributor elected delegate |
| `community-b` | Open Source Community Delegate 2 | Verified contributor elected delegate |

Public keys are committed to the repository in `freestack/keys/` and mirrored in `keys/ROOT-KEYS.txt`.

### Threshold Enforcement
- Any manifest update or production release requires at least **3 valid signatures** out of the 5 authorized keys.
- If fewer than 3 valid signatures are present, `fsbuild manifest verify` (and `make verify`) exits with code `1` and aborts all downstream fetch, build, or flash operations.

---

## 2. Content-Addressed Tree Hashing (`tree-sha256-v1`)

To prevent supply chain poisoning through mutable Git tags, force-pushed branches, or mirror tampering:
1. Every component source repository is pinned by a deterministic content-addressed tree hash (`tree-sha256-v1`).
2. The tree hash is computed by recursively digesting the canonical repository tree stripped of `.git/` metadata and permissions jitter:
   $$\text{Hash} = \text{SHA-256}(\text{Canonical File Tree})$$
3. Zero-hashes (`00000000...`) are forbidden in production lockfiles. Every hash is verified during `make verify-hashes`.

---

## 3. High-Availability Censorship-Resistant Mirrors

Components are backed by multiple independent mirror protocols:
- **Primary HTTPS**: Canonical upstream source forge
- **Secondary Rsync**: High-bandwidth foundation archive mirrors
- **Distributed IPFS**: Content-addressed decentralized gateway (`/ipfs/...`)
- **Tor Hidden Service**: Onion mirror (`.onion`) for access in censorship-heavy jurisdictions

---

## 4. Supply Chain Transparency & Attestation

Every release produces cryptographic audit trails:
- **SPDX 2.3 & CycloneDX 1.6 SBOMs**: Full inventory of dependencies, licenses, and hashes in `dist/sbom.spdx.json` and `dist/sbom.cdx.json`.
- **Rebuild Attestation**: Bit-for-bit rebuild verification generated automatically by `tests/repro-rebuild.sh` stored in `dist/rebuild-attestation.json`.
