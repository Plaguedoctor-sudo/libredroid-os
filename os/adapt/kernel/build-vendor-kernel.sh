#!/usr/bin/env bash
# Rebuild the VENDOR kernel with the lrd fragment. This is what makes the
# isolation claims true on real Android hardware.
set -Eeuo pipefail
SRC="${1:?kernel source tree}"
FRAG="${2:?path to lrd-kernel.fragment}"
OUT="${OUT:-$PWD/kernel-out}"
command -v aarch64-linux-gnu-gcc >/dev/null || { echo "apt install gcc-aarch64-linux-gnu"; exit 1; }
mkdir -p "$OUT"

cd "$SRC"
# some vendor trees ship a build script, some are plain kbuild
if [ -x build/build.sh ]; then
  echo ":: vendor build script detected"
  ./build/build.sh "$FRAG"
else
  make O="$OUT" ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- defconfig
  "$SRC/scripts/kconfig/merge_config.sh" -m "$OUT/.config" "$FRAG"
  make O="$OUT" ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- olddefconfig
  make O="$OUT" ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- -j"$(nproc)" Image dtbs
fi

echo ":: verifying the load-bearing options actually landed"
for k in CONFIG_NFT_REDIRECT CONFIG_SECURITY_LANDLOCK CONFIG_OVERLAY_FS CONFIG_USER_NS CONFIG_ANDROID_BINDERFS; do
  if grep -q "^${k}=y" "$OUT/.config"; then echo "  ok   $k"; else echo "  MISS $k"; fi
done

echo ":: Image: $OUT/arch/arm64/boot/Image"
echo ":: next: repack into boot.img with the stock header + DTB + our initramfs"
echo "   (use mkbootimg with the --header-version and --dtb taken from the stock boot.img)"
