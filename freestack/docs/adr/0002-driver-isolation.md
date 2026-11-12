# ADR 0002 — Driver isolation over a minimal privileged core

- Number: 0002
- Status: accepted
- Date: 2026-11-09
- Rules: R1, R2, R6, R7

## Context

Linux carries roughly 20 million lines, most of it drivers, all of it in ring 0.
FreeStack targets a 20-year support horizon on hardware that will get *older*, and
a RISC-V future that will add a second wave of immature drivers.

Every driver in ring 0 is a permanent kernel-exploit surface. On the X200 the
driver set is small and well-trodden; on anything newer it is not. A monolithic
kernel is the correct choice for the core paths and the wrong choice for
peripheral, vendor-supplied, and long-tail drivers.

## Decision

1. **The privileged core stays minimal.** Block, net core, scheduling, memory, IPC.
   Nothing else is admitted without an ADR.
2. **New and peripheral drivers run out of process** over virtio, in a `crosvm`
   microVM (BSD-3-Clause, pinned).
3. **In-kernel is an allowlist**, not the default. `docs/DRIVER-POLICY.md` names
   every in-kernel driver and its justification.
4. **Rust for new drivers** via `rust-for-linux` (in-tree since 6.1). C stays where
   it already is.
5. **`vfio` for passthrough** where a device cannot be virtio-ified.
6. Driver VMs are `bwrap`-wrapped, capability-granted per ADR 0001, and have no
   ambient device access.

## The 10-year question

*What makes this replaceable in a decade?*

The driver ABI is **virtio**, an open published spec with versions — not a kernel
internal. A driver written against virtio today still loads in 2036 regardless of
what the host kernel looks like. The isolation mechanism (currently `crosvm`) is a
process; swapping it for another VMM is a supervisor change, not a driver change.

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| Stay fully monolithic | Fastest now; leaves 20M LoC of permanent ring-0 liability. |
| Full microkernel (seL4, Zircon) | Correct, but a userspace rewrite and an ecosystem reset. |
| UIO / VFIO only, no VM | Works for a subset; no DMA safety story for the rest. |
| `libkrun` | Viable; less mature device model than `crosvm`. |

## Consequences

**Positive**
- A driver compromise becomes a VM escape problem, not a kernel exploit.
- RISC-V and new hardware can be supported without ring-0 churn.
- Driver VMs are restartable: a wedged Wi-Fi driver restarts instead of panicking.

**Negative**
- Latency: an isolated driver adds VM-exit cost. Acceptable for Wi-Fi, camera,
  audio; not for the block fast path.
- Power: a per-driver VM is not free on a 2008 laptop.
- Memory: each VM has a floor.
- Complexity in the supervisor and in the grant model.

**Neutral**
- `crosvm` joins the reproducibility set and must be built from source.

## Migration

1. `docs/DRIVER-POLICY.md` with the current in-kernel list and per-entry reasons.
2. Enforce the allowlist in `audit-kernel-config.sh`.
3. Move one driver class to a VM as a proof — Wi-Fi first, it is the highest risk
   and the least latency-sensitive.
4. Expand by class only after the first is stable for a release.

## Compliance

- R1 — `crosvm` builds from source, no prebuilt.
- R2 — VM firmware must be free or itemized in the blob tier.
- R6 — the driver VM holds only the handles it needs.
- R7 — the VM image is a build artifact and is reproducible.

## Open questions

- Latency budget per class. Wi-Fi is fine; is camera?
- IOMMU granularity on X200 — no VT-d on some SKUs. Fallback story?
- Does a driver VM survive suspend/resume, or is it torn down?
