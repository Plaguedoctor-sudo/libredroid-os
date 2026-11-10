# Threat model

Version 0.1. Reviewed each release. Superseded versions stay in git.

## What this defends

| Asset | Why it matters |
|---|---|
| User data at rest | Photos, messages, documents |
| User identity and location | Correlation, stalking, state interest |
| Boot integrity | A poisoned bootloader defeats everything above it |
| Update channel | One bad update is a mass compromise |
| Build reproducibility | Without it, "open source" is unverifiable |
| The license itself | Re-enclosure destroys the guarantees over time |

## Adversaries

| # | Adversary | Capability | In scope |
|---|---|---|---|
| A1 | App developer | Runs code on device, wants data or network | Yes |
| A2 | Network observer | Sees and modifies traffic, incl. ISP | Yes |
| A3 | Malicious mirror | Serves altered source or binary | Yes |
| A4 | Compromised single maintainer | Can push code, holds one key | Yes |
| A5 | SoC vendor | Controls firmware blobs and microcode | Partial |
| A6 | Platform monopolist | Wants default-bundle and account lock-in | Yes |
| A7 | Legal compulsion on the Foundation | Can demand a signing key or a takedown | Partial |
| A8 | Physical attacker with the device | Has the hardware | Partial |
| A9 | Baseband vendor | Runs a closed RTOS with DMA access | No |
| A10 | Nation-state supply chain | Can insert at fab or compiler level | Partial |

## Trust boundaries

1. **App → OS.** Sandbox, `bwrap`, `seccomp`, Landlock, per-app netns.
2. **OS → network.** `nftables` default-deny, `opensnitch` prompt, own resolver.
3. **Source → binary.** Tree hashes, hermetic builds, reproducibility, rebuilders.
4. **Binary → device.** Threshold signature, transparency log, rollback counter.
5. **Firmware → OS.** Measured boot, TPM PCR sealing, Heads.
6. **Contributor → repo.** DCO, review, no single-key release.

## Mitigations mapped

| Adversary | Mitigation | Rule |
|---|---|---|
| A1 | sandbox, netns, permission prompts | R5 |
| A2 | WireGuard/Tor, DNSSEC, NTS | R5, R11 |
| A3 | tree hashes, threshold sigs, 3 mirrors, rekor | R6, R7 |
| A4 | 3-of-5 threshold, review requirement | R6 |
| A5 | blob tier quarantine, kill switches, coreboot | R2, R6 |
| A6 | no GMS, no account, no store lock-in | R3, R11 |
| A7 | multi-org key custody, mirror diversity | R6, R9 |
| A8 | LUKS2 argon2id, fscrypt, verified boot | R6 |
| A10 | bootstrap-from-seed, third-party rebuilds | R7 |

## Residual risk — accepted and documented

| Risk | Why not fixed | Compensating |
|---|---|---|
| Baseband firmware is closed | No free baseband exists at scale | Modem netns, kill switch, WiFi-only profile |
| CPU microcode and ME/PSP | Signed, unauditable | coreboot/libreboot, `me_cleaner`, AMT off |
| Some GPU/Wi-Fi firmware | Vendor-signed, no free replacement | Blob tier, itemized, `source_available: false` |
| Widevine DRM | Closed by design | Optional module, marked |
| WebPKI CAs | Centralized by protocol | CT monitoring, optional user CA |
| DNS root, BGP, RPKI | Global infrastructure | DNSSEC validation, local resolver |
| Hosting pressure | Jurisdictional | 3 mirrors, onion, IPFS |
| Compiler trust | Bootstrapping chain | Seed bootstrap, rebuilders |

## Out of scope

- Hardware implants below the SoC.
- Evil-maid attacks with unlimited time and lab equipment (partially covered).
- Traffic analysis against a global passive adversary (partially covered by Tor).
- Coerced biometric unlock.

## Assumptions

- The user's root key is not compromised.
- At least 3 of 5 root key holders are independent.
- At least one mirror is reachable.
- The user verifies the published hashes at least once.

If an assumption breaks, the model breaks. Say so in the release notes.
