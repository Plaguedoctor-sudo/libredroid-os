# FreeStack Upstream Forking & Maintenance Policy

FreeStack prioritizes upstream collaboration over permanent fragmentation. Where upstream packages require modification to achieve bit-for-bit reproducibility, copyleft conformance, or capability IPC integration, this policy governs the maintenance lifecycle.

---

## 1. Fork Criteria

A package may only be forked into the FreeStack tree if:
1. Upstream refuses or delays patches required for strict bit reproducibility (`SOURCE_DATE_EPOCH` normalization, umask insensitivity).
2. Upstream introduces mandatory dependencies on proprietary telemetry, online accounts, or ambient authority IPC.
3. Upstream lacks sandboxing or seccomp-BPF isolation required by FreeStack constitutional rules.

---

## 2. Upstream Sync & Rebase Cadence

| Upstream Component | Rebase Cycle | Maintainer Responsibility |
|---|---|---|
| `musl` libc | Bi-weekly tracking | Patch minimize; zero deviation from upstream standards. |
| `toybox` | Monthly tracking | Preserve single-binary minimal footprint; verify test suite. |
| `dinit` | Release-tagged | Ensure clean supervisor lifecycle without socket activation debt. |
| `bubblewrap` | Quarterly tracking | Track namespace & seccomp security fixes immediately. |

---

## 3. Patch Minimization

Every local patch in `patches/<component>/` must include:
- Link to upstream pull request or issue tracker discussion.
- Justification under FreeStack Constitutional Rules (R1–R14).
- Deprecation date where the patch will either be upstreamed or dropped.
