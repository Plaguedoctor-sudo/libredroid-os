# LibreDroid OS — ARM Porting & Deployment Guide

This directory contains the architecture, tooling, and package recipes for deploying LibreDroid OS on ARM64 devices via **postmarketOS (pmaports)** and **Droidian/Halium**.

---

## 1. Device Feasibility & Decision Matrix

| Device | SoC | Mainline Linux | GPU Accel | Waydroid | RAM | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OnePlus 6T (fajita)** | SDM845 | ✅ Mature | `freedreno` ✅ | ✅ Fast | 6–8 GB | **10/10** — Recommended test target (~$90 used) |
| **Pixel 3a (sargo)** | SDM670 | ✅ Good | `freedreno` ✅ | ✅ Works | 4 GB | **8/10** |
| **PineTab2 / PineTab-V**| RK3566 | ✅ Good | `panfrost` ✅ | ⚠️ Slow | 4 GB | **7/10** — Buyable new tablet |
| **PinePhone Pro** | RK3399S | ✅ Mature | `panfrost` | ⚠️ Slow | 4 GB | **7/10** |
| **Fairphone 4 (FP4)** | SM7225 | ⚠️ Partial | `freedreno` | ✅ Works | 6 GB | **6/10** |
| **OnePlus Pad (ovaltine)**| MT6983 | ⚠️ Incomplete | `panthor` (needs DTS) | ❌ | 8–12 GB | **2/10** today (mainline) / **6/10** (Droidian) |

### The OnePlus Pad (MT6983) Triage

MediaTek Dimensity 9000 is challenging for mainline Linux:
- **No upstream DTS**: Needs ~1500 lines of device tree definitions.
- **No `mtk-drm` support**: Displays on MT6983 require a new SoC display glue driver.
- **Vendor kernel 5.10/5.15 BSP**: Heavily patched, out-of-tree drivers.
- **Dynamic Super Partitions & A/B**: Rootfs flashing requires fastboot initramfs chaining.

**Recommendation**: Treat the OnePlus Pad as a web/kiosk target for the React shell today, or pursue the [Droidian/Halium path](file:///home/nitin/fkgugal/os/arm/droidian/README.md). For native mainline porting, use an SDM845 device (e.g. OnePlus 6T).

---

## 2. Porting Feasibility Probe

Before investing in porting, connect your device with USB debugging enabled and run:

```bash
chmod +x os/arm/scripts/arm-probe.sh
./os/arm/scripts/arm-probe.sh
```

The script evaluates:
- SoC family (Qualcomm / Rockchip vs. MediaTek).
- Kernel version and availability of `/proc/config.gz`.
- Availability of live DTB at `/sys/firmware/fdt`.
- GPU renderer driver path (`freedreno`, `panfrost`, `panthor`).
- Existing `pmaports` support.

---

## 3. Fast Path — postmarketOS (pmaports)

For supported devices (e.g., OnePlus 6T / `oneplus-fajita`):

```bash
# 1. Install pmbootstrap & clone pmaports
pip install --user pmbootstrap
git clone https://gitlab.com/postmarketOS/pmaports.git ~/pmaports
export PMAPORTS=~/pmaports

# 2. Initialize device profile (use ui=none and systemd)
pmbootstrap init          # vendor=oneplus device=fajita ui=none systemd

# 3. Stage LibreDroid packages into pmaports
chmod +x os/arm/scripts/install-into-pmaports.sh
./os/arm/scripts/install-into-pmaports.sh

# 4. Build and flash
pmbootstrap install --add=libredroid-meta --systemd
chmod +x os/arm/scripts/flash.sh
./os/arm/scripts/flash.sh pmbootstrap
```

---

## 4. Kernel Configuration Fragment

Mainline and BSP kernels must satisfy the options in [`libredroid.fragment`](file:///home/nitin/fkgugal/os/arm/pmaports/libredroid-kernel-fragment/libredroid.fragment):
- `CONFIG_NFT_REDIRECT=y` — Essential for transparent Tor redirection in `lrd-tor-gw`.
- `CONFIG_ANDROID_BINDERFS=y` — Required for Waydroid.
- `CONFIG_NAMESPACES=y`, `CONFIG_NET_NS=y`, `CONFIG_USER_NS=y` — Namespace isolation fabric.
- `CONFIG_DRM_FREEDRENO=y` / `CONFIG_DRM_PANFROST=y` / `CONFIG_DRM_PANTHOR=y` — Hardware GPU acceleration.

Verify options after kernel compilation:
```bash
for o in CONFIG_ANDROID_BINDERFS CONFIG_SECCOMP_FILTER CONFIG_SECURITY_LANDLOCK \
         CONFIG_NFT_REDIRECT CONFIG_VETH CONFIG_DRM_PANTHOR; do
  grep -q "^$o=y" .config || echo "MISSING: $o"
done
```

---

## 5. Waydroid on ARM Gotchas

1. **Mount binderfs**:
   ```bash
   mkdir -p /dev/binderfs
   mount -t binder binder /dev/binderfs
   ```
2. **Verify GBM GPU acceleration**:
   ```bash
   ls /usr/lib/dri/ | grep -E 'panfrost|freedreno|panthor'
   ```
3. **Initialize Vanilla ARM64 image**:
   ```bash
   waydroid init -s VANILLA -c https://ota.waydro.id/system -v https://ota.waydro.id/vendor
   systemctl enable --now waydroid-container
   waydroid session start &
   ```
4. **Black screen workaround**:
   Set `MESA_LOADER_DRIVER_OVERRIDE=freedreno` (or `panfrost`) and `WAYDROID_GRALLOC=gbm`.
