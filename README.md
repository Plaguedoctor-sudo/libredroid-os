# LibreDroid OS - Sovereign Operating Environment

> [!IMPORTANT]
> Development status: Under active development.

[![License: GPL-3.0](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

LibreDroid OS is an independent, non-monopolistic operating environment for x86_64 systems. It eliminates proprietary Big Tech lock-in (zero Google Play Services, zero remote tracking dependencies) while providing an intuitive unified interface backed by a hardened Linux security stack, containerized Waydroid AOSP runtime, and a domain-isolated application matrix.

---

## What this runs on

x86_64 laptops and tablets with UEFI or BIOS boot.

Android phones require an arm64 `boot.img`, a device tree, and a mainline or Halium kernel. See `devices/README.md`.

---

## What it can do

- **Sovereign x86_64 desktop and tablet operating environment**:
  - Cage and Labwc Wayland compositors running Chromium kiosk shell on Ozone-Wayland over KMS/DRM framebuffer.
  - Loopback hardware system bridge (`server.js`) interfacing with UPower battery statistics, NetworkManager Wi-Fi/Ethernet connectivity, systemd units, and display brightness via `brightnessctl`.
- **Android application compatibility**:
  - Containerized Waydroid LXC Android runtime backed by Linux kernel `binder_linux` and `ashmem_linux`.
  - Executes open-source Android applications installed via F-Droid, Aurora Store, or direct APK sideloading.
- **Qubes-inspired multi-domain isolation matrix**:
  - Isolates application workloads across security domains:
    - `lrd-vault`: Air-gapped Linux loopback namespace (`netns`) and Landlock sandbox for cryptographic credentials.
    - `lrd-tor-gw`: Traffic routed exclusively through Tor onion circuits (Guard -> Middle -> Exit).
    - `lrd-android`: Hardened Android Open Source Project container runtime.
    - `lrd-disposable`: Ephemeral RAM-disk domain with zero persistent storage wiped immediately upon window close.
    - `lrd-work`: General POSIX workspace equipped with developer toolchains and Landlock filesystem boundaries.
- **Live installer and disk provisioning**:
  - Dual UEFI / BIOS live bootable ISO with SquashFS root filesystem.
  - Automated NVMe/SATA drive partitioner supporting optional LUKS2 full-disk encryption.
- **Privacy and anti-tracking defense stack**:
  - Ephemeral clipboard shredder cryptographically wiping clipboard buffers after 30 seconds or context switch.
  - Per-probe MAC address randomization on every Wi-Fi network probe and association.
  - Synthetic dummy streams providing white noise to microphones and pitch-black frames to cameras when denied.
  - Telemetry interception returning synthetic dummy responses to commercial analytics domains (`app-measurement.com`, `graph.facebook.com`).
- **Android parasite mode**:
  - Runs sovereign services and PRoot container workspaces on unrooted Android devices via Termux and runit daemons.

---

## What it cannot do

- **Does not run natively on arbitrary ARM64 phones without device-specific porting**: Installation on mobile phones requires a device-specific arm64 `boot.img`, hardware device tree, and mainline/Halium kernel adaptation.
- **Does not provide native execution of proprietary iOS/macOS Mach-O binaries**: The Apple Darwin CocoaTouch sideloading interface is currently an interactive UI prototype and concept demonstration; full binary translation of arbitrary App Store binaries is not supported.
- **Does not provide formal mathematical proofs via seL4 microkernel**: While seL4 passthrough is an architectural roadmap objective, current domain isolation is enforced via Linux kernel namespaces (`netns`, `mnt`, `pid`), cgroups v2, and nftables.
- **Does not bypass hardware-backed Play Integrity on untrusted hardware**: Emulating `MEETS_STRONG_INTEGRITY` requires valid hardware-backed keybox certificates and cannot bypass cryptographic attestation on blacklisted hardware.
- **5G Rel-17 is a virtual simulated protocol adapter**: The 5G network subsystem provides virtual cellular telemetry and QoS slicing simulation for testing; it does not replace a physical cellular RF modem or provide cellular network access on Wi-Fi-only hardware without an external modem.

---

## Architecture and implementation status

| Tier | Component | Implementation status | Technical mechanism |
| :--- | :--- | :--- | :--- |
| **Bare-Metal Linux** | **Kiosk session and shell** | Production implemented | Cage / Labwc Wayland compositor running Chromium kiosk on Ozone-Wayland over KMS/DRM. |
| **Bare-Metal Linux** | **Hardware system bridge** | Production implemented | Loopback Node.js bridge (`server.js`) interfacing with UPower, NetworkManager, systemd, and brightnessctl. |
| **Bare-Metal Linux** | **Domain security matrix** | Production implemented | Kernel namespaces (`netns`, `mnt`, `pid`), cgroups v2 resource ceilings, and nftables routing (`lrd-tor-gw`). |
| **Bare-Metal Linux** | **Android app compatibility** | Production implemented | Waydroid LXC container runtime backed by kernel `binder_linux` and `ashmem_linux`. |
| **Bare-Metal Linux** | **Live OS installer** | Production implemented | Dual UEFI / BIOS live ISO with SquashFS rootfs, NVMe/SATA partitioner, and optional LUKS2 disk encryption. |
| **Android Parasite** | **Non-rooted Android mode** | Production implemented | Termux runit daemons, PRoot containers, and ADB debloating utilities. |
| **UI Demonstration** | **Apple Darwin / CocoaTouch** | UI prototype and concept | Sideloading workflow and catalog simulated in frontend application state. |
| **UI Demonstration** | **seL4 verified vault** | UI prototype and concept | Enforced via isolated Linux `netns` loopback-only namespaces; seL4 microkernel is a roadmap target. |
| **UI Demonstration** | **5G Rel-17 and strong integrity** | Simulated protocol | Virtual network adapter and Play Integrity profiles for interface testing. |

---

## Independence from proprietary services

| Component | Proprietary monopoly default | LibreDroid sovereign replacement |
| :--- | :--- | :--- |
| **App repository** | Google Play Store | F-Droid Store (verified free and open-source APKs) |
| **Search engine** | Google Search | DuckDuckGo / SearXNG (zero tracking) |
| **Browser** | Google Chrome | Chromium FOSS with ad/tracker blocking |
| **Services core** | Google Play Services (GmsCore) | microG (free software implementation) |
| **Cloud storage** | Google Drive | Nextcloud Hub / local self-hosted mesh |
| **Photo backup** | Google Photos | Immich / Fossify Gallery (local machine vision) |
| **Notes and sync** | Google Keep | Joplin Notes (end-to-end encrypted) |
| **Maps and navigation** | Google Maps | OsmAnd (OpenStreetMap offline vector maps) |
| **Push notifications** | Google FCM | UnifiedPush (decentralized distributors) |

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Run development server (live on http://localhost:5173)
npm run dev

# 3. Build production bundle
npm run build
```

---

## License

Distributed under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE).
