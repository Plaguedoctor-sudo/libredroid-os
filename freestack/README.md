# FreeStack

A free, telemetry-free, reproducible operating system.

- No account. No default telemetry. No vendor key in the boot chain.
- Default-deny network. Blobs quarantined and itemized.
- GPL-3.0-or-later. Foundation-governed. Fork-blessed.

## Quick start

```bash
./bootstrap.sh
make gen-keys          # offline ceremony / key creation
make sign              # 3-of-5 threshold signing
make verify && make schema && make rules && make sbom
make pin-audit         # verify upstream pin resolution
make resolve           # resolves commits & computes tree hashes
make stage TARGET=x200-libreboot PROFILE=native
```

## Reading order

1. `AGENTS.md` — build contract (agents and humans)
2. `THREAT-MODEL.md` — what is and is not defended
3. `GOVERNANCE.md` — license, trademark, conformance
4. `docs/BUILD.md` — full reproducible build
5. `docs/TRUST.md` — trust model, multisig, and content hashing
6. `docs/TIERS.md` — core / blob / optional tiers
7. `docs/SUBSYSTEM_STATUS.md` — living status matrix across all 21 subsystems

## Status

Phase 0–Phase B validated. Full independent multi-party reproducibility proven. See [docs/SUBSYSTEM_STATUS.md](docs/SUBSYSTEM_STATUS.md) and [docs/BUILD.md](docs/BUILD.md).
