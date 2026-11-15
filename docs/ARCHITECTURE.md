# LibreDroid OS — Architecture Overview

LibreDroid OS is an independent, non-telemetric, zero-trust operating system designed for bare-metal x86_64 and ARM64 systems.

---

## High-Level Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LibreDroid Shell UI                                │
│       (Wayland Client / Cage / Labwc / Chromium Kiosk / Native Slint)       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ WebSocket / HTTP (:3001) / UNIX Socket
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    Hardware & System Bridge (server.js / lrdd)              │
│       • Power / UPower     • NetworkManager    • PulseAudio / PipeWire      │
│       • Brightness / KMS   • Telemetry Poison  • Sensor Dummy Pipeline      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Kernel Control / systemd-nspawn
┌──────────────────────────────────────▼──────────────────────────────────────┐
│               Kernel Multi-Domain Isolation (Linux Namespaces)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  lrd-vault   │  │  lrd-tor-gw  │  │  lrd-anon-ws │  │   lrd-android   │  │
│  │ (Airgapped)  │  │ (Tor Gateway)│  │ (Tor Routed) │  │  (Waydroid AOSP)│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Syscalls & Hardware Abstraction
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                   Hardened Linux Kernel (KSPP Invariants)                   │
│   • Landlock LSM & Seccomp-BPF Filters        • cgroups v2 Ceilings         │
│   • dm-verity Immutable Root Partition        • fscrypt / LUKS2 Encryption  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Subsystems

### 1. OS Foundation & Lifecycle Strategy (ADR 0004)
- **v0.1 Release Baseline:** Built on **Debian Trixie (`amd64`, snapshot `20251101T000000Z`) + glibc + systemd**. The working userland combines Cage Wayland kiosk, Chromium kiosk, and Node.js (`server.js`) bridging the React UI shell.
- **v1.0 Architecture Target:** Independent **musl libc + dinit supervisor + toybox + native Wayland shell (Slint/Rust)** ecosystem.
- **Blob Tiering:** Essential proprietary microcode and wireless firmware (`intel-microcode`, `firmware-iwlwifi`) are strictly itemized in [`docs/BLOBS.md`](file:///home/nitin/fkgugal/docs/BLOBS.md) and quarantined to passive binary storage.
- **Build Infrastructure:** Full rootfs generation via `mmdebstrap` with verified package integrity, removing reliance on host-provided kernels or ephemeral overlays.

### 2. Multi-Domain Security Architecture
Instead of granting broad system privileges to applications, workloads run in isolated domains:
- **`vault`**: Completely airgapped from network (`lo` interface only). Holds cryptographic keys, passwords, and identity seeds.
- **`tor-gw`**: Transparent Tor proxy routing all outbound TCP/DNS traffic through onion circuits.
- **`anon-ws`**: Anonymous workstation strictly routing network packets through `tor-gw` gateway (10.152.152.10).
- **`work`**: Standard sandboxed domain with isolated subnets and masqueraded NAT egress.
- **`dispos`**: Ephemeral disposable container running atop a volatile tmpfs overlay (`--volatile=overlay`). All filesystem changes evaporate on shutdown.
- **`android`**: Isolated Waydroid container running Android Open Source Project (AOSP) applications without granting access to host kernel filesystems.

### 3. Display Pipeline
- **Modern Hardware**: Direct Wayland DRM/KMS compositor (`labwc` / `cage`) with hardware acceleration (`i915`, `amdgpu`, `nouveau`, `virtio-gpu`).
- **Headless Domain Streaming**: Per-domain `labwc` instances streaming RFB framebuffers over Unix sockets, bridged to local canvas through WebSockets (`wayvnc` + `websockify`).
- **Native Wayland Shell**: Alternative compiled Rust/Slint shell (`lrd-native-shell`) operating under 30MB RSS for memory-constrained appliances.

### 4. Telemetry & Privacy Shield
- **Zero-Trust Sensor Streams**: Injects synthetic camera frames, simulated microphone ambient noise, and spoofed GPS coordinates to prevent hardware fingerprinting.
- **Telemetry Poisoning Engine**: Intercepts tracking requests directed at Firebase, Meta Graph, Adjust, AppsFlyer, and Google Analytics; responds with HTTP 200 OK and randomized high-entropy dummy data.
