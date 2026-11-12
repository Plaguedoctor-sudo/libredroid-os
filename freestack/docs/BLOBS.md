# FreeStack Binary Blob & Firmware Policy

FreeStack upholds Rule R1: **Zero non-free binary blobs in the core platform tier**.

---

## 1. Core Tier Invariant

No component in the `core` tier may contain:
- Proprietary binaries, shared objects, or statically linked closed-source firmware.
- Undocumented microcode patches not auditable from public source.
- Code under non-free, proprietary, or source-available (non-OSI / non-FSF) licenses.

Every core component must provide full verifiable build reproducibility and copyleft compliance (GPL-3.0-or-later / compatible).

---

## 2. Quarantined Blob Tier (`tier: blob`)

For hardware platforms requiring vendor firmware blobs (e.g. WiFi modems, GPU microcode, baseband DSPs):
1. **Quarantine Isolation:** Blobs are isolated in the separate `blob` tier and recorded in `etc/blob-manifest.txt`.
2. **Explicit User Consent Flag:** Blobs are completely omitted from build and staging outputs unless the operator explicitly specifies:
   ```bash
   make stage TARGET=x200-libreboot BL=1
   ```
3. **Execution Confinement:** Firmware blobs are never executed on the host main CPU with kernel privileges; they are uploaded exclusively to isolated peripheral microcontrollers running within unprivileged virtio microVMs or IOMMU-confined bus domains.
