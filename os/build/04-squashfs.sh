#!/usr/bin/env bash
set -euo pipefail
ROOT="${ROOT:-out/rootfs}"
[ -d "$ROOT" ] || { echo "no rootfs at $ROOT"; exit 1; }
[ -r "$ROOT/etc/shadow" ] || { echo "cannot read etc/shadow — not in uid namespace"; exit 1; }
[ -r "$ROOT/etc/sudoers" ] || { echo "cannot read etc/sudoers"; exit 1; }
OUT="${OUT:-out/iso/live}"
mkdir -p "$OUT"
rm -f "$OUT/filesystem.squashfs"
mksquashfs "$ROOT" "$OUT/filesystem.squashfs" \
  -comp zstd -Xcompression-level 19 -noappend -no-progress \
  -all-time "${SOURCE_DATE_EPOCH:-1700000000}" \
  -e boot -wildcards -e 'var/cache/apt/*' -e 'tmp/*'

for k in "$ROOT"/boot/vmlinuz-*; do
  if [ -f "$k" ]; then
    cp -L "$k" "$OUT/vmlinuz"
    break
  fi
done

for i in "$ROOT"/boot/initrd.img-*; do
  if [ -f "$i" ]; then
    cp -L "$i" "$OUT/initrd.img"
    break
  fi
done

du -sh "$OUT/filesystem.squashfs"
