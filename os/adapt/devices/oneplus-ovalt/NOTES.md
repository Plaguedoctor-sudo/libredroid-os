# OnePlus Pad (OPD2304) — MT6983, Mali-G710

Verdict under the Halium model: **partial, plausible.** Mainline was never going to
happen; the vendor kernel changes everything.

## Why this device is now viable
  * vendor kernel 5.15 exists and boots; DTB is in the stock boot image
  * /vendor/lib64/hw has hwcomposer.mt6983.so + gralloc.default.so
  * Mali-G710 blobs are in /vendor/lib64/egl — libhybris wraps them like any other
  * vendor_b/odm_b survive in super, so the blobs stay where they expect to be

## The three things that will actually hurt
  1. mtk hwcomposer. MediaTek's HWC is a vendor special. Expect to spend most of the
     time here. Fallback: if a DRM node appears on this kernel, use backend=drm and
     skip HWC entirely.
  2. gralloc. MediaTek gralloc uses its own buffer layout; libhybris needs the right
     GRALLOC_IMPL and the right android-headers version. Wrong pairing = black screen
     with no error.
  3. CONFIG_NFT_REDIRECT is almost certainly absent in the stock 5.15 defconfig.
     Rebuild. Without it the Tor domain is app-level and the whole tier story drops.

## Ordered plan
  1. lrd-adapt probe              # confirm the score; if <35, stop and reconsider
  2. lrd-adapt blobs
  3. rebuild kernel with the fragment, repack boot.img
  4. lrd-adapt gen && build-rootfs.sh
  5. lrd-flash --slot b           # Android stays in a
  6. boot, watch the serial console: `adb shell` won't work, use `fastboot oem uart` or
     the on-screen initramfs shell
  7. lrd-doctor until green

## Boot image repack
The stock boot.img has the DTB and the header version MediaTek's ABL expects. Extract
them and rebuild rather than generating fresh:

    unpack_bootimg --boot_img stock_boot_b.img --out /tmp/boot
    mkbootimg --kernel kernel-out/arch/arm64/boot/Image \
              --dtb /tmp/boot/dtb --header_version $(grep header_version /tmp/boot/info) \
              --ramdisk initramfs.cpio.gz --cmdline "$(cat /etc/lrd/cmdline)" \
              --output boot_b.img

## If the display never comes up
Try in order, rebooting each time:
  display.conf backend=drm    (skip HWC entirely)
  display.conf backend=hwc2   (default)
  display.conf backend=fbdev  (software; proves the kernel, not the blobs)
A black screen with a live serial console means the kernel is fine and the blob
pairing is wrong. That is progress, not failure.
