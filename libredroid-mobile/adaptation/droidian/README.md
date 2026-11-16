# Droidian / Halium Porting Path for MediaTek Dimensity 9000 (MT6983)

This directory contains the Debos recipe and adaptation configuration to run the LibreDroid sovereign stack on top of **Droidian** (Debian GNU/Linux on an Android BSP kernel using libhybris).

---

## Why Droidian for the OnePlus Pad?

Mainline Linux on MT6983 currently lacks:
- Upstream Device Tree Source (DTS).
- Display controller drivers in `mtk-drm`.
- Public TRM for register-level bring-up.

Droidian bypasses this by booting the vendor's 5.15 Android kernel and using `libhybris` to load vendor graphics drivers (`gralloc`, `hwcomposer`, `libui`) under a Debian glibc userland.

---

## Files

- `debos.yaml`: Debos build recipe pulling the arm64 rootfs and LibreDroid services.
- `adaptation.conf`: Device configuration declaring Halium 12.0, kernel 5.15, and MTK gralloc.
- `rootfs-overlay/`:
  - `etc/systemd/system/libredroid-bridge.service`: Bridge systemd unit.
  - `opt/libredroid/install-droidian.sh`: Post-installation initialization script.

---

## Building with Debos

1. Install `debos`:
   ```bash
   sudo apt install debos
   ```
2. Build the rootfs:
   ```bash
   debos -t architecture:arm64 -t device:onepad debos.yaml
   ```

## Extracting Required Vendor Blobs

To prepare the Halium shims:
```bash
adb shell 'ls -la /vendor/lib64/*gralloc* /vendor/lib64/*hwcomposer* /vendor/lib64/hw/*'
adb shell 'cp /vendor/lib64/libgralloc.mtk.so /data/local/tmp/'
adb pull /data/local/tmp/libgralloc.mtk.so
```
