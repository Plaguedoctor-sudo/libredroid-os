# ADR 0001 — Capability-based IPC as the primary authorization model

- Number: 0001
- Status: accepted
- Date: 2026-11-09
- Supersedes: none
- Rules: R5 (structural), R6, R8, R12

## Context

FreeStack currently authorizes with SELinux domains plus `bwrap` namespaces.
Both are *ambient authority*: a process is assigned a domain, and everything in
that domain inherits the domain's rights. Three consequences follow.

1. **Composition is unsafe.** Two services in the same domain can each reach the
   other's resources without either being handed anything. "Sandboxed" here means
   "constrained to a box", not "holds a key".
2. **Revocation is coarse.** Dropping a right means relabelling, which means
   policy reload, which means disruption to unrelated processes.
3. **Authority is name-addressed.** A service asks for `/run/foo.sock` or a Binder
   name. Whoever can reach the namespace can address it. Nothing is unforgeable.

The AIDL/Binder import inherits the same shape: interfaces are addressed by name,
versioned weakly, and synchronous. Retrofitting it onto a 2026 system imports 2010
constraints.

## Decision

Capability handles become the primary authorization mechanism.

- A capability is an **unforgeable handle** to an interface instance, passed as a
  method parameter. Possession is authority. No handle, no access.
- Two transports, one semantic model:
  - **Cap'n Proto** for native service-to-service, using its native capability
    pointers.
  - **`wasmtime` component model** for untrusted and third-party code, using
    `WASI 0.3` capability semantics.
- SELinux is **demoted to depth-in-defence**: it constrains what a compromised
  process can reach even if it holds a handle. It is no longer the primary model.
- Handles are revocable. Revocation is a token invalidation, not a relabel.
- No service resolves a peer by name at call time. Resolution happens once, at
  wiring time, in the supervisor.

## The 10-year question

*What makes this replaceable in a decade?*

The interface is a **schema**, not a call site. Transports are swappable because
handles are bearer tokens with no name resolution baked in: replacing Cap'n Proto
with something else in 2036 means re-emitting stubs, not rewriting callers. The
schema carries an explicit version and a deprecation clock, so a decade of drift
is visible rather than latent.

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| Keep SELinux as primary | Ambient by construction. Composition stays unsafe; revocation stays coarse. |
| AIDL / Binder | Name-addressed, weak versioning, synchronous, Java-shaped. Imports 2010 constraints. |
| D-Bus | Ambient by default, string-addressed, no handle type, policy is external and untyped. |
| gRPC | No capability pointers; auth is a token header, not a handle; HTTP/2 weight for local calls. |
| Genode-style pure capability | Best semantics available. Rejected for ecosystem size and because it forces a full userspace rewrite. |
| Fuchsia component framework | Right model, not portable off Zircon. |

## Consequences

**Positive**
- R5 becomes structural: a process with no handle has no route, firewall rule or not.
- Least authority is expressible per call, not per domain.
- Revocation is a token operation, sub-second, no reload.
- Services become independently testable: hand a fake handle, no namespace setup.
- F1 (replaceability) improves — a peer is a handle, not a path.

**Negative**
- Every service gains a schema and a wiring manifest. +15–20 days.
- Debugging is harder: "why can't it reach X" now has three answers instead of one.
- Cap'n Proto and `wasmtime` become core dependencies; both must pass the same
  reproducibility bar as everything else.
- Tooling gap: no `strace`-equivalent for handles yet. We build one.

**Neutral**
- SELinux policy volume does not shrink; its role changes.
- The supervisor becomes security-relevant code and needs its own review.

## Migration

1. `common.capnp` with `Ctx` and the capability enum. Freeze it.
2. Add capability parameters to `net`, `power`, `perm`, `storage` only.
3. Pass handles from the supervisor for those four; everything else still uses
   paths and names.
4. Convert remaining interfaces one per commit, with SELinux unchanged alongside.
5. Only after all services are converted, relax the SELinux policy that existed to
   compensate for ambient reach.

Nothing is removed until step 5. Both models run in parallel for the whole of
Phases F and G.

## Compliance

- R5 — default-deny becomes a property of wiring, not of a ruleset.
- R6 — handle grants are logged; no single component can self-grant.
- R8 — schema files are GPL-3.0-or-later like the rest of the core.
- R12 — Cap'n Proto is MIT, `wasmtime` Apache-2.0. Both carry patent grants.

## Open questions

- Revocation semantics for handles already in flight. Leased handles with a TTL?
- Delegation depth limit — can a service re-hand a handle it was given?
- Where grants are audited: supervisor or `auditd`? Both is duplicated state.
- Cross-namespace transfer: does a handle survive a `bwrap` boundary intact?

Unresolved items block Phase F, not Phase C.
