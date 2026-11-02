# What LibreDroid OS consists of, and what is still missing

## Present and load-bearing

  release/          identity, os-release, build provenance
  boot/             lrd-bootcount (bootloader-enforced rollback), lrd-slot
  update/           signed A/B updates, sysupdate config, mkupdate
  initramfs/        init with recovery entry, recovery shell
  recovery/         flag- and strike-triggered recovery mode
  install/          x86 guided installer, ARM first-boot provisioning
  account/          lrd-user, PAM, greetd, lock helper, shell lock screen & power menu
  repo/             signed apt repo, lrd-pkg with install transactions
  snapshot/         overlay snapshot/restore, scheduled
  net/              policy + provable killswitch
  power/            idle ladder, thermal policy, battery thresholds, power dialog
  qa/               subsystem test battery
  report/           offline diagnostic bundle
  build/            mkimage
  adapt/            device adaptation (probe -> package -> flash)
  adapt-common/     apply-*, propset, txn, diff, cage-run, bootgate

## Still missing, ranked

  1. dm-verity + signed kernel. Nothing cryptographic vouches for the rootfs.
     Needs: veritysetup in the initramfs, a signature check against a key in
     ROM, and a decision about whether to relock the bootloader with our own key.
  2. First-party Waydroid integration. Currently the adaptation leaves it to the
     user. Needs: a domain definition, an image build, and GPU passthrough wiring.
  3. Per-domain audio routing. PipeWire needs per-domain sinks so anon audio does
     not leak to the work domain's mixer.
  4. Accessibility. No screen reader, magnifier, or sticky keys.
  5. Input methods. No fcitx5 wiring; the shell's own virtual keyboard is the only
     text entry on touch.
  7. Boot splash. plymouth or a framebuffer logo. Currently you see kernel text.
  8. Locale/ime/keymap management beyond first-boot writes.
  9. Time sync. No chrony/timesyncd config; no RTC strategy on devices without one.
  10. Bluetooth pairing UI. bluez is installed and unmanaged.
  11. Printer support. CUPS present in the package list, unconfigured.
  12. CI. No pipeline; mkimage is manual.
  13. Localisation of the installer and provisioning TUIs.
  14. Hardware certification database. lrd-qa exists; nothing aggregates results
      across devices into a compatibility list.

## Known-fragile, by design

  hwc2 display path        auto-cycles, may land on fbdev (unaccelerated)
  vendor sensor HAL        mainline IIO preferred; HAL path needs sensorfw
  camera                   plumbing only; expect the last thing to work
  suspend on Android SoCs  no true S3; battery drain while "asleep"
  proot domains            ptrace, not namespaces. Only mainline/nspawn is real.
