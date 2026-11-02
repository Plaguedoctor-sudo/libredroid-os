# Component recheck — what is missing for an independent OS

## Blocking daily use

  1  Waydroid integration. The app ecosystem. Needs: an image build, a domain
     definition, GPU passthrough, and a launcher handoff. Highest value by far.
  2  Lock screen UI in the shell, wired to lrd-lock-helper.
  3  xdg-desktop-portal-wlr. Without it: no screenshots, no screencast, no file
     pickers, no screen sharing in a browser. Nothing else substitutes.
  4  polkit agent. Without it, no graphical privilege prompt; the shell has to
     shell out to sudo.
  5  Input methods. fcitx5 + a virtual keyboard on Wayland. The shell's own
     keyboard covers the shell only.
  6  Notification daemon for non-shell apps (mako or dunst).
  7  Time sync: chrony or systemd-timesyncd, configured and started.
  8  Accessibility: screen reader, magnifier, sticky keys, high contrast.

## Needed, not blocking

  9  Bluetooth pairing agent (bluez is installed and unmanaged)
  10 Boot splash (plymouth) — currently kernel text
  11 Locale, keymap, and timezone management beyond first boot
  12 Printer (CUPS) and scanner (sane) wiring
  13 VPN with a UI (wireguard + networkmanager plugin)
  14 xdg-user-dirs and a session manager for autostart
  15 Disk health: SMART on x86, eMMC wear on ARM
  16 Battery wear tracking and a health report
  17 Network profile UI
  18 Crash reporting: coredumpctl + a local store + lrd-report inclusion
  19 Thermal daemon with fan control on x86
  20 CI pipeline producing signed artifacts and a repo
  21 Installer and provisioning localisation
  22 Hardware certification DB fed by lrd-qa results
  23 Firmware update path for the vendor blobs
  24 Swap/zram policy tuned per RAM size
  25 systemd-oomd policy

## Explicitly out of scope, decided

  multiseat / fast user switching      one session, one seat
  TPM-backed disk unlock               no TPM on phones
  Secure Boot on ARM                   no standard
  SELinux                              AppArmor only, decided
  wayland-native app windows           cage hosts one client; streamed domains
                                       cover the rest

What this round actually buys
Claim before	After
"verity protects the OS"	verity protects the base; a signed, fs-verity-sealed TCB manifest protects /etc, the shell and the bridge. lrd-tcb-manifest verify runs before the compositor.
"rollback is advisory"	the index is in signed metadata, in the boot cmdline, and in two counters, and the slots are bound to each other. Enforced by AVB where the device allows; lrd-rollback status says which of the three it is.
"AVB is device-specific"	lrd-boot-integrity probe returns a level 0–4 and the per-device matrix, so you know before flashing whether you get a chain or Tier 2.
"the kernel is in the TCB"	it is, and it is now defended: MODULE_SIG_FORCE plus lockdown=integrity, verified by the audit.
"a page can run commands"	token + Origin + Host + CORS. lrd-bridge-auth check prints the four curl results.
"verify costs 30s"	FEC + panic_on_corruption catch corruption on read; a weekly timer does the full walk; --quick does 1s of signature and tree-root work.
