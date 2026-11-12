# FreeStack Disaster Recovery & Lost-Passphrase Protocol

This document specifies the cryptographic and procedural mechanisms for system recovery, lost-passphrase remediation, and fallback verification for FreeStack devices.

---

## 1. Storage Layout & Trust Chain

FreeStack storage utilizes a split-layer security boundary:
- **Root Filesystem (`/`):** Immutable, dm-verity protected, signed by multi-party release keys. Any byte mutation causes immediate I/O error (`EIO`) or kernel panic at the initramfs stage.
- **Userdata (`/var`, `/home`):** Formatted with **LUKS2** utilizing `--pbkdf argon2id` with high memory hardness (1 GiB RAM target, 4 iterations).
- **Application Directories (`/home/app/*`):** Directory-level encryption policies applied via `fscryptctl`.

---

## 2. Lost-Passphrase Remediation Flow

FreeStack devices do not feature backdoors, escrow master keys, or remote override services. In the event of a lost passphrase:

1. **Recovery Key Slot:** During first-boot enrollment via `tools/firstboot-keygen.sh`, an independent 256-bit high-entropy recovery token (Base32 formatted, 8 blocks of 5 characters) is generated and added to LUKS2 keyslot 1.
2. **Offline Recovery Console:**
   ```bash
   # Boot into recovery mode via hardware switch or GRUB recovery entry
   cryptsetup open --type luks2 --key-slot 1 /dev/disk/by-partlabel/userdata userdata_crypt
   ```
3. **Passphrase Reset:**
   ```bash
   # Replace keyslot 0 passphrase using active recovery token
   cryptsetup luksChangeKey --key-slot 0 /dev/disk/by-partlabel/userdata
   ```
4. **Permanent Loss:** If both keyslot 0 and keyslot 1 are lost, encrypted userdata is mathematically unrecoverable. The device must be re-provisioned from a clean release image.

---

## 3. dm-verity Corruption & Emergency Rescue

If rootfs integrity validation fails due to storage degradation or bit rot:
1. The kernel halts early boot with message `dm-verity corrupt block detected`.
2. Hardware recovery mode allows booting the fallback redundant A/B slot:
   ```bash
   fsctl update rollback
   ```
3. Alternatively, an authenticated live recovery USB image can be attached to restore the verified root image without modifying userdata partitions.
