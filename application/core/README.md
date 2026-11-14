# SAP Core Runtime Subsystem (`core/`)

The Core Runtime is the low-latency, memory-safe foundation of the Sovereign Application Platform. It executes beneath applications and replaces the Android Runtime (ART), Bionic libc hacks, and Zygote process forkers.

## Modules

- [`capability/`](file:///home/nitin/fkgugal/application/core/capability): Pure object-capability security engine. Creates, signs, attenuates, and verifies cryptographic capability tokens (`CapHandle`).
- [`lifecycle/`](file:///home/nitin/fkgugal/application/core/lifecycle): Application supervisor managing transitions (`Created`, `Active`, `Frozen`, `Destroyed`). Enforces zero CPU usage when backgrounded via kernel cgroup freezers.
- [`memory/`](file:///home/nitin/fkgugal/application/core/memory): Memory management, hardened allocator wrapper, and proactive Pressure Stall Information (PSI) out-of-memory avoidance.
- [`sandbox/`](file:///home/nitin/fkgugal/application/core/sandbox): Deep kernel confinement combining Linux namespaces, Landlock LSM filesystem sandboxing, and Seccomp-BPF dynamic syscall filters.
