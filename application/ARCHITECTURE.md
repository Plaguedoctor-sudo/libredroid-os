# Sovereign Application Platform (SAP) — Technical Architecture Manifesto

> **Version:** 1.0.0-sovereign  
> **Status:** Canonical Architectural Specification  
> **Target Horizon:** 2026–2040+

---

## 1. Executive Mission & Philosophical Foundations

The **Sovereign Application Platform (SAP)** is engineered from first principles to supersede Android and similar mobile operating system runtimes. It dismantles the legacy paradigm of surveillance-capitalist mobile OSes by establishing five non-negotiable architectural axioms:

1. **Zero Ambient Authority (Pure Object Capabilities):**
   No process possesses any permission merely by existing. A process can only execute actions or access data if it holds an unforgeable cryptographic capability token explicitly passed to it upon verified user intent.
2. **Local-First Sovereign Intelligence:**
   AI inference, context retrieval, semantic vector indexing, and voice intent interpretation occur strictly on-device using local Neural Processing Units (NPUs) and GPUs. Network egress for neural processing is strictly prohibited by default.
3. **Deterministic Bit-for-Bit Reproducibility:**
   Every binary, package, system service, and library must compile deterministically. Given the identical source commit and toolchain container, independent builders produce identical cryptographic hashes down to the byte.
