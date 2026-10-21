# LibreDroid OS - Sovereign Universal Operating Environment

**LibreDroid OS** is an independent, non-monopolistic universal operating environment designed to run across smartphones, foldables, tablets, and desktops. It eliminates proprietary Big Tech lock-in (zero Google Play Services / tracking dependencies) while maintaining **full compatibility with existing Android APK applications** via a containerized **Waydroid AOSP** runtime.

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
