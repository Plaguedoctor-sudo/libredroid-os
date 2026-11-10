# FreeStack Mirror Diversity & Integrity Policy

**Work Package Reference**: W8 (Task 8.7)  
**Standard**: Non-negotiable R11 (No mandatory cloud) & R1 (Build from source)

---

## 1. Diversity Mandate

To prevent censorship, denial of service, or infrastructure coercion:
1. **Multi-Protocol Distribution**:
   - Primary: Secure Rsync mirrors (`rsync://archive.freestack.org/freestack/sources/`)
   - Anonymity: Tor v3 Hidden Service (`http://fsarchive...onion`)
   - Decentralized: IPFS content-addressed pinning (`ipfs://<CID>`)
2. **Geographical & Jurisdictional Dispersion**:
   - Mirrors must not share upstream cloud providers (no pure AWS/GCP/Azure centralization).
   - At least 2 continents and 3 independent jurisdictions must host source mirrors.
3. **Integrity Enforcement**:
   - Mirrors hold no trust. Clients only fetch against hashes recorded in `manifest/hashes.json` verified by 3-of-5 threshold signatures (`manifest/freestack.manifest.yaml.sig`).
   - Bit-flip or hash mismatch results in instant mirror disqualification.
