# FreeStack SDK Architecture & API Stability Contract

**Work Package Reference**: W13 (Task 13.7)  
**Scope**: Native System Interfaces, IPC Bus Protocols, C ABI, and GObject Introspection.

---

## 1. Guarantees & Tier Classifications

FreeStack platform interfaces are partitioned into three immutable stability tiers:

| Tier | Classification | Evolution Contract | Deprecation Period |
|---|---|---|---|
| **Tier S1** | Kernel & IPC ABI | Frozen ABI. D-Bus IPC methods on `/run/libredroid/lrdd.sock`, Netlink, and seccomp profiles. | Minimum 36 months + two major LTS releases. |
| **Tier S2** | Platform C / GObject API | Semantic Versioning (SemVer 2.0). Shared library sonames (`libfskeystore.so.1`, `libfsprivacy.so.1`). | Minimum 12 months with compiler deprecation warnings (`G_DEPRECATED_FOR`). |
| **Tier S3** | UI Shell Tokens | Visual styles, layer-shell surface protocols, and high-level theme tokens. | Subject to change across minor releases. |

---

## 2. Invariant Security Boundary

Any API exposed to third-party applications must pass through:
1. `SO_PEERCRED` socket UID/GID verification.
2. Bubblewrap namespace boundary verification.
3. SELinux domain transition validation (`fs_app_t` -> target domain).
4. Sovereign User Consent Gate (`tools/fs-permissions.py`).
