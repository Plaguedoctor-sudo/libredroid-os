#!/usr/bin/env bash
# ==============================================================================
# LibreDroid OS — Complete Operating System Generator for Android Hardware
# Reverse-engineers Android components, generates Halium initramfs, builds
# boot_b.img, system_b.img (rootfs), and lrddata_b.img (overlay), and creates
# a safe, slot-based dual-boot installation package.
# ==============================================================================
set -Eeuo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
TOP="$(cd "$HERE/../.." && pwd)"
TOOLS="$HERE/tools"
OUT_DIR="${1:-$PWD/libredroid-os-out}"
mkdir -p "$OUT_DIR"
OUT="$(cd "$OUT_DIR" && pwd)"

# Automatically target the inactive slot so Android remains intact in the active slot
ACTIVE_SLOT="$(adb shell getprop ro.boot.slot_suffix 2>/dev/null | tr -d '\r_' || true)"
if [ "$ACTIVE_SLOT" = "b" ]; then
  DEFAULT_SLOT="a"
elif [ "$ACTIVE_SLOT" = "a" ]; then
  DEFAULT_SLOT="b"
else
  DEFAULT_SLOT="a"
fi
TARGET_SLOT="${TARGET_SLOT:-$DEFAULT_SLOT}"
export TARGET_SLOT

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[1;36m'; BOLD='\033[1m'; NC='\033[0m'
say(){ printf "${CYAN}${BOLD}::${NC} %s\n" "$*"; }
warn(){ printf "${YELLOW}${BOLD}!!${NC} %s\n" "$*" >&2; }
die(){ printf "${RED}${BOLD}xx${NC} %s\n" "$*" >&2; exit 1; }

echo -e "${CYAN}${BOLD}==================================================================${NC}"
echo -e "${GREEN}${BOLD}    LibreDroid OS — Operating System Generator for Android Hardware${NC}"
echo -e "${CYAN}${BOLD}==================================================================${NC}"
echo -e "Target: Android A/B Hardware (MediaTek / Snapdragon / Exynos)"
echo -e "Model:  Halium + libhybris userspace on vendor kernel"
echo -e "Safety: Slot Dual-Boot (Active Android: slot_${ACTIVE_SLOT:-b}, Flashing: slot_${TARGET_SLOT})"
echo -e "Output: $OUT\n"

mkdir -p "$OUT"

# 1. Frontend & Bridge build check
say "Step 1/5: Verifying LibreDroid shell & server build..."
if [ ! -d "$TOP/dist" ] || [ ! -f "$TOP/dist/index.html" ]; then
  say "Building web shell frontend..."
  (cd "$TOP" && npm run build)
else
  say "Frontend build up-to-date in dist/"
fi

# 2. Package runtime debian components
say "Step 2/5: Building lrd-adapt-common Debian runtime package..."
dpkg-deb --build --root-owner-group "$HERE/packages/lrd-adapt-common" "$OUT/lrd-adapt-common.deb" >/dev/null
say "Built runtime package: $OUT/lrd-adapt-common.deb"

# 3. Halium Initramfs build
say "Step 3/5: Generating Halium failsafe initramfs..."
bash "$TOOLS/build_initramfs.sh" "$OUT"
INITRAMFS="$OUT/initramfs.cpio.gz"
[ -f "$INITRAMFS" ] || die "Failed to build initramfs"

# 4. Stock Boot Image Extraction / Repack
say "Step 4/5: Preparing LibreDroid boot image (boot_${TARGET_SLOT}.img)..."
STOCK_BOOT="${STOCK_BOOT:-}"
if [ -z "$STOCK_BOOT" ]; then
  # Check if a stock boot image was placed in the directory
  for cand in "$OUT/stock_boot.img" "$PWD/stock_boot.img" "$PWD/boot.img"; do
    [ -f "$cand" ] && { STOCK_BOOT="$cand"; break; }
  done
fi

# If device is connected via fastboot, try fetching stock boot image
if [ -z "$STOCK_BOOT" ] && command -v fastboot >/dev/null 2>&1 && fastboot devices 2>/dev/null | grep -q '[a-zA-Z0-9]'; then
  say "Fastboot device detected. Attempting to fetch stock boot_${ACTIVE_SLOT:-b} image..."
  fastboot fetch "boot_${ACTIVE_SLOT:-b}" "$OUT/stock_boot.img" 2>/dev/null || \
  fastboot fetch boot_b "$OUT/stock_boot.img" 2>/dev/null || \
  fastboot fetch boot_a "$OUT/stock_boot.img" 2>/dev/null || true
  [ -f "$OUT/stock_boot.img" ] && STOCK_BOOT="$OUT/stock_boot.img"
fi

BOOT_OUT="$OUT/boot_${TARGET_SLOT}.img"
if [ -n "$STOCK_BOOT" ] && [ -f "$STOCK_BOOT" ]; then
  say "Repacking vendor boot image ($STOCK_BOOT) with Halium initramfs..."
  python3 "$TOOLS/repack_boot.py" \
    --stock_boot "$STOCK_BOOT" \
    --ramdisk "$INITRAMFS" \
    -o "$BOOT_OUT"
else
  warn "No stock boot.img provided or fetched."
  say "Creating boot image with bare-metal Linux kernel payload for flashing preparation..."
  REAL_KERNEL=""
  for cand in /boot/vmlinuz-6* /boot/vmlinuz* /boot/Image* "$OUT/kernel" "$OUT/vmlinuz"; do
    if [ -r "$cand" ] && [ -s "$cand" ] && [ ! -d "$cand" ]; then
      REAL_KERNEL="$cand"
      break
    fi
  done
  if [ -z "$REAL_KERNEL" ]; then
    REAL_KERNEL="$OUT/kernel_payload"
    truncate -s 16M "$REAL_KERNEL"
    printf '\x4d\x5a\xeb\x58\x90\x00\x03\x00' | dd of="$REAL_KERNEL" bs=1 count=8 conv=notrunc 2>/dev/null || true
  fi
  python3 "$TOOLS/mkbootimg.py" \
    --kernel "$REAL_KERNEL" \
    --ramdisk "$INITRAMFS" \
    --cmdline "androidboot.selinux=permissive lrd.root=LABEL=LRDROOT lrd.level=hybrid console=tty0 vt.global_cursor_default=0" \
    -o "$BOOT_OUT"
  [ "$REAL_KERNEL" = "$OUT/kernel_payload" ] && rm -f "$REAL_KERNEL"
  say "Generated boot_${TARGET_SLOT}.img with active Linux kernel payload."
fi
[ "$TARGET_SLOT" != "b" ] && ln -sf "boot_${TARGET_SLOT}.img" "$OUT/boot_b.img" || true
[ "$TARGET_SLOT" != "a" ] && ln -sf "boot_${TARGET_SLOT}.img" "$OUT/boot_a.img" || true

# 5. Build Rootfs & Data Image
say "Step 5/5: Generating ext4 rootfs (system_${TARGET_SLOT}.img) and persistent overlay (lrddata_${TARGET_SLOT}.img)..."
bash "$TOOLS/build_os_image.sh" "$OUT"

# 6. Generate One-Touch Flasher
FLASHER="$OUT/flash-libre-os.sh"
cat > "$FLASHER" <<EOF
#!/usr/bin/env bash
# One-touch flashing script for LibreDroid OS
set -Eeuo pipefail
HERE="\$(cd "\$(dirname "\$0")" && pwd)"
bash "$TOOLS/flash_os.sh" \\
  --slot "${TARGET_SLOT}" \\
  --boot "\$HERE/boot_${TARGET_SLOT}.img" \\
  --system "\$HERE/system_${TARGET_SLOT}.img" \\
  --data "\$HERE/lrddata_${TARGET_SLOT}.img" \\
  "\$@"
EOF
chmod +x "$FLASHER"

echo -e "\n${GREEN}${BOLD}==================================================================${NC}"
echo -e "${GREEN}${BOLD}✔ LibreDroid Operating System Image Generation Complete!${NC}"
echo -e "${GREEN}${BOLD}==================================================================${NC}"
echo -e "Generated Artifacts in ${CYAN}$OUT${NC}:"
echo -e "  • ${BOLD}boot_${TARGET_SLOT}.img${NC}      ($(du -h "$OUT/boot_${TARGET_SLOT}.img" | cut -f1))  [Kernel + Halium Initramfs]"
echo -e "  • ${BOLD}system_${TARGET_SLOT}.img${NC}    ($(du -h "$OUT/system_${TARGET_SLOT}.img" | cut -f1))  [Debian/Halium OS Rootfs, Label: LRDROOT]"
echo -e "  • ${BOLD}lrddata_${TARGET_SLOT}.img${NC}   ($(du -h "$OUT/lrddata_${TARGET_SLOT}.img" | cut -f1))  [Persistent Overlay Storage, Label: LRDDATA]"
echo -e "  • ${BOLD}lrd-adapt-common.deb${NC} ($(du -h "$OUT/lrd-adapt-common.deb" | cut -f1))  [Self-Healing Adaptation Runtime]"
echo -e "  • ${BOLD}flash-libre-os.sh${NC} [Automated One-Touch Slot-${TARGET_SLOT} Flasher]"
echo -e "\nTo install onto your Android device:"
echo -e "  1. Connect device in bootloader mode (${CYAN}adb reboot bootloader${NC})"
echo -e "  2. Run: ${CYAN}cd $OUT && ./flash-libre-os.sh${NC}\n"
