# ADR 0004: Filesystem Metadata Encryption Architecture

- **Status:** Accepted
- **Date:** 2026-11-13
- **Author:** FreeStack Security Architecture Team
- **Relevant Subsystems:** [§5 Storage & Cryptography]

---

## 1. Context & Problem Statement
File content encryption (via `fscrypt`) encrypts payload blocks but exposes directory structure, file sizes, timestamps, and inode metadata to an adversary with physical access to raw storage. Full-disk LUKS2 encrypts metadata but presents complexity on mobile partitions and flash endurance.

## 2. Decision
FreeStack adopts a **layered hybrid architecture**:
1. **Userdata Partition Layer:** Formatted with **LUKS2** `--pbkdf argon2id` (`dm-crypt`) across the entire block boundary, securing all metadata, directory names, inode tables, and file lengths against raw block capture.
2. **Per-Application Namespace Layer:** Enforced via `fscryptctl` directory policies, ensuring that distinct applications hold independent AES-256-XTS/Adiantum master keys managed by `libfskeystore`.

## 3. The 10-Year Test
1. **F1 Component Replaceability:** The block layer interacts via standard Linux device-mapper; filesystems can transition from ext4 to f2fs or bcachefs without invalidating the key protocol.
2. **F2 Ambient Authority Elimination:** Key unlocking requires presenting held capability tokens to `fskeystored`, rather than ambient root filesystem rights.
3. **F3 Machine Introspectability:** Driveable via `fsctl storage status --json` and `tools/fs-fscrypt-setup.sh`.
4. **F4 Cryptographic Agility:** LUKS2 crypto parameters are stored in the JSON header, allowing cipher migration without re-partitioning.
5. **F5 Multi-Form Portability:** Operates uniformly across NVMe laptops, eMMC single-board computers, and virtual disks.
6. **F6 ABI Stability:** Uses stable Linux kernel dm-crypt and fscrypt ioctl ABIs with published backwards compatibility.
