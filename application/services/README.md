# Sovereign System Services (`services/`)

System services expose hardware capabilities to sandboxed applications through Cap'n Proto typed IPC. Every service runs as an independent unprivileged user process in its own namespace and domain.

## Services Catalog

- [`telephony/`](file:///home/nitin/fkgugal/application/services/telephony): VoLTE / VoNR cellular calling and SMS engine backed by ModemManager / QMI.
- [`audio/`](file:///home/nitin/fkgugal/application/services/audio): PipeWire / ALSA UCM2 hardware audio routing and stream isolation.
- [`camera/`](file:///home/nitin/fkgugal/application/services/camera): Libcamera ISP interface with synthetic privacy dummy injection.
- [`sensors/`](file:///home/nitin/fkgugal/application/services/sensors): Linux IIO hardware sensor bus reader.
- [`connectivity/`](file:///home/nitin/fkgugal/application/services/connectivity): Per-app network policy engine (Tor-only, WireGuard, default-deny nftables).
- [`power/`](file:///home/nitin/fkgugal/application/services/power): S0ix deep sleep governor and mobile wake-lock manager.
- [`storage/`](file:///home/nitin/fkgugal/application/services/storage): Per-app `fscrypt` encrypted vaults and CRDT local synchronization.
- [`identity/`](file:///home/nitin/fkgugal/application/services/identity): W3C DID, hardware passkey manager, and TPM 2.0 key derivation.
- [`notifications/`](file:///home/nitin/fkgugal/application/services/notifications): Decentralized push notification dispatcher (UnifiedPush / Matrix).
