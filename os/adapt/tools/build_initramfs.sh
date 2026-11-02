#!/usr/bin/env bash
# build_initramfs.sh — Packs the Halium initramfs into initramfs.cpio.gz
set -Eeuo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
TOP="$(cd "$HERE/../../.." && pwd)"
OUT_DIR="${1:-$PWD/initramfs-out}"
mkdir -p "$OUT_DIR"
OUT="$(cd "$OUT_DIR" && pwd)"
INIT_SRC="$TOP/os/adapt/initramfs/init"

mkdir -p "$OUT"
WORKDIR="$OUT/root"
rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"/{bin,sbin,usr/bin,usr/sbin,proc,sys,dev,run,overlay,newroot,lower,vendor,odm,product,dev/pts,dev/binderfs}

# 1. Install init script
cp "$INIT_SRC" "$WORKDIR/init"
chmod +x "$WORKDIR/init"

# 2. Check for busybox binary
# Order of preference:
#  a) Explicit BUSYBOX_BIN environment variable (must be ARM64)
#  b) Prebuilt ARM64 busybox in os/adapt/initramfs/bin/busybox
#  c) Extracted ARM64 package in /tmp/bb_arm64_pkg/usr/bin/busybox
#  d) Host busybox (ONLY if target is ARM64)
BB="${BUSYBOX_BIN:-}"

is_arm64() {
  local bin="$1"
  [ -f "$bin" ] && file -b "$bin" | grep -qE "ARM aarch64|aarch64|ARM, EABI5"
}

if [ -n "$BB" ] && ! is_arm64 "$BB"; then
  echo ":: Warning: Provided BUSYBOX_BIN ($BB) is not an ARM64 binary. Ignoring."
  BB=""
fi

if [ -z "$BB" ] && [ -f "$TOP/os/adapt/initramfs/bin/busybox" ] && is_arm64 "$TOP/os/adapt/initramfs/bin/busybox"; then
  BB="$TOP/os/adapt/initramfs/bin/busybox"
elif [ -z "$BB" ] && [ -f "/tmp/bb_arm64_pkg/usr/bin/busybox" ] && is_arm64 "/tmp/bb_arm64_pkg/usr/bin/busybox"; then
  BB="/tmp/bb_arm64_pkg/usr/bin/busybox"
elif [ -z "$BB" ] && command -v busybox >/dev/null 2>&1 && is_arm64 "$(command -v busybox)"; then
  BB="$(command -v busybox)"
fi

if [ -z "$BB" ]; then
  echo ":: Downloading native Debian ARM64 static busybox binary..."
  mkdir -p /tmp/bb_arm64_download
  curl -fsSL "http://ftp.debian.org/debian/pool/main/b/busybox/busybox-static_1.38.0-3+b1_arm64.deb" -o /tmp/bb_arm64_download/busybox.deb 2>/dev/null || true
  if [ -f /tmp/bb_arm64_download/busybox.deb ]; then
    dpkg-deb -x /tmp/bb_arm64_download/busybox.deb /tmp/bb_arm64_download/pkg
    if [ -f /tmp/bb_arm64_download/pkg/usr/bin/busybox ]; then
      mkdir -p "$TOP/os/adapt/initramfs/bin"
      cp /tmp/bb_arm64_download/pkg/usr/bin/busybox "$TOP/os/adapt/initramfs/bin/busybox"
      BB="$TOP/os/adapt/initramfs/bin/busybox"
    fi
  fi
fi

if [ -n "$BB" ] && [ -f "$BB" ]; then
  cp "$BB" "$WORKDIR/bin/busybox"
  chmod +x "$WORKDIR/bin/busybox"
  # Create symlinks for essential initramfs commands
  for applet in sh echo mount umount mkdir rm rmdir ls cat sleep switch_root blkid find chmod chown; do
    ln -sf busybox "$WORKDIR/bin/$applet" 2>/dev/null || true
  done
  echo ":: Installed busybox from $BB"
else
  echo ":: Note: No static busybox binary found. Provide BUSYBOX_BIN=<path> if required."
fi

# 3. Pack as cpio.gz
OUTPUT_CPIO="$OUT/initramfs.cpio.gz"
(
  cd "$WORKDIR"
  find . -mindepth 1 | sort | cpio -o -H newc -R 0:0 2>/dev/null | gzip -9 > "$OUTPUT_CPIO"
)

echo ":: Built Halium initramfs: $OUTPUT_CPIO ($(du -h "$OUTPUT_CPIO" | cut -f1))"
