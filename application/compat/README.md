# Compatibility Execution Tiers (`compat/`)

To succeed Android in production, the platform must allow users to transition without friction. SAP executes legacy software in quarantined, hardware-accelerated micro-containers:

## Subdirectories

- [`android/`](file:///home/nitin/fkgugal/application/compat/android): Hardened Waydroid / AOSP container runtime with microG, ashmem/binder isolation, sensor spoofing, and anti-fingerprint mock APIs.
- [`posix/`](file:///home/nitin/fkgugal/application/compat/posix): Bubblewrap-sandboxed POSIX container running standard desktop Linux CLI and Flatpak GUI applications.
- [`translation/`](file:///home/nitin/fkgugal/application/compat/translation): Fast binary translation bridge (FEX-Emu / Box64) enabling ARM64-only APKs to run at near-native speeds on x86_64 hardware.
- [`web/`](file:///home/nitin/fkgugal/application/compat/web): Sandboxed headless Chromium / WebKit runtime for Progressive Web Apps (PWAs) with strict capability boundaries.
