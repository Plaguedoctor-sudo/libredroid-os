# Subsystem Status & Architectural Coherence Register

This document explicitly defines the operational status, implementation boundaries, and design scope of recent platform interfaces to prevent divergence and false claims.

---

## 1. Android AIDL Interface (`ILibreDroidManager.aidl`)
* **Location:** `os/arm/treble/build-treble-gsi.sh` (`system/framework/libredroid-framework.jar`)
* **Status:** `spec` (Design Artifact / Architectural Specification)
* **Coherence Classification:**
  * FreeStack and LibreDroid core have no in-tree Android Binder driver runtime or `aidl` / `libbinder` build step.
  * `ILibreDroidManager.aidl` serves purely as an interface specification contract defining the sovereign hardware killswitch, PIF spoofing state, and domain query API.
  * It is not compiled by Android IPC tools and must NOT be cited as implemented live Android Binder IPC until an active compiler chain (`COMPONENT=aidl`) is integrated.

---

## 2. MicroVM Hypervisor Orchestrator (`lrd-microvm`)
* **Location:** `os/infra/domain/lrd-microvm`, `os/infra/domain/microvm.conf`
* **Status:** `spec / reference supervisor`
* **Pinned Hypervisor:** `cloud-hypervisor` (Rust-based, virtio-wayland / virtio-fs / virtio-vsock, minimal attack surface)
* **Fallback VMM:** `qemu-system -M microvm`
* **Unprivileged Fallback:** Bubblewrap namespace & Landlock LSM micro-jail supervisor
* **Coherence Classification:**
  * The supervisor coordinates microVM lifecycle for Tier-2 workloads (`vault`, `tor-gateway`).
  * When hardware KVM acceleration (`/dev/kvm`) is present, it targets pinned `cloud-hypervisor`. When absent, it executes an unprivileged Linux namespace/Landlock micro-jail fallback rather than claiming full hardware virtualization.

---

## 3. Android Application Runtime Scope (`LibreDroidLauncher`)
* **Decision:** `UI Shell Only` (Sovereign Linux/Wayland UI)
* **Status:** `implemented`
* **Coherence Classification:**
  * To preserve the zero-blob and non-divergent kernel budget, FreeStack does NOT incorporate an in-tree Bionic libc, libhybris, or ART runtime.
  * `LibreDroidLauncher` is an unprivileged sovereign desktop and mobile UI shell written for Linux/Wayland.
  * Android APK execution is strictly out-of-core and isolated to user-opted Waydroid / LXC container bridges without polluting the base OS kernel or build reproducibility.
