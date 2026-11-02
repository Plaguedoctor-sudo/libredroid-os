# LibreDroid security model

## Adversaries we actually defend against

  A1  Corruption            a bad flash, a worn eMMC cell, a truncated write
  A2  Casual tampering      someone with adb and no key material
  A3  Determined attacker   physical access, fastboot, our public keys known
  A4  Malicious software    a hostile web page, a hostile APK, a hostile package
  A5  Network attacker      anyone on the wire, and the CDN/ISP
  A6  Evil maid with time   rollback to a vulnerable signed build

## What stops what

  A1  dm-verity (read fails at the changed block), FEC, panic_on_corruption
  A2  dm-verity + signed rootfs + signed TCB manifest + module signing
  A3  only with AVB + avb_custom_key + a relocked bootloader. Without those,
      A3 wins and we say so. Nothing below the bootloader can help.
  A4  namespaces/cgroups/AppArmor/nft per domain; the bridge is authenticated;
      the shell's exec surface is scoped
  A5  Tor with kernel REDIRECT; signed updates over any transport
  A6  AVB rollback_index where supported; otherwise redundant signed counters
      (advisory) plus mutual slot binding to catch inconsistency

## What we explicitly do NOT defend against

  * a compromised bootloader or vendor firmware
  * a vendor kernel with an unpublished backdoor
  * physical RAM attacks (no TPM, no memory encryption)
  * a compromised build host with the signing key
  * an attacker who can write the store AND has the private key

## Trust boundaries, in order

  bootloader -> boot.img -> initramfs -> [key] -> signed metadata -> rootfs
                                          |
                                          +-> signed TCB manifest -> overlay
  kernel is INSIDE the TCB when Tier 1 is enabled. That is the cost.

## Honest status per device class

  x86_64 + UEFI Secure Boot      A1-A6. Full chain. Reachable.
  ARM + avb_custom_key + relock   A1-A6. Full chain. Device-dependent.
  ARM + unlocked bootloader       A1-A2 solid, A3 loses. Tier 2. Common.
  ARM mainline, no AVB            same as above, minus vendor kernel trust
