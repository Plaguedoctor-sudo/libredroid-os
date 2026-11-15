#!/usr/bin/env bash
set -euo pipefail
ISO="${1:-out/libredroid-universal-x86_64.iso}"
ROOT="${ROOT:-out/rootfs}"
mkdir -p out/iso/live
for m in "$ROOT/boot/memtest86+.bin" "$ROOT/boot/memtest86+.elf" "$ROOT/boot/memtest86+" "$ROOT/usr/lib/memtest86+/memtest.bin" /usr/lib/memtest86+/memtest.bin; do
  if [ -f "$m" ]; then
    cp -L "$m" out/iso/live/memtest86+ 2>/dev/null || true
    break
  fi
done

mkdir -p out/iso/boot/grub
cat > out/iso/boot/grub/grub.cfg <<'EOF'
set timeout=5
set default=0
menuentry "LibreDroid Live" {
  linux /live/vmlinuz boot=live console=tty1 console=ttyS0,115200n8 quiet loglevel=4
  initrd /live/initrd.img
}
menuentry "LibreDroid Live (safe mode)" {
  linux /live/vmlinuz boot=live console=tty1 console=ttyS0,115200n8 nomodeset systemd.unit=multi-user.target
  initrd /live/initrd.img
}
menuentry "Memtest" { linux /live/memtest86+ ; }
EOF
grub-mkrescue -o "$ISO" out/iso/ -- -volid LIBREDROID
ls -lh "$ISO"
