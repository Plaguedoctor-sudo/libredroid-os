# dm-verity — verified read-only rootfs

## What it does
The rootfs is mounted from a dm-verity device whose hash tree is appended to the
image. The root hash is signed at build time. If one byte of the base rootfs
changes, the read fails at the block that changed.

## Trust ladder (see the table in the OS manifest)
Tier 1  kernel verifies a PKCS#7 root-hash signature against a key compiled into
        the kernel. Requires CONFIG_DM_VERITY_VERIFY_ROOTHASH_SIG + the key in
        CONFIG_SYSTEM_TRUSTED_KEYS. Strongest; userspace is not in the loop.
Tier 2  the initramfs verifies the signed metadata with openssl before calling
        veritysetup. Default on devices with an unlocked bootloader.
Tier 3  the initramfs compares the root hash against one pinned at build time.
        Falls out of Tier 2 automatically when openssl is unavailable.

Tier 1 is used if the kernel supports it; Tier 2 is the floor. `lrd.verity=off`
on the cmdline disables both, `lrd.verity=strict` refuses to boot unverified.

## What it does NOT cover
  * the overlay upper (/etc, /home, /var, installed packages, the shell)
    — writable by definition. Snapshot + hash is the answer there, not verity.
  * the boot image, unless AVB is used. A swapped initramfs defeats Tier 2.
  * an unlocked bootloader. Anyone who can run fastboot can replace everything.
    Relocking with `avb_custom_key` is the only real chain.
  * rollback. The metadata carries a rollback index; the counter lives on the
    store partition and is therefore writable. Advisory anti-rollback only,
    unless AVB's own rollback index is used.

## Keys
  verity.key.pem   RSA-4096 private. Never leaves the build host (or your HSM).
  verity.pub.pem   public. Ships in the initramfs AND is compiled into the kernel
                   for Tier 1.
  verity.crt.pem   self-signed cert, for the PKCS#7 Tier 1 signature and AVB.

Losing the private key means re-signing and re-flashing. Compromise means an
attacker who can also write the store can produce a valid rootfs.

## Policy
  /etc/lrd/verity.conf
    policy=warn|strict|off        default warn
    allow_tofu=1                  accept an unsigned rootfs once, then pin
    require_for=rootfs            future: boot, recovery

`warn` boots with a visible flag and a blocker in the readiness report.
`strict` drops to recovery. `off` is for debugging only.
