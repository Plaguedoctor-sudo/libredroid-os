# ADR 0003 — Schema-first machine interface; the GUI is a client

- Number: 0003
- Status: accepted
- Date: 2026-11-09
- Rules: R3, R5, R11

## Context

Every current control is a click. Nothing is scriptable, nothing is testable
without a display, and CI cannot exercise the stack headless. Machines are now
first-class consumers: automation, agents, and configuration management all need
to read and set state without a compositor.

Android made the opposite choice and it is permanent: `adb shell settings put`
exists as an afterthought with stringly-typed keys, no schema, no stability, and
whole subsystems unreachable from it.

## Decision

1. **Every subsystem ships a schema** in `interface/<subsystem>.capnp`, capability-
   parameterised per ADR 0001.
2. **One binary, `fsctl`**, implements every schema. Generated from the schema; no
   hand-written dispatch.
3. **`--json` is mandatory** on every verb. Human output is a rendering of the same
   structure, never a separate code path.
4. **Exit codes are stable and documented** (`docs/FSCtl.md`). They are API.
5. **Verbs are idempotent** and accept `--dry-run` where a mutation is involved.
6. **The GUI is one client.** A control that exists only in the GUI is a bug.
7. **No verb requires an account, a daemon restart, or a display.**

## The 10-year question

*What makes this replaceable in a decade?*

The contract is the schema, not the CLI text. A future frontend — web, voice,
agent, whatever replaces GTK — implements the same schema and inherits every
consumer. The CLI is generated, so it cannot drift from the contract, and drift is
what normally kills an interface over ten years.

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| GUI first, scripting later | Android's path. Permanent mess, stringly-typed, incomplete. |
| D-Bus introspection | Untyped at the boundary, no capability handles, unstable in practice. |
| REST on localhost | Extra listener, extra auth surface, HTTP semantics for local calls. |
| D-Bus + polkit | Ambient auth, verbose, polkit is a policy language we would then maintain. |

## Consequences

**Positive**
- Headless CI: the entire stack is testable without a display (enables F3).
- Every GUI control is automatically scriptable.
- Schema changes are reviewable diffs, not behavioural surprises.
- Tests can assert against structure instead of scraping text.

**Negative**
- Front-loads design work: schemas must exist before the panels are written. This
  is why it precedes Phase K.
- Every subsystem owner writes a schema and keeps it frozen.
- `fsctl` is a privileged binary and needs its own hardening.

**Neutral**
- Adds a generation step to the build; it is deterministic.

## Migration

1. `interface/common.capnp`, then one schema per subsystem, `ctl.capnp` last.
2. `fsctl` skeleton with `net status --json` and `power profile get --json`.
3. Freeze those two; wire them to real services.
4. Require a schema for any new control from here on.
5. Before Phase K, all twelve subsystems have schemas.

## Compliance

- R3 — `fsctl` needs no account; it works over a local handle.
- R5 — `fsctl` is itself capability-granted, not root-everything.
- R11 — every verb has an offline path; nothing calls home.

## Open questions

- Unix socket with peer credentials, or handle-only via the supervisor?
- How does `fsctl` authenticate when invoked from a shell inside a sandbox?
- Is the JSON envelope versioned separately from the schema?
