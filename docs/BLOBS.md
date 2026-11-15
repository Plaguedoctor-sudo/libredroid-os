# LibreDroid OS — Firmware Blob Tier Register

This document provides a transparent, itemized disclosure of non-free binary firmware packages included in LibreDroid OS images for hardware initialization.

---

## 1. Blob Tier Policy

In accordance with [ADR 0004](file:///home/nitin/fkgugal/docs/adr/0004-v0.1-debian-glibc-stack.md) and FreeStack trust tiering:
1. **Quarantine:** Firmware blobs are passive binary data loaded into peripheral controllers and CPU execution units; they do not execute as native host CPU operating system code.
2. **Honesty & Itemization:** Every binary package sourced from `non-free-firmware` is explicitly tracked, cataloged, and justified.
3. **No Hidden Telemetry:** Firmware blobs are forbidden from network egress and confined to their device controller boundaries.

---

## 2. Itemized Blob Inventory (v0.1 x86_64)

| Component | Source Component | Package | Purpose / Hardware Target | Status |
|---|---|---|---|---|
| **Intel Wi-Fi Firmware** | Debian `non-free-firmware` | `firmware-iwlwifi` | Provides binary microcode for Intel Wireless WiFi adapters (AX200, AX210, BE200, 7265, 8260, 9260, 9560, etc.) required for wireless networking on modern laptops. | **Active (v0.1)** |
| **Intel CPU Microcode** | Debian `non-free-firmware` | `intel-microcode` | Processor microcode patches loaded during early boot (`initramfs`) to patch CPU errata, speculative execution vulnerabilities (Spectre/Meltdown/Downfall), and system stability bugs on Intel processors. | **Active (v0.1)** |

---

## 3. Free Software Alternatives & Migration Plan

- **Free Firmware Tier:** LibreDroid includes `firmware-linux-free` in the core image for devices that function with fully open, reverse-engineered microcode.
- **v1.0 Roadmap:** Future releases will provide a strictly pure 100% blob-free image variant (`libredroid-libre-x86_64.iso`) with an explicit opt-in flag (`--allow-blobs`) for users requiring proprietary wireless or GPU microcode.
