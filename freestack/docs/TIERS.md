# FreeStack Component Tiering & Blob Quarantine Architecture

FreeStack categorizes all system components into distinct trust tiers to maintain sovereign free software integrity while providing pragmatic hardware enablement under strict quarantine.

---

## 1. Trust Tiers Overview

| Tier | Definition | Default Build | Network Access | Telemetry |
| :--- | :--- | :--- | :--- | :--- |
| **`core`** | 100% Free Software (GPL/copyleft/permissive). Compiled entirely from source using free toolchains. | **Included** | Default-Deny (`nftables`) | **Forbidden** |
| **`driver`** | Open-source hardware drivers, device trees, and kernel modules. | **Included** | Default-Deny | **Forbidden** |
| **`userland`**| Open-source utilities, shell, daemons, and sovereign desktop apps. | **Included** | Sandboxed (`bwrap`) | **Forbidden** |
| **`blob`** | Non-free, proprietary firmware binaries (e.g., Wi-Fi NIC firmware, GPU microcode). | **Excluded** | Isolated / Quarantined | **Forbidden** |

---

## 2. Core Tier Purity Guarantee (§0, R1–R2)

Under standard build execution (`make stage`):
- Exactly **zero binary blobs** or proprietary code are incorporated into the target filesystem.
- Only components classified under `core`, `driver`, or `userland` with approved free licenses are compiled and staged.
- Any attempt to slip an unclassified or proprietary component into a `core` stage causes an immediate build failure during `make rules`.

---

## 3. Hardware Blob Quarantine Policy (§0, R2)

Certain modern computers and cellular devices require closed firmware blobs to initialize specific silicon peripherals (such as cellular modems, Bluetooth controllers, or GPU firmware). FreeStack enforces strict boundary rules:

1. **Explicit Opt-In Required**:
   - Blobs are only packaged when explicitly instructed via `--allow-blobs` or `make stage BL=1`.
2. **Itemized Manifest**:
   - Every included blob is recorded in `/etc/blob-manifest.txt` with SHA-256 hash, upstream vendor, and license notice.
3. **Execution Containment**:
   - Blobs never execute as host CPU code. They remain isolated as passive binary firmware payloads loaded strictly into peripheral microcontrollers via `/lib/firmware`.
4. **Sandboxed Network Interfaces**:
   - Any hardware controller utilizing blob firmware (e.g., cellular baseband) is confined to a dedicated unshare network namespace (`modem-netns.service`).

---

## 4. Waiver Process & Expiration Gating

If a component cannot temporarily satisfy strict reproducibility or license requirements:
- A formal **waiver entry** must be committed into `freestack.manifest.yaml`.
- Every waiver requires:
  - Justification reasoning
  - Authorized tracking issue
  - Fixed expiration timestamp (`expires_at`)
- `fsbuild rules check` automatically invalidates and fails the build if an expired waiver is encountered.
