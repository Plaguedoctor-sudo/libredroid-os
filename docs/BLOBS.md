# LibreDroid OS — Firmware Blob Tier Register

This document provides a transparent, itemized disclosure of non-free binary firmware packages included in LibreDroid OS images for hardware initialization.

---

## 1. Blob Tier Policy

In accordance with [ADR 0004](docs/adr/0004-v0.1-debian-glibc-stack.md) and FreeStack trust tiering:
1. **Quarantine:** Firmware blobs are passive binary data loaded into peripheral controllers and CPU execution units; they do not execute as native host CPU operating system code.
2. **Honesty & Itemization:** Every binary package sourced from `non-free-firmware` is explicitly tracked, cataloged, and justified.
3. **No Hidden Telemetry:** Firmware blobs are forbidden from network egress and confined to their device controller boundaries.

---

## 2. Itemized Blob Inventory (v0.1 x86_64)

| Component | Source Package | Active Target Firmware Files | Hardware Target / Justification | Status |
|---|---|---|---|---|
| **Realtek Wi-Fi Firmware** | Debian `firmware-realtek` | `/usr/lib/firmware/rtw88/rtw8821c_fw.bin` (137 KB) | Specifically required by the in-tree kernel module `rtw88_8821cu` for the USB Realtek RTL8821CU 802.11ac NIC (`0bda:c820`). Note: Debian package currently ships ~10 MB of unrelated Realtek blobs; v1.0 target will isolate `rtw8821c_fw.bin` exclusively. | **Active (v0.1)** |
| **Intel CPU Microcode** | Debian `intel-microcode` | Early initramfs microcode cpio archive | Processor microcode patches loaded during early boot (`initramfs`) to patch CPU errata, speculative execution vulnerabilities (Spectre/Meltdown/Downfall), and stability bugs on Intel processors (including host i3-8100T). | **Active (v0.1)** |
| **Intel Wi-Fi Firmware** | Debian `firmware-iwlwifi` | `/usr/lib/firmware/iwlwifi-*.ucode` | Provides binary microcode for Intel Wireless WiFi adapters (AX200, AX210, 7265, 8260, 9260, 9560, etc.) for general laptop wireless support. | **Active (v0.1)** |

---

## 3. Explicit Hardware Firmware Decisions

### Intel i915 Graphics (Coffee Lake GT2 UHD 630)
- **Decision:** `firmware-misc-nonfree` (Intel i915 GuC/HuC/DMC) is **omitted**.
- **Impact:** Modesetting (KMS) works fully through kernel DRM without non-free blobs, enabling Cage and Chromium on `tty7`. Hardware-accelerated media video decode (HuC/GuC) is disabled; software rendering and CPU video rasterization are utilized for v0.1.

### CPU Microcode Alignment
- **Decision:** `amd64-microcode` is **omitted**.
- **Rationale:** The deployment target hardware runs Intel Core (i3-8100T). Sourcing AMD microcode on an Intel hardware baseline introduces unnecessary artifact bloat and inaccurate inventory tracking.

---

## 4. Free Software Alternatives & Migration Plan

- **Free Firmware Tier:** LibreDroid includes `firmware-linux-free` in the core image for devices that function with fully open, reverse-engineered microcode.
- **v1.0 Roadmap:** Future releases will provide a strictly pure 100% blob-free image variant (`libredroid-libre-x86_64.iso`) with an explicit opt-in flag (`--allow-blobs`) for users requiring proprietary wireless or GPU microcode.
