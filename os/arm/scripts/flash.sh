#!/bin/bash
# ==============================================================================
# flash.sh — Flash LibreDroid ARM image onto connected device
# Supports postmarketOS (via pmbootstrap) and fastboot recovery flashing.
# ==============================================================================
set -euo pipefail

MODE="${1:-pmbootstrap}" # pmbootstrap | fastboot | netboot

echo "── LibreDroid ARM Image Flasher ──────────────────────────"

case "$MODE" in
  pmbootstrap)
    command -v pmbootstrap >/dev/null 2>&1 || {
      echo "✗ pmbootstrap not installed. Run: pip install --user pmbootstrap"
      exit 1
    }
    echo "→ Checking device connection in fastboot mode..."
    fastboot devices || true

    echo "→ Flashing rootfs via pmbootstrap..."
    pmbootstrap flasher flash_rootfs

    echo "→ Flashing kernel via pmbootstrap..."
    pmbootstrap flasher flash_kernel

    echo "✓ Flashing complete. Rebooting into LibreDroid OS..."
    fastboot reboot
    ;;

  fastboot)
    BOOT_IMG="${2:-boot.img}"
    ROOT_IMG="${3:-rootfs.img}"
    [ -f "$BOOT_IMG" ] || { echo "✗ boot image $BOOT_IMG not found"; exit 1; }
    [ -f "$ROOT_IMG" ] || { echo "✗ rootfs image $ROOT_IMG not found"; exit 1; }

    echo "→ Flashing $BOOT_IMG to boot partition..."
    fastboot flash boot "$BOOT_IMG"

    echo "→ Flashing $ROOT_IMG to userdata/system..."
    fastboot flash userdata "$ROOT_IMG"

    echo "✓ Flashing complete. Rebooting..."
    fastboot reboot
    ;;

  *)
    echo "Usage: $0 [pmbootstrap|fastboot] [boot.img] [rootfs.img]"
    exit 1
    ;;
esac
