# Security recheck — every claim, its status, and the gap

Score weights are in lrd-security-audit. Run it on the device: `lrd-security-audit --fix`.

## CLOSED by this round

  TCB manifest + fs-verity on /etc, /usr/lib/lrd, /opt/lrd/app   weight 24
  Rollback: redundant signed counters + AVB index + mutual slot binding   26
  Boot integrity ladder probe + the honest per-device matrix    22
  Module signing with SIG_FORCE + lockdown=integrity            18
  FEC + panic_on_corruption + weekly full scan, cheap quick mode  14
  Bridge auth: token + Origin + Host + CORS                     30
  Unit hardening baseline + sysctl + usbguard + audit rules     26

## STILL OPEN — ordered by weight

  1  weight 10  Rootfs encryption. Verity gives integrity, not confidentiality.
                 A stolen device's rootfs is readable. Needs LUKS2 on the rootfs
                 image itself, which conflicts with verity unless you do
                 verity -> luks -> ext4 (verity over the ciphertext, so the hash
                 tree is of ciphertext) or luks -> verity (integrity of plaintext).
                 The correct order is: luks2, then verity on the plaintext inside.
                 Not implemented. This is the largest remaining hole.
  2  weight  8  No secure/measured boot record. Nothing accumulates a TPM-like
                 measurement log. On phones there is no TPM, so a hash chain
                 written to the store is the only option, and it is advisory.
  3  weight  8  AppArmor profiles are still in complain mode. Needs a week of
                 journal triage per profile, then enforce. audit is the tool.
  4  weight  6  Per-app scoping of the bridge. Any app in the shell gets full
                 exec. Needs a per-app token or a path allowlist per appId.
  5  weight  6  No resource limits in practice. cgroup v2 is available and unused.
                 Needs slices: lrd-domains.slice (MemoryMax, CPUQuota), and a
                 TasksMax on the bridge so a fork bomb cannot take the machine.
  6  weight  6  No seccomp profile for Chromium. The shell is the biggest attack
                 surface and runs with the default sandbox only.
  7  weight  4  No signed shell bundle independent of the OS. The shell is TCB-
                 sealed, so tampering is caught, but there is no way to update it
                 without an OS update.
  8  weight  4  Firmware blobs are unversioned. /lib/firmware is a soup; nothing
                 records which vendor build each blob came from.
  9  weight  4  No secure time. A wrong clock breaks certificate validation and
                 Tor. Needs RTC handling plus a modem-time fallback on devices
                 with no RTC.
  10 weight  4  auditd rules are loaded but nothing alerts on them. Needs a
                 journal match unit and a shell notification.
  11 weight  2  No core dump policy. Coredumps may contain secrets.
  12 weight  2  No swap encryption. If zram is used, it is unencrypted in RAM.
