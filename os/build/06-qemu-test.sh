#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/lib/artifact-name.sh"
ISO="${1:-out/$(lrd_iso x86_64)}"
ACCEL=""
CPU_OPT=""
if [ -e /dev/kvm ]; then
  ACCEL="-enable-kvm"
  CPU_OPT="-cpu host"
fi
DISPLAY_OPT="gtk"
[ -z "${DISPLAY:-}" ] && DISPLAY_OPT="none"
[ -n "${QEMU_DISPLAY:-}" ] && DISPLAY_OPT="$QEMU_DISPLAY"
SERIAL_OPT="mon:stdio"
[ ! -t 1 ] && SERIAL_OPT="stdio"
[ -n "${QEMU_SERIAL:-}" ] && SERIAL_OPT="$QEMU_SERIAL"

timeout 300 qemu-system-x86_64 $ACCEL $CPU_OPT -m 4096 -smp 4 \
  -drive file="$ISO",format=raw,media=cdrom \
  -vga virtio -display "$DISPLAY_OPT" -serial "$SERIAL_OPT" \
  -boot d
