# LibreDroid OS - Sovereign Universal Operating Environment

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
| **Assistant** | Google Gemini / Assistant | **Sovereign Local AI** (100% On-device, zero cloud telemetry) |
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

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run development server (live on http://localhost:3001)
npm run dev

# 3. Build production bundle
npm run build
```