4. **Universal Form Factor Convergence:**
   A single, unified, sub-30MB Wayland compositor seamlessly shifts layout, input modes, window management, and refresh rates across handsets (5.5"–6.7"), foldables (hinge-aware 8"), tablets (11"–14" stylus/pen), and desktop multi-monitor workstations.
5. **Active Defense & Counter-Surveillance:**
   The OS does not merely "block" telemetry; it poisons adversarial tracking networks by injecting high-entropy synthetic data, intercepts predatory subscription renewal loops, and neutralizes deceptive dark patterns at the UI event boundary.

---

## 2. Layered Subsystem Stack

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             USER APPLICATION TIER                                │
│   Native Apps (.sap)  │  Sandboxed WASM Apps  │  Isolated Android APKs (Waydroid) │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ Cap'n Proto Typed RPC (Zero-Copy SHM)
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│                       SOVEREIGN APPLICATION RUNTIME (core/)                      │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐ │
│  │ Capability Engine     │  │ Lifecycle Supervisor  │  │ Multi-Tier Sandbox    │ │
│  │ - Unforgeable Handles │  │ - Created / Active    │  │ - Landlock Filesystem │ │
│  │ - Time-Bounded Leases │  │ - Frozen (0% CPU)     │  │ - Seccomp-BPF Syscall │ │
│  │ - Monotonic Atten.    │  │ - Instant Memory Save │  │ - cgroups v2 Limits   │ │
│  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘ │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│                     SOVEREIGN LOCAL AI SUBSYSTEM (ai/)                           │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐ │
│  │ NPU / Tensor HAL      │  │ Local SLM Engine      │  │ Encrypted Vector RAG  │ │
│  │ - Vulkan Compute      │  │ - Quantized GGUF/SAFE │  │ - On-Device Memory    │ │
│  │ - Direct NPU Kernels  │  │ - 1B–8B Local Models  │  │ - TPM2 Hardware Key   │ │
│  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘ │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│                       CONVERGED WAYLAND SHELL (shell/)                           │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐ │
│  │ Wayland Compositor    │  │ Convergence Engine    │  │ Isolated Layer OSK    │ │
│  │ - Direct KMS/DRM      │  │ - Handset / Foldable  │  │ - Gesture Typing      │ │
│  │ - 120Hz VRR Sync      │  │ - Tablet / Desktop    │  │ - Anti-Keylogger Mem  │ │
│  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘ │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│                     SOVEREIGN SYSTEM SERVICES (services/)                        │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │ Telephony (VoLTE/VoNR) • Audio (PipeWire/UCM2) • Camera (libcamera/privacy) │ │
│  │ Sensors (IIO) • Connectivity (Tor/Default-Deny) • Power (S0ix Standby)      │ │
│  │ Identity (DID/Passkeys) • Storage (fscrypt/CRDT) • Push (UnifiedPush/P2P)   │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│                     HARDENED KERNEL & HARDWARE PLATFORM                          │
│  Linux-Libre (KSPP) • MicroVM Hypervisor • TPM 2.0 PCRs • Modern S0ix Hardware   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Architectural Subsystems Detailed

### 3.1 Object-Capability Security Engine (`core/capability/`)
In Android, permissions are coarse, persistent, and ambient: granting "Location" grants any background thread access to query GPS coordinates indefinitely.
In SAP:
- **Zero Ambient Authority:** A process can invoke zero system calls or IPC methods unless it supplies an unforgeable 256-bit cryptographically verified capability token (`CapHandle`).
- **Monotonic Attenuation:** A process holding a capability to write to directory `/app/data` can attenuate it to read-only for a subprocess, or restrict it to a specific sub-file `/app/data/temp`. Capabilities can never be expanded, only restricted.
- **Time-Bounded Leases:** High-sensitivity capabilities (camera capture, microphone stream, location fix) are granted as ephemeral *leases* (e.g., duration: 3000ms or 1 single frame). Once the lease expires, the kernel IPC router automatically invalidates the handle.

### 3.2 High-Throughput Zero-Copy IPC Bus (`ipc/`)
Android relies on `Binder`, a synchronous character-device IPC that forces high context-switch overhead and memory copying across user/kernel boundaries.
In SAP:
- **Shared-Memory Ring Buffers (`ipc/transport/ring_buffer.rs`):** High-volume data streams (video frames, audio buffers, tensor weights, display subsurfaces) are passed across processes via memory-mapped ring buffers with lock-free atomic head/tail pointers.
- **Typed Cap'n Proto Protocols (`ipc/schemas/*.capnp`):** Messages have zero-serialization overhead. Bit layouts in memory match the wire format exactly.
- **Micro-Daemon Router (`ipc/router/`):** A lightweight Rust daemon validates capability tokens at connection initiation, then steps out of the data path, allowing direct shared-memory IPC.

### 3.3 Sovereign Local Intelligence & Neuromorphic Subsystem (`ai/`)
Modern mobile devices are equipped with powerful NPUs (Neural Processing Units) capable of 10–50 TOPS. Android largely ignores these for system architecture, offloading AI to Google Cloud.
In SAP:
- **Hardware NPU HAL (`ai/npu-hal/`):** Unified hardware abstraction interfacing directly with Qualcomm Hexagon/NPU, MediaTek APU/NeuroPilot, Apple Neural Engine (via Darwin bridge), and standard Vulkan Compute tensors.
- **Local Model Runner (`ai/inference/`):** Highly optimized INT4/INT8 quantized model executor supporting state-of-the-art small language models (Phi-4-mini, Llama-3.2-1B/3B, Gemma-2-2B) purely locally.
- **Private Vector Context (`ai/context/`):** Local episodic memory encrypted with TPM 2.0 hardware-sealed keys. Stores user preferences, semantic conversation history, and file contents without transmitting a single byte over the Internet.
- **Deterministic Intent-to-Capability Compiler (`ai/intent/`):** Natural language queries ("Dim screen to 30% and mute incoming notifications for 2 hours") are parsed deterministically into formal Cap'n Proto capability invocations.

### 3.4 Converged Wayland Shell (`shell/`)
Rather than maintaining separate OS variants for phones, tablets, and desktops:
- **Dynamic Posture Engine (`shell/convergence/`):**
  - **Handset:** Bottom-anchored gesture pills, edge-swipe back gestures, one-handed reachability transforms.
  - **Foldable:** Hinge angle sensing (0° closed, 90° tent/laptop, 180° open). Automatically splits UI into dual-column panes or relocates keyboard to bottom half.
  - **Tablet:** Multi-app split screen, floating picture-in-picture, stylus digitizer with hardware palm rejection and low-latency pencil ink paths.
  - **Desktop:** Floating resizable windows, snapping tiling manager, system status dock, multi-monitor external display output with independent DPI scaling.
- **Isolated Layer-Shell OSK (`shell/osk/`):** The virtual keyboard runs in an isolated Wayland layer-surface. Applications never see keystroke timings or raw input streams; they only receive committed text tokens via the capability input protocol.

### 3.5 Sovereign Application Package Format (`.sap`) (`packaging/`)
Android APKs rely on centralized Google Play signing keys and zip-based structures that allow bytecode tampering and non-reproducible builds.
In SAP:
- **Content-Addressed Deterministic Archive:** The `.sap` container uses deterministic tar/zstd compression where file timestamps are normalized to Unix epoch 0.
- **Hardware-Anchored Multi-Sig:** Packages are signed with Ed25519 or post-quantum Dilithium keys. System updates require 3-of-5 threshold signatures from trusted governance keys.
- **Immutable dm-verity Runtime:** Installed application bundles are mounted as read-only cryptographic squashfs images backed by kernel `dm-verity`. Any attempt to tamper with code blocks results in an instant kernel I/O fault.
- **Reproducible SBOM:** Every package embeds a machine-readable Software Bill of Materials (SPDX 3.0 / CycloneDX) verifying every library dependency down to its git commit and content hash.

---

## 4. Hardware Support Strategy

| Tier | Architectures | Target Devices | Verification Mechanism |
|:---|:---|:---|:---|
| **Tier 1 (Mainline / x86_64)** | x86_64, AMD64 | Modern UEFI laptops, Mini-PCs, QEMU KVM | Automated CI, bit-for-bit diffoscope gate |
| **Tier 1 (Mainline / ARM64)** | aarch64 | PinePhone Pro, MNT Reform, Raspberry Pi 5 | Native cross-compilation, automated QEMU runner |
| **Tier 2 (Android Vendor BSP)** | aarch64 | OnePlus Pad Go, MT6789, Qualcomm SM8450 | Waydroid/Halium containerization with libhybris |
| **Tier 3 (RISC-V Next-Gen)** | riscv64 | SiFive HiFive, Milk-V Oasis | Experimental cross-toolchain in `freestack/` |
