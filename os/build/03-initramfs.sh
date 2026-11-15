#!/usr/bin/env bash
set -euo pipefail
ROOT="${ROOT:-out/rootfs}"
[ -d "$ROOT" ] || { echo "no rootfs at $ROOT"; exit 1; }

COMP="gzip"
if [ -x "$ROOT/usr/bin/zstd" ] || [ -x "$ROOT/bin/zstd" ]; then
  COMP="zstd"
fi

cat > "$ROOT/etc/initramfs-tools/initramfs.conf" <<EOF
MODULES=most
BUSYBOX=auto
KEYMAP=n
COMPRESS=$COMP
DEVICE=
NFSROOT=auto
EOF

cleanup() {
  for m in sys proc dev/pts dev; do
    umount -l "$ROOT/$m" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

for m in dev proc sys; do
  mkdir -p "$ROOT/$m"
  mount --bind /$m "$ROOT/$m" 2>/dev/null || mount -t "$m" "$m" "$ROOT/$m" 2>/dev/null || true
done

chroot "$ROOT" update-initramfs -u -k all
