#!/usr/bin/env bash
# restore-stock-android.sh — One-Touch Rollback to Stock Android (OnePlus Pad Go OPD2304)
# Returns the device to stock ColorOS / Android without data loss.
set -Eeuo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/.." && pwd)"
STOCK_IMAGES="$REPO_ROOT/stock_firmware/OnePlus_Pad_Go_OPD2304_MT6789_EX_11_A.30_231025_MXML/Firmware/IMAGES"
BACKUP_DIR="${LRD_BACKUP_DIR:-$REPO_ROOT/lrd-backups}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[1;36m'; BOLD='\033[1m'; NC='\033[0m'
say(){ printf "${CYAN}::${NC} %s\n" "$*"; }
warn(){ printf "${YELLOW}!!${NC} %s\n" "$*" >&2; }
die(){ printf "${RED}xx${NC} %s\n" "$*" >&2; exit 1; }

TARGET_SLOT="a"
FULL_RESTORE=0
DRY_RUN=0
YES=0

while [ $# -gt 0 ]; do
  case "$1" in
    --slot) TARGET_SLOT="${2#_}"; shift 2 ;;
    --full|--restore-partitions) FULL_RESTORE=1; shift ;;
    --dry-run|--check) DRY_RUN=1; shift ;;
    --yes|-y) YES=1; shift ;;
    *) die "Unknown parameter: $1" ;;
  esac
done

say "${BOLD}LibreDroid OS -> Stock Android Safe Rollback Harness${NC}"

if [ "$DRY_RUN" -eq 1 ]; then
  say "${BOLD}[DRY-RUN / VERIFICATION MODE ACTIVE]${NC}"
fi

command -v fastboot >/dev/null 2>&1 || die "fastboot command not found. Please install android-tools."

if [ "$DRY_RUN" -eq 0 ]; then
  if ! fastboot devices 2>/dev/null | grep -q '[a-zA-Z0-9]'; then
    say "Device not found in fastboot mode. Checking ADB..."
    if command -v adb >/dev/null 2>&1 && adb devices 2>/dev/null | grep -w "device" | grep -q .; then
      say "Device detected in ADB. Rebooting to bootloader..."
      adb reboot bootloader
      for i in {1..30}; do
        if fastboot devices 2>/dev/null | grep -q '[a-zA-Z0-9]'; then
          break
        fi
        sleep 1
      done
    else
      die "No device detected in fastboot or ADB. Connect tablet via USB and hold Power + VolDown."
    fi
  fi

  CUR_SLOT="$(fastboot getvar current-slot 2>&1 | sed -n 's/^current-slot: //p' | head -1 || echo 'b')"
  say "Current active boot slot: ${YELLOW}slot_${CUR_SLOT}${NC}"
  say "Target rollback slot: ${GREEN}slot_${TARGET_SLOT}${NC} (Stock Android)"
else
  CUR_SLOT="b"
  say "Simulated current active boot slot: ${YELLOW}slot_${CUR_SLOT}${NC}"
  say "Simulated target rollback slot: ${GREEN}slot_${TARGET_SLOT}${NC} (Stock Android)"
fi

if [ "$FULL_RESTORE" -eq 1 ]; then
  say "Full partition restore requested. Checking stock firmware repository..."
  [ -d "$STOCK_IMAGES" ] || die "Stock firmware directory not found at $STOCK_IMAGES"
  
  for part in boot vendor_boot dtbo vbmeta vbmeta_system vbmeta_vendor; do
    IMG="$STOCK_IMAGES/${part}.img"
    if [ ! -f "$IMG" ] && [ -f "$BACKUP_DIR/${part}_${TARGET_SLOT}.img" ]; then
      IMG="$BACKUP_DIR/${part}_${TARGET_SLOT}.img"
    fi
    [ -f "$IMG" ] || die "Required partition image for $part not found in stock firmware or backups!"
    say "  • Verified stock image: $part -> $IMG ($(du -h "$IMG" | cut -f1))"
  done

  if [ "$DRY_RUN" -eq 0 ]; then
    if [ "$YES" -ne 1 ]; then
      printf "\n${YELLOW}Flash stock partition binaries to slot_${TARGET_SLOT}? [y/N]: ${NC}"
      read -r ans
      [ "$ans" = y ] || [ "$ans" = Y ] || exit 0
    fi

    for part in boot vendor_boot dtbo vbmeta vbmeta_system vbmeta_vendor; do
      IMG="$STOCK_IMAGES/${part}.img"
      [ -f "$IMG" ] || IMG="$BACKUP_DIR/${part}_${TARGET_SLOT}.img"
      say "Flashing stock partition ${part}_${TARGET_SLOT}..."
      fastboot flash "${part}_${TARGET_SLOT}" "$IMG"
    done
  fi
fi

if [ "$DRY_RUN" -eq 0 ]; then
  say "Switching active boot slot to slot_${TARGET_SLOT}..."
  fastboot set_active "$TARGET_SLOT" || fastboot --set-active="$TARGET_SLOT"
  say "Rebooting device into stock Android..."
  fastboot reboot
  echo -e "\n${GREEN}${BOLD}✔ Rollback complete! The tablet is now booting stock Android.${NC}\n"
else
  say "[DRY-RUN] Would execute: fastboot set_active ${TARGET_SLOT}"
  say "[DRY-RUN] Would execute: fastboot reboot"
  echo -e "\n${GREEN}${BOLD}✔ Dry-run rollback verification passed successfully.${NC}\n"
fi
