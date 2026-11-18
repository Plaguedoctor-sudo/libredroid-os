# LibreMobile OS — Security Policy & Vulnerability Disclosure

**Spec Compliance:** LibreDroid System Design v0.1 §14 (Security Model)

---

## 1. Security Architecture Summary

LibreMobile OS enforces defense-in-depth across the entire stack:

| Layer | Security Mechanism |
|---|---|
| **Root Filesystem** | dm-verity SHA-256 Merkle tree verification; immutable read-only mount |
| **User Storage** | LUKS2 full-disk encryption with PIN-derived argon2id KDF (minimum 6 digits) |
| **Egress Mediation** | Linux netfilter / nftables deny-by-default (`inet lrd_egress`) with fail-closed kill switch |
| **DNS Resolution** | Local Unbound DoT forwarding to port 853 with DNSSEC validation |
| **Container Sandbox** | Waydroid cgroups v2 freezer (`cgroup.freeze`), frozen by default on idle/screen-off |
| **App Attribution** | Real-time Android UID to APK package attribution via `lrd-waydroid-apk-hook` |
| **App Delivery** | Pre-flight F-Droid anti-feature inspection (`Tracking`, `Ads`, `NonFreeNet`, `NonFreeDep`) |
| **Mandatory Access Control** | AppArmor confinement profiles for core system daemons |

---

## 2. Reporting a Vulnerability

We prioritize the security and privacy of LibreMobile OS users. If you discover a vulnerability or security defect:

1. **Email:** Send details to `security@libremobile.org` (or encrypted with our GPG release key).
2. **Details to Include:**
   - Subsystem affected (e.g. `lrd-egressd`, `nftables`, `dm-verity`, `waydroid-freezer`).
   - Steps to reproduce or proof-of-concept script.
   - Device model and software version (`cat /etc/os-release`).
3. **Response Timeline:**
   - **Acknowledgment:** Within 24 hours.
   - **Triage & Reproduction:** Within 72 hours.
   - **Fix & Coordinated Disclosure:** Within 14 days for high-severity issues.
