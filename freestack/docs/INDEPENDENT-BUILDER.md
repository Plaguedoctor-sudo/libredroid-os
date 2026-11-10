# FreeStack Independent Multi-Party Builder Protocol

**Work Package Reference**: W7 (Task 7.6)  
**Security Guarantee**: Non-negotiable R6 & R7 — Independent rebuild by third-party organizations without shared credentials or infrastructure.

---

## 1. Principles of Independent Verification

To guarantee that no single compromised builder or keyholder can inject backdoors into FreeStack:
1. **Sovereign Infrastructure**: Builders must run on hardware owned and maintained by independent legal entities (e.g. Foundation Alpha, Foundation Beta, Community Auditor).
2. **Network Air-Gapping**: During the `make build` execution phase, network namespace egress is dropped (`unshare -n` or `bwrap --unshare-net`).
3. **No Centralized Artifact Storage**: Builders pull sources purely from hash-pinned mirrors (`manifest/pins.json` & `hashes.json`) and independently reproduce the target sysroot.
4. **Cryptographic Attestations**: Each builder publishes an attestation JSON containing SHA-256 digests of all produced artifacts and a root tree digest.

---

## 2. Rebuild Procedure for Second Organizations

```bash
# 1. Clone clean repository
git clone https://archive.freestack.org/freestack.git
cd freestack

# 2. Verify root keys and manifest threshold signatures (>= 3 of 5)
make verify
make schema

# 3. Stage the target bit-for-bit in isolated namespace
SOURCE_DATE_EPOCH=1700000000 \
python3 tools/fsbuild/fsbuild.py stage --target x200-libreboot --profile native

# 4. Generate local attestation
python3 tools/rebuild-attest.py create \
    --builder-id "org-beta-node01" \
    --org "SovereignTechAuditors" \
    --dir out/root-x200-libreboot \
    --out dist/attestations/builder-beta.json

# 5. Verify consensus with primary builder
python3 tools/rebuild-attest.py verify \
    dist/attestations/builder-alpha.json \
    dist/attestations/builder-beta.json
```

If any bit diverges, invoke `tools/diff-classifier.py` to classify and remediate according to `docs/REPRO-DIFF-TAXONOMY.md`.
