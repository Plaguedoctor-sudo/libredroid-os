# Typed Capability IPC Fabric (`ipc/`)

Replaces Android's synchronous `Binder` IPC driver. The Sovereign Application Platform uses a two-tier IPC fabric:
1. **Control Plane:** Typed, zero-serialization Cap'n Proto RPC messages over Unix domain stream sockets with peer credentials (`SO_PEERCRED`).
2. **Data Plane:** Lock-free, zero-copy shared memory (`shm_open`, `mmap`) ring buffers for high-bandwidth streams (Wayland DRM surface buffers, audio frames, camera pixels, tensor matrices).

## Subdirectories

- [`schemas/`](file:///home/nitin/fkgugal/application/ipc/schemas): 12 authoritative Cap'n Proto interface schemas.
- [`transport/`](file:///home/nitin/fkgugal/application/ipc/transport): Shared memory allocator and lock-free ring buffer implementation in Rust.
- [`router/`](file:///home/nitin/fkgugal/application/ipc/router): High-throughput system message bus router daemon.
