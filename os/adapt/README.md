# lrd-adapt — device adaptation

Goal: one generic Debian arm64 image + a per-device adaptation package. Flashing a new
device should be: probe, generate, flash to the inactive slot, reboot.

## Model
  base       Debian trixie arm64 (built by build/debos.yaml)
  compat     Halium boot chain + libhybris against the VENDOR kernel
  identity   lrd-adapt-<vendor>-<codename>  (generated, never hand-written)
  isolation  rebuilt vendor kernel with the lrd-kernel.fragment applied
  dualboot   Android in the active slot, LibreDroid in the inactive slot

## Why the vendor kernel
  Mainline needs a DTS, a GPU driver and a panel driver per SoC. MT6983 has none of
  the three. The vendor kernel has all three plus the working blobs. libhybris is the
  compatibility layer that lets a glibc Debian userspace drive bionic HALs.

## Support levels
  full        display+input+net+audio+telephony, kernel patched
  partial     display+input+net, one of audio/telephony missing
  boot-only   display or serial, nothing else
  unsupported no working display

## Pipeline
  1. ./lrd-adapt probe        # audit the device, emit device.json + a score
  2. ./lrd-adapt blobs        # extract vendor blobs from the live device
  3. ./lrd-adapt gen          # build the adaptation .deb
  4. ./build/build-rootfs.sh  # base image + the .deb
  5. ./flash/lrd-flash        # write to the inactive slot
  6. ./flash/lrd-slot linux   # reboot into it

## Reverting
  ./flash/lrd-slot android    # one command, slot switch, nothing was erased
  ./flash/lrd-rollback        # restore a backed-up stock boot image

## Non-negotiables before flashing
  * bootloader unlocked AND critical partitions unlocked
  * a full partition backup (flash/lrd-flash --backup-only)
  * the inactive slot confirmed to be the one you are willing to lose
  * battery > 60%
