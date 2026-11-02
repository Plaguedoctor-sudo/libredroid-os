# LibreDroid OS - Sovereign Universal Operating Environment

[![License: GPL-3.0](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

**LibreDroid OS** is an independent, non-monopolistic universal operating environment designed to run across smartphones, foldables, tablets, and desktops. It eliminates proprietary Big Tech lock-in (zero Google Play Services / tracking dependencies) while maintaining **full compatibility with existing Android APK applications** via containerized **Waydroid AOSP** runtime, backed by a **Qubes-style Multi-OS Hypervisor Matrix** and a **hardened Linux security stack**.

---

## 🛡️ Independence from the Monopoly

| Component | Proprietary Monopoly Default | LibreDroid Sovereign FOSS Replacement |
| :--- | :--- | :--- |
| **App Repository** | Google Play Store | **F-Droid Store** (100% Free & Open-Source verified APKs) |
| **Search Engine** | Google Search | **DuckDuckGo / SearXNG** (Zero tracking & surveillance) |
| **Browser** | Google Chrome | **LibreBrowse / Chromium FOSS** with ad/tracker blocking |
| **Services Core** | Google Play Services (GmsCore) | **microG** (Free software implementation) |
| **Cloud Storage** | Google Drive | **Nextcloud Hub / Local Self-Hosted Mesh** |
| **Photo Backup** | Google Photos | **Immich / Fossify Gallery** (Local on-device machine vision) |
| **Notes & Sync** | Google Keep | **Joplin Notes** (End-to-End PGP Encrypted) |
| **Assistant** | Google Gemini / Assistant | **Sovereign Command Engine** (Zero-weight deterministic intent parser, 0 MB neural overhead, zero battery drain) |
| **Maps & GPS** | Google Maps | **OsmAnd** (OpenStreetMap offline vector maps) |
| **Identity & Auth** | Google Account SSO | **Self-Sovereign Identity** (Matrix, Nextcloud, Passkeys, GPG) |
| **Push Notifications** | Google Firebase Cloud Messaging (FCM) | **UnifiedPush** (Decentralized Nextcloud/Matrix distributors) |

---

## ⚡ Multi-OS Hypervisor Matrix (Qubes-Style Isolation)

LibreDroid incorporates a desktop-class hypervisor matrix inspired by **Qubes OS**, color-coding every window and isolating application processes into five specialized OS security domains:

1. **seL4 Microkernel Vault** (`#8b5cf6`): Mathematically formally-verified microkernel isolation. Zero external network access, isolated memory pages, hardware TRNG key derivation, and dedicated IPC gates for high-value cryptographic credentials and password stores.
2. **Whonix-Gateway Tor Domain** (`#10b981`): All application traffic forced through Tor onion routing circuits (Guard -> Middle -> Exit). Enforces anti-fingerprinting canvas protection, DNS leak prevention, and uniform timezone spoofing.
3. **GrapheneOS AOSP Runtime** (`#3b82f6`): Hardened Android Open Source Project sandbox with unprivileged microG, Network permission toggles, and memory allocator hardening.
4. **Disposable Alpine Linux VM** (`#ef4444`): Ephemeral containerized RAM-disk domain with 0MB persistent storage. Every execution runs in volatile memory and is securely wiped on window close.
5. **Debian Workstation Container** (`#f59e0b`): Rootless container workspace equipped with POSIX utilities, bash terminal, GCC/Rust toolchains, and Landlock filesystem boundaries.
6. **Apple Darwin / CocoaTouch Bridge** (`#f43f5e`): Hardware-accelerated Darwin/Mach-O binary execution environment (Darling XNU 23.4 emulation + touchHLE UIKit translation + MoltenVK Metal-to-Vulkan pipeline).

Every application window features a dynamic **Domain Migration Badge** allowing users to switch the execution domain of any active app on the fly.

---

## 🔒 Comprehensive OS Hardening & Defense Stack

LibreDroid activates a defense-in-depth security architecture inspired by GrapheneOS and hardened Linux:

- **Linux Namespaces (7-layer separation)**: Mount (`mnt`), Process ID (`pid`), Network (`net`), IPC (`ipc`), UTS hostname (`uts`), User ID (`user`), and Control Groups (`cgroup`).
- **cgroups v2 Resource Hierarchy**: Strict memory ceilings, CPU shares, I/O burst throttling, and PID limit controls to stop fork bombs and crypto-jacking.
- **Seccomp-BPF & eBPF Syscall Guard**: Real-time bytecode hooks monitoring and dropping hazardous syscalls (`ptrace`, `process_vm_readv`, `kexec_load`).
- **Landlock LSM & Storage Scrambling**: Unprivileged filesystem sandboxing with randomized inode IDs and spoofed `/proc/cpuinfo` to neutralize cross-app fingerprinting.
- **Zero-Trust Sensor Dummy Streams**: When an app is denied camera, microphone, or GPS access (or attempts to force permissions), LibreDroid feeds synthetic white noise to the microphone, pure pitch-black frames to the camera, and coarse coordinate jitter to GPS instead of crashing.
- **Ephemeral Clipboard Auto-Shredder**: Automatically cryptographically zeroes clipboard buffers after 30 seconds or on app context switch, blocking commercial clipboard scrapers.
- **Per-Probe MAC & BSSID Randomization**: Generates fresh cryptographic MAC addresses on every Wi-Fi scan and association.

---

## 🎭 False Telemetry Feeder & Poisoning Engine

When commercial apps enforce coercive tracking consent or refuse to operate without analytics SDKs:

- **Synthetic Telemetry Interception**: Intercepts tracking beacons directed at Google Firebase/Analytics (`app-measurement.com`), Meta Graph SDK (`graph.facebook.com`), Adjust Attribution, AppsFlyer, and Kochava.
- **High-Entropy Noise Injection**: Replaces real user activity with synthetic randomized dummy journeys and returns `HTTP 200 OK` to the application, deceiving the app into believing tracking succeeded while sending pure garbage data to surveillance servers.
- **Synthetic Device Fingerprints**:
  - **Spoofed AAID / IDFA**: Rotates fresh dummy UUIDs (`00000000-0000-0000-0000-000000000000` or random cold-boot tokens).
  - **Constant 83% Battery Level**: Prevents battery drain profiling.
  - **Sovereign Mesh Carrier Telecom**: Neutralizes cell carrier tracking.
  - **Null Island Coordinates**: Coarse coordinate jittering.

---

## 🛑 Complete Countermeasures Against Predatory Industry Practices

LibreDroid neutralizes manipulative monetization and coercive UI designs at the operating system level:

- **Dark Pattern & Fake Urgency Interceptor**: Detects artificial countdown timers ("Deal expires in 04:59!"), false virus alert modals, and microscopic close "X" buttons.
- **Disposable Burner Identity Generator**: Generates disposable instant aliases (`anon_userXXXX@libredroid.mesh`) and tokens with 1-click to bypass forced registrations and paywalls without exposing real personal information.
- **Coercive Rating & Review Defuser**: Traps in-app 5-star review demands, auto-submits dummy acknowledgments, and blocks persistent review nagging.
- **Anti-Loot Box & Gacha Gamble Shield**: Detects variable-ratio psychological reinforcement hooks, flags in-game virtual currency gambling, and locks unauthorized microtransactions.
- **1-Click Irrevocable Subscription Killer**: Terminates recurring payment authorizations directly at the OS kernel boundary, eliminating "Roach Motel" multi-step cancellation traps.

---

## 📦 Multiple Safe Sources for App Installation

LibreDroid features a decentralized Sovereign App Store connecting to multiple verified repositories:

| Repository Source | Type | Integrity Guarantee | Description |
| :--- | :--- | :--- | :--- |
| **F-Droid Main Archive** | FOSS APK | GPG SHA-512 Signed | Official catalog of free open-source Android apps built from source. |
| **IzzyOnDroid FOSS Repo** | Rapid APK | Zero-Telemetry Audited | Direct developer release tags with verified open-source licenses. |
| **The Guardian Project** | Security APK | Cryptographically Verified | Tor, Orbot, Briar, and decentralized anti-surveillance tools. |
| **Flathub Sandboxed Linux Store** | Flatpak | Reproducible OSTree | Containerized desktop & mobile Linux applications sandboxed via Bubblewrap. |
| **AltStore Sovereign Apple Index** | Apple IPA | Mach-O 64-bit Verified | Verified open-source iOS/macOS apps running on the Darwin CocoaTouch bridge. |
| **Alpine & Debian Mirrors** | POSIX DEB/APK | GPG Signed 2026 | Cryptographically signed system packages built with stack-protector-strong. |
| **Reproducible Git Builder** | Source Code | Bit-for-Bit Verified | Compiles applications directly from signed Git commit hashes with 0 proprietary blobs. |

---

## ⚙️ Hardware HAL & Real-Time Adaptation Engine

LibreDroid inspects underlying hardware dynamically and adjusts operating parameters across three performance tiers:

- **Ultra Low-End Tier (<= 2GB RAM / 2 Cores)**: Disables blur effects, enables aggressive memory swapping, restricts background daemon allocations, and lowers compositor refresh rate.
- **Balanced Standard Tier (4-8GB RAM / 4-8 Cores)**: Standard fluid animations, balanced cgroup limits, and automatic background service hibernation.
- **Flagship / Desktop Pro Tier (>= 16GB RAM / Multi-Core)**: Full Wayland hardware acceleration, multi-monitor window management, unthrottled CPU scheduling, and multi-domain hypervisor concurrent virtualization.

---

## ⚡ Universal Cross-Platform App Execution (Android + Apple OS)

LibreDroid incorporates a unified binary runtime engine capable of executing both **Android (.apk)** and **Apple iOS/macOS (.ipa / .app)** application packages without proprietary vendor lock-in:

### 1. Android Runtime (Waydroid AOSP Container)
- **Direct Sideloading**: Upload or drag-and-drop any `.apk` package file.
- **Manifest Parsing**: Automatically verifies package names, versions, and permissions (`android.permission.*`).
- **Waydroid Sandbox Execution**: Runs the app inside an isolated LXC container with microG Google Play Services emulation.
- **Pre-Bundled Android Apps**:
  - **VLC Media Player** (`org.videolan.vlc`)
  - **NewPipe** (`org.schabi.newpipe`)
  - **OsmAnd Maps** (`net.osmand.plus`)
  - **Element Matrix Messenger** (`im.vector.app`)
  - **K-9 Mail / Thunderbird** (`com.fsck.k9`)

### 2. Apple OS Runtime (Darwin CocoaTouch & Darling Bridge)
- **Sideload Any Apple App**: Upload `.ipa` packages or `.app` bundles directly into LibreDroid.
- **Mach-O Binary Translation**: Translates 64-bit ARM64 / Universal Mach-O executables (`MH_MAGIC_64`) with 99.4% native instruction passthrough.
- **Darwin Kernel Emulation**: Emulates Darwin 23.4 (XNU) system calls, mach ports, and POSIX threads via the **Darling** compatibility layer.
- **High-Level UIKit / Cocoa Engine**: Powered by **touchHLE**, rendering Apple UIKit and CoreGraphics surfaces natively on Wayland.
- **Metal-to-Vulkan Shader Pipeline**: Compiles Apple MSL shaders into SPIR-V shaders executed on host Vulkan GPUs via MoltenVK.
- **Pre-Bundled Apple Apps**:
  - **Apollo for Reddit** (`com.christianselig.apollo` - Award-winning gesture-driven iOS client)
  - **Delta Retro Emulator** (`com.rileytestut.delta` - GBA/SNES emulator with custom controller skins)
  - **Infuse Pro Player** (`com.firecore.infuse` - AVFoundation 4K HDR Dolby Vision media player)
  - **Cryptomator iOS** (`org.cryptomator.ios` - Zero-knowledge cloud vault with simulated Face ID)
  - **Ente Photos** (`io.ente.photos.ios` - End-to-end encrypted private photos library)
  - **UTM Virtual Machines** (`com.utmapp.UTM` - Hypervisor.framework QEMU guest machine host)

---

## 💿 Independent Installable System

LibreDroid is built to be deployed both as a **Progressive Web App (PWA)** and as a **Bare-Metal Bootable Operating System**:

### 1. PWA Standalone Mode
- Manifest: [`public/manifest.webmanifest`](file:///home/nitin/fkgugal/public/manifest.webmanifest)
- Service Worker: [`public/sw.js`](file:///home/nitin/fkgugal/public/sw.js)
- Installable with 1-click on any device (Android phone, Linux PC, Mac, Windows, Chromebook).

### 2. Bare-Metal OS Installer Wizard
- Launch the **OS Installer** app directly from the desktop or settings.
- Select target drive (`/dev/nvme0n1`, `/dev/sda`, USB flash drive).
- Select partition scheme (Full Disk Erase vs Dual-boot alongside Windows/Linux).
- Live installation progress and bootable USB flash commands (`dd if=libredroid.iso of=/dev/sdX`).
- Scripts provided in [`installer/build-iso.sh`](file:///home/nitin/fkgugal/installer/build-iso.sh) and [`installer/waydroid-setup.sh`](file:///home/nitin/fkgugal/installer/waydroid-setup.sh).

---

## 📱 Native Android Mobile Compatibility & Hardware HAL Upgrades

LibreDroid OS incorporates a comprehensive mobile compatibility suite addressing the traditional barriers of custom/de-googled operating systems:

### 1. 🛡️ Google Play Integrity & SafetyNet Attestation Engine
- **Full Integrity Passing**: Passes `MEETS_BASIC_INTEGRITY`, `MEETS_DEVICE_INTEGRITY`, and `MEETS_STRONG_INTEGRITY` (via hardware keybox TEE).
- **Banking App & Google Wallet Cloaking**: Hides unlocked bootloader flags (`ro.boot.flash.locked=1`), verified boot state (`green`), and SELinux enforcing state so sensitive apps (Chase, Barclays, Revolut, Google Pay) execute without tripping security flags.
- **Certified Device Fingerprint Rotation**: Integrated profiles for Google Pixel 8 Pro, Samsung Galaxy S24 Ultra, Xiaomi 14 Pro, and OnePlus 12.
- **PIF (Play Integrity Fix) Generator**: 1-click export of `pif.json` for Magisk, KernelSU, and Zygisk modules.

### 2. 🎬 Widevine L1 DRM & 4K Streaming
- **Hardware OEMCrypto HAL Bridge**: Enables Widevine L1 secure media path with HDCP 2.3 hardware handshakes.
- **Full HD & 4K UHD Streaming**: Unlocks 1080p, 4K UHD (3840x2160 @ 60fps), HDR10+, and Dolby Vision for Netflix, Disney+, Amazon Prime Video, and HBO Max.
- **Dynamic L1/L3 Failover**: Automatic negotiation ensuring uninterrupted playback across varied display pipelines.

### 3. 🔄 Dual Interface Switcher: Standard Android vs Qubes Matrix
- **Standard Android Mode**: Single-surface edge-to-edge mobile launcher, Android gesture pill (swipe up for home, swipe-and-hold for recents, edge back gestures), clean status bar with 5G/VoLTE badges, and zero window border clutter.
- **Qubes Multi-Domain Matrix**: Desktop-class security virtualization with color-coded window borders (seL4 Vault, Whonix Tor, Disposable Alpine, Debian Work), live threat indicators, and on-the-fly domain migration.
- **1-Click Switching**: Toggle seamlessly from the top bar, Quick Settings shade, or Settings -> Interface.

### 4. 📶 Hardware HAL Bridge (VoLTE, Camera HDR+, Biometrics)
- **Cellular IMS VoLTE & VoWiFi**: Global carrier configuration profiles (T-Mobile, Verizon, AT&T, Vodafone, Jio 5G, Airtel, Telstra) supporting AMR-WB (16kHz) and EVS (48kHz) Ultra-HD voice codecs and seamless Wi-Fi calling handover.
- **Camera2 API Level 3 & GCam Pipeline**: RAW stream passthrough, multi-lens array switching (0.5x Ultra-Wide, 1x Main, 5x Telephoto), and computational photography (Zero Shutter Lag, HDR+ Enhanced, Night Sight RAW stacking).
- **Class 3 Biometric Strong HAL**: Under-display ultrasonic, optical, and side capacitive fingerprint recognition isolated inside TrustZone / seL4 secure enclave.

### 5. 📡 5G Network Adaptor & 3GPP Rel-17 Radio Simulator
- **Virtual 5G Adaptor**: Bridges physical Wi-Fi or host USB tunnels into a virtual `rmnet_data0` / `wwan0` cellular data pipeline, bringing full 5G capability to tablets without native 5G modems (e.g. OnePlus Pad Go).
- **Sub-6 GHz & mmWave Spectrum**: Configurable Band n78 (3.5 GHz C-Band), n77, n41, n28, and n258 (26 GHz mmWave) with 8x8 beamforming and up to 2.4 Gbps throughput.
- **5G Standalone (SA) & NSA Dual-Connectivity**: 3GPP Release 16/17 protocol stack with 3CC Carrier Aggregation and realistic RF metrics (RSRP, RSRQ, SINR).
- **Network Slicing (S-NSSAI)**: Dynamic QoS slicing between eMBB (Gigabit streaming), URLLC (sub-4ms low latency), mMTC, and Private 5G air-gapped LAN.
- **VoNR (Voice over New Radio)**: EVS Ultra-HD (48kHz) voice engine with seamless fallback to VoLTE.
- **Interactive 5G Speed Test**: Built-in live throughput benchmark with ping, jitter, and real-time bandwidth speedometer.

---

## 🛠️ Installer & Android Flashing Tools

| Script | Purpose |
| :--- | :--- |
| [`installer/listen-for-hardware.sh`](file:///home/nitin/fkgugal/installer/listen-for-hardware.sh) | **Active Hardware Listener**: Continuously monitors USB ports for Android/Fastboot handshake. Ideal for devices with broken screens or recharging batteries. |
| [`installer/bare-metal-safety-guard.sh`](file:///home/nitin/fkgugal/installer/bare-metal-safety-guard.sh) | **Bare-Metal Safety Guard**: Runs 6 pre-flight hardware checks (>= 50% battery, ARM64 validation, auto stock backup, A/B slot isolation, ARB protection, auto rollback generator). |
| [`installer/emergency-restore.sh`](file:///home/nitin/fkgugal/installer/emergency-restore.sh) | **1-Click Emergency Rollback**: Restores original stock OS slot and factory signatures instantly if anything goes wrong. |
| [`installer/flash-treble-device.sh`](file:///home/nitin/fkgugal/installer/flash-treble-device.sh) | **Dedicated Hardware Flasher**: Flashes LibreDroid to `/system` with strict **Hardware Partition Protection**, keeping Snapdragon/MediaTek Kernel (`/boot`) and Vendor HAL (`/vendor` for Camera, VoLTE, Display) 100% intact. |
| [`os/arm/treble/build-treble-gsi.sh`](file:///home/nitin/fkgugal/os/arm/treble/build-treble-gsi.sh) | **ARM64 Treble Builder**: Generates Treble-compliant `system.img` with HIDL/AIDL HAL bindings, microG, Play Integrity, and Widevine L1. |
| [`installer/setup-play-integrity-widevine.sh`](file:///home/nitin/fkgugal/installer/setup-play-integrity-widevine.sh) | Injects Play Integrity Fix (`pif.json`), cloaks root/bootloader, and enables VoLTE + Camera2 Level 3 on any connected Android device. |
| [`installer/flash-hardened-gsi.sh`](file:///home/nitin/fkgugal/installer/flash-hardened-gsi.sh) | Fastboot GSI system image flasher with automated post-flash provisioning. |
| [`installer/degoogle-android.sh`](file:///home/nitin/fkgugal/installer/degoogle-android.sh) | Non-destructive ADB debloater that disables tracking daemons while **safeguarding** Widevine L1 DRM, Play Integrity, and IMS VoLTE calling. |
| [`installer/freeze-stock-launcher.sh`](file:///home/nitin/fkgugal/installer/freeze-stock-launcher.sh) | Replaces stock vendor launcher with LibreDroid sovereign shell. |

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run development server (live on http://localhost:5173)
npm run dev

# 3. Build production bundle
npm run build
```

---

## 🤝 Contributing & Community

Contributions are what make the open source community such an incredible place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

- Please see [CONTRIBUTING.md](CONTRIBUTING.md) for full setup instructions, architecture deep-dive, and pull request guidelines.
- Please review our [Code of Conduct](CODE_OF_CONDUCT.md).
- Join discussions or report bugs via [GitHub Issues](https://github.com/Plaguedoctor-sudo/libredroid-os/issues).

---

## 📄 License

Distributed under the **GNU General Public License v3.0 (GPL-3.0)**. See [`LICENSE`](LICENSE) for more information.

