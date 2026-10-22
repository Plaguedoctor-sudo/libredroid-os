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

Every application window features a dynamic **Domain Migration Badge** allowing users to switch the execution domain of any active app on the fly.

---

## 🔒 35-Year Linux Evolution Safety Stack

LibreDroid activates every modern Linux security primitive at the kernel and userland boundary:

- **Linux Namespaces (7-layer separation)**: Mount (`mnt`), Process ID (`pid`), Network (`net`), IPC (`ipc`), UTS hostname (`uts`), User ID (`user`), and Control Groups (`cgroup`).
- **cgroups v2 Resource Hierarchy**: Dynamic enforcement of strict memory ceilings, CPU shares, I/O burst throttling, and PID limit controls to stop fork bombs and crypto-jacking.
- **Seccomp-BPF System Call Filtering**: Whitelist-based BPF bytecode filtering that denies high-risk syscalls (`ptrace`, `kexec_load`, `process_vm_writev`) while auditing standard execution.
- **Landlock LSM (Linux Security Module)**: Unprivileged filesystem sandboxing that restricts applications to read-only access for core libraries and read-write strictly to sandboxed application paths.
- **XDG Desktop Portals**: Eliminates unrestricted device access; audio, camera, screen-cast, and file access require explicit portal broker handshakes.

---

## 🛑 OS-Level Anti-Predatory Shield & Dark Pattern Interceptor

LibreDroid protects users from deceptive application designs, hidden costs, and predatory monetization:

- **Dark Pattern Interceptor**: Real-time heuristic scanning of app views to detect disguised ads, countdown timers, forced continuity traps, and bait-and-switch consent prompts.
- **1-Click Subscription Killer**: Instant revocation and blocking of deceptive recurring payment authorizations directly at the OS kernel boundary.
- **Recurring Fee Tracker**: Audits all active background subscriptions, calculates annualized costs, and alerts users before free trials convert into recurring charges.

---

## ⚙️ Hardware HAL & Real-Time Adaptation Engine

LibreDroid inspects underlying hardware dynamically and adjusts operating parameters across three performance tiers:

- **Ultra Low-End Tier (<= 2GB RAM / 2 Cores)**: Disables blur effects, enables aggressive memory swapping, restricts background daemon allocations, and lowers compositor refresh rate.
- **Balanced Standard Tier (4-8GB RAM / 4-8 Cores)**: Standard fluid animations, balanced cgroup limits, and automatic background service hibernation.
- **Flagship / Desktop Pro Tier (>= 16GB RAM / Multi-Core)**: Full Wayland hardware acceleration, multi-monitor window management, unthrottled CPU scheduling, and multi-domain hypervisor concurrent virtualization.

---

## ⚡ Running Existing Android Apps (.APK)

LibreDroid incorporates a dedicated **APK Installer & Waydroid Runner** (`src/services/apkManager.ts` & `src/components/apps/ApkInstallerApp.tsx`):
- **Sideload Any APK**: Upload or drag-and-drop any `.apk` package file.
- **Manifest Parsing**: Automatically verifies package names, versions, and permissions (`android.permission.*`).
- **Waydroid Sandbox Execution**: Runs the app inside an isolated LXC container without requiring proprietary Google Play Services.
- **Pre-Bundled FOSS APKs**: Includes ready-to-launch popular open-source apps:
  - **VLC Media Player** (`org.videolan.vlc`)
  - **NewPipe** (`org.schabi.newpipe`)
  - **OsmAnd Maps** (`net.osmand.plus`)
  - **Element Matrix Messenger** (`im.vector.app`)
  - **K-9 Mail / Thunderbird** (`com.fsck.k9`)

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
