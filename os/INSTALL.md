# Installing LibreDroid OS on bare metal

## Target classes

  A. x86_64 / UEFI or BIOS        guided installer from the ISO. Fully supported.
  B. ARM Android device, Halium   slot dual boot. Device-dependent (see adapt).
  C. ARM mainline (SDM845)        slot dual boot, better but narrower.

## A — x86_64

  1. dd the ISO to a USB stick
  2. boot it, pick "Install LibreDroid"
  3. answer: disk, hostname, user, LUKS y/n, recovery y/n, layout
  4. reboot, remove the stick

Everything below is handled by the installer: partitions, bootloader, fstab,
identity, user, recovery image, first-boot provisioning.

## B — Android device

  0. Unlock:  fastboot flashing unlock && fastboot flashing unlock_critical
              (this erases the device — it is the point of no return)
  1. Probe:   lrd-adapt probe          # score + support level. Below 35, stop.
  2. Back up: lrd-flash --backup-only  # stock boot/dtbo/vbmeta per slot
  3. Kernel:  build the vendor kernel with the lrd fragment, verify NFT_REDIRECT
              landed, repack boot.img with the stock header + DTB
  4. Build:   lrd-adapt blobs && lrd-adapt gen
              os/build/build-rootfs.sh lrd-adapt-*.deb
              os/initramfs/build-initramfs
  5. Flash:   lrd-flash --boot boot.img --root lrd-rootfs.img --slot b
  6. Boot.    Android stays in slot a. `lrd-slot android` returns to it.

## After first boot

  lrd-adapt-report        what is real and what is not
  lrd-qa                  subsystem test battery
  lrd-netd verify         prove the egress policy
  lrd-update check        look for an update
  lrd-snapshot take base  your first restore point

## When it goes wrong

  no display          lrd-display-set drm-atomic | hwc2-egl | fbdev
  no shell            ctrl+alt+F2 -> console; systemctl start lrd-safe.target
  bad update          the bootloader reverts by itself; `lrd-update rollback` to force
  bad conf            lrd-adapt-txn rollback
  unbootable          6 taps top-right, or `lrd-slot recovery-once`, or wait 3 failed boots
  totally dead        `lrd-flash` from a host over fastboot, or EDL/MSM for hard bricks

## What is verified, and what is trusted

  verified   rootfs hash, update signature, snapshot hash, bootloader retry count
  trusted    the vendor kernel and blobs, the bootloader, the vendor firmware
  not verified yet  dm-verity on the rootfs, signed kernel, relocked bootloader
