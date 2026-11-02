# Encryption: honest scope

## Now true
  * the rootfs payload is AES-XTS-512 encrypted, Argon2id KDF, 4096B sectors
  * dm-verity hashes PLAINTEXT and lives INSIDE the LUKS mapping
    - a wrong-key decrypt cannot pass verity
    - a rolled-back LUKS header changes the key derivation and fails
  * the verity metadata is signed, and the signature is checked before unlock
  * the LUKS header is backed up to the store; a corrupt header is recoverable

## Why the order matters (the fiddly part, written down)
  WRONG  verity(raw) -> luks(plaintext) -> ext4
         verity hashes ciphertext. A wrong key still passes verity because the
         ciphertext is untouched. You lose the only signal that decryption
         produced garbage. Also, any LUKS header tamper is invisible.
  RIGHT  luks(ciphertext) -> verity(plaintext) -> ext4
         verity sees plaintext, so it catches a bad decrypt, a torn write, and
         a rollback of the data. LUKS confidentiality is unaffected because
         verity's tree is encrypted too.

## Still not covered
  * the LUKS header itself is not authenticated beyond LUKS2's own checksum.
    A header rollback that keeps a valid checksum is possible. Mitigation: the
    signed metadata records the header hash, and the audit compares it.
  * keys in RAM are readable by a cold-boot attacker. No memory encryption on
    these SoCs.
  * the store partition (verity metadata, key file, snapshots) is NOT encrypted.
    Snapshots of /overlay therefore contain your data in the clear.
  * a key file on the store means a stolen device boots silently. Remove it to
    require a passphrase. That trade is the user's, and lrd-crypt-policy says so.
