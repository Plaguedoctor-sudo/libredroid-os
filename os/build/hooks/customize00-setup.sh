#!/bin/sh
set -e
ROOT="$1"

if [ -z "$ROOT" ] || [ "$ROOT" = "/" ]; then
  /bin/sh "$(dirname "$0")/90-setup.chroot"
else
  cp "$(dirname "$0")/90-setup.chroot" "$ROOT/tmp/90-setup.chroot"
  chmod +x "$ROOT/tmp/90-setup.chroot"
  chroot "$ROOT" /bin/sh /tmp/90-setup.chroot
  rm -f "$ROOT/tmp/90-setup.chroot"
  if [ ! -e "$ROOT/boot/vmlinuz" ]; then
    for k in "$ROOT"/boot/vmlinuz-*; do
      if [ -f "$k" ]; then
        ln -sf "$(basename "$k")" "$ROOT/boot/vmlinuz"
        break
      fi
    done
  fi
fi
