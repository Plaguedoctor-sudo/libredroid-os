# Bring-up runbook

## A. No hardware — prove the ISO works

    cd <repo>
    export LRD_SIGN_KEY=you@example.com
    os/build/lrd-make iso
    os/test/lrd-qemu-test build-out/*.iso

Read the verdict. `working` means flash it. Anything less, fix the failures and
re-run. This loop is ~10 minutes and needs nothing but QEMU.

If the test hangs with no verify block, the QEMU failure output names the three
usual causes. `--keep` holds the console log.

## B. x86_64 hardware

    sudo os/install/lrd-deploy iso /dev/sdX build-out/*.iso
    # boot the stick, pick "Install LibreDroid", answer the prompts
    # after reboot:
    lrd-verify
    lrd-doctor
    lrd-security-audit

## C. ARM device

    0. unlock:  fastboot flashing unlock && fastboot flashing unlock_critical
                (this erases the device — the point of no return)
    1. probe:   os/adapt/lrd-adapt probe
                below score 35: stop and reconsider
    2. back up: os/install/lrd-deploy status      # confirms fastboot + backups
    3. kernel:  rebuild the vendor kernel with the lrd fragment; verify
                CONFIG_NFT_REDIRECT landed; repack boot.img with the stock
                header + DTB (see os/adapt/devices/*/NOTES.md)
    4. build:   os/adapt/lrd-adapt blobs
                os/adapt/lrd-adapt gen
                os/build/lrd-make image adapt-out/lrd-adapt-*.deb
    5. deploy:  os/install/lrd-deploy device --boot build-out/boot.img \
                                            --root build-out/lrd-rootfs.img --slot b
                (this reboots and then verifies automatically)
    6. the deploy runs lrd-verify for you. read the verdict.
    7. go back to Android:  os/install/lrd-deploy rollback

## D. If it does not come up

  black screen, serial alive      lrd-display-set drm-atomic | hwc2-egl | fbdev
  no shell, compositor alive      ctrl+alt+F2 -> lrd-doctor --fix
  compositor dead                 ctrl+alt+F2 -> systemctl start lrd-safe.target
  bad adaptation                  lrd-adapt-txn rollback
  bad update                      the bootloader reverts by itself
  nothing at all                  3 failed boots -> safe target; or lrd-slot recovery-once
  recovery                        lrd-recovery shell (initramfs), has r-recover / r-reset

## E. Before calling it done

    lrd-verify              verdict must be working or usable
    lrd-doctor              no gate-critical failures
    lrd-security-audit      score >= 85
    lrd-snapshot take base  your first restore point
    lrd-support             bundle it, in case

## F. The migration you probably still need

    lrd-migrate-cage-labwc plan
    lrd-migrate-cage-labwc run
    reboot
    lrd-migrate-cage-labwc verify
    # if it fails: lrd-migrate-cage-labwc rollback

