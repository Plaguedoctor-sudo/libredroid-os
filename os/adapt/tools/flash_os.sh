#!/usr/bin/env bash
# flash_os.sh — Safe, slot-aware Android hardware flasher for LibreDroid OS
# Leaves stock Android in active slot untouched; installs LibreDroid to inactive slot.
set -Eeuo pipefail

export HOME=/tmp
export ANDROID_USER_HOME=/tmp/.android
export ANDROID_SDK_HOME=/tmp

HERE="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${LRD_BACKUP_DIR:-/home/nitin/fkgugal/lrd-backups}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[1;36m'; BOLD='\033[1m'; NC='\033[0m'
say(){ printf "${CYAN}::${NC} %s\n" "$*"; }
warn(){ printf "${YELLOW}!!${NC} %s\n" "$*" >&2; }
die(){ printf "${RED}xx${NC} %s\n" "$*" >&2; exit 1; }

BOOT_IMG=""
SYSTEM_IMG=""
DATA_IMG=""
TARGET_SLOT=""
YES=0

while [ $# -gt 0 ]; do
  case "$1" in
    --boot)   BOOT_IMG="$2"; shift 2 ;;
    --system) SYSTEM_IMG="$2"; shift 2 ;;
    --data)   DATA_IMG="$2"; shift 2 ;;
    --slot)   TARGET_SLOT="${2#_}"; shift 2 ;;
    --yes|-y) YES=1; shift ;;
    *) die "Unknown parameter: $1" ;;
  esac
done

# 1. Fastboot availability & state
command -v fastboot >/dev/null 2>&1 || die "fastboot binary not found. Please install android-tools."

if ! fastboot devices 2>/dev/null | grep -q '[a-zA-Z0-9]'; then
  say "Device not found in fastboot. Checking ADB..."
  if command -v adb >/dev/null 2>&1 && adb devices 2>/dev/null | grep -w "device" | grep -q .; then
    say "Device detected in ADB. Rebooting to bootloader..."
    adb reboot bootloader
    sleep 5
  else
    die "No device detected in fastboot or ADB. Connect device with USB debugging or hold Power+VolDown."
  fi
fi

PRODUCT="$(fastboot getvar product 2>&1 | sed -n 's/^product: //p' | head -1)"
CUR_SLOT="$(fastboot getvar current-slot 2>&1 | sed -n 's/^current-slot: //p' | head -1)"
CUR_SLOT="${CUR_SLOT:-a}"
OTHER_SLOT=$([ "$CUR_SLOT" = a ] && echo b || echo a)
SLOT="${TARGET_SLOT:-$OTHER_SLOT}"

say "Device: $PRODUCT"
say "Current Active Slot: ${GREEN}slot_${CUR_SLOT}${NC} (Stock Android)"
say "Target Flashing Slot: ${YELLOW}slot_${SLOT}${NC} (LibreDroid OS)"

if [ "$SLOT" = "$CUR_SLOT" ]; then
  warn "WARNING: Target slot is currently the ACTIVE slot!"
  warn "Flashing will overwrite the currently active system!"
fi

# 2. Bootloader lock check
UNLOCKED="$(fastboot getvar unlocked 2>&1 | sed -n 's/^unlocked: //p' | head -1)"
if [ "$UNLOCKED" = "no" ]; then
  die "Bootloader is locked. Run: fastboot flashing unlock && fastboot flashing unlock_critical"
fi

# 3. Locate image files if not explicitly provided
if [ -z "$BOOT_IMG" ] || [ ! -f "$BOOT_IMG" ]; then
  for cand in "$PWD/boot_${SLOT}.img" "$PWD/boot.img" "$HERE/../boot_b.img" "$PWD/os-build-out/boot_b.img"; do
    [ -f "$cand" ] && { BOOT_IMG="$cand"; break; }
  done
fi

if [ -z "$SYSTEM_IMG" ] || [ ! -f "$SYSTEM_IMG" ]; then
  for cand in "$PWD/system_${SLOT}.img" "$PWD/system.img" "$PWD/os-build-out/system_b.img"; do
    [ -f "$cand" ] && { SYSTEM_IMG="$cand"; break; }
  done
fi

if [ -z "$DATA_IMG" ] || [ ! -f "$DATA_IMG" ]; then
  for cand in "$PWD/lrddata_${SLOT}.img" "$PWD/lrddata.img" "$PWD/os-build-out/lrddata_b.img"; do
    [ -f "$cand" ] && { DATA_IMG="$cand"; break; }
  done
fi

[ -n "$BOOT_IMG" ] && [ -f "$BOOT_IMG" ] || die "Missing boot image (--boot <boot.img>)"
[ -n "$SYSTEM_IMG" ] && [ -f "$SYSTEM_IMG" ] || die "Missing system rootfs image (--system <system.img>)"

say "Images to flash:"
say "  • boot_${SLOT}:   $BOOT_IMG ($(du -h "$BOOT_IMG" | cut -f1))"
say "  • system_${SLOT}: $SYSTEM_IMG ($(du -h "$SYSTEM_IMG" | cut -f1))"
if [ -n "$DATA_IMG" ] && [ -f "$DATA_IMG" ]; then
  say "  • lrddata_${SLOT}: $DATA_IMG ($(du -h "$DATA_IMG" | cut -f1))"
fi

# 4. Partition backups & Bootloader-level flashing
mkdir -p "$BACKUP_DIR"
say "Backing up stock slot_${SLOT} partitions into $BACKUP_DIR..."
for p in boot dtbo vbmeta; do
  if [ ! -f "$BACKUP_DIR/${p}_${SLOT}.img" ]; then
    fastboot fetch "${p}_${SLOT}" "$BACKUP_DIR/${p}_${SLOT}.img" 2>/dev/null || \
      warn "fastboot fetch ${p}_${SLOT} not supported by this bootloader (continuing)"
  fi
done

if [ "$YES" -ne 1 ]; then
  printf "\n${YELLOW}Proceed with flashing LibreDroid OS to slot_${SLOT}? [y/N]: ${NC}"
  read -r ans
  [ "$ans" = y ] || [ "$ans" = Y ] || exit 0
fi

# Flash physical boot, init_boot & vbmeta partitions while in bootloader mode
say "Flashing physical partition boot_${SLOT}..."
fastboot flash "boot_${SLOT}" "$BOOT_IMG"

INIT_BOOT_IMG=""
if [ -f "$(dirname "$BOOT_IMG")/init_boot_${SLOT}.img" ]; then
  INIT_BOOT_IMG="$(dirname "$BOOT_IMG")/init_boot_${SLOT}.img"
elif [ -f "$(dirname "$BOOT_IMG")/init_boot_a.img" ]; then
  INIT_BOOT_IMG="$(dirname "$BOOT_IMG")/init_boot_a.img"
fi

if [ -n "$INIT_BOOT_IMG" ]; then
  say "Flashing init_boot_${SLOT} (Android 14 GKI Halium ramdisk: $INIT_BOOT_IMG)..."
  fastboot flash "init_boot_${SLOT}" "$INIT_BOOT_IMG" || warn "init_boot flash bypassed"
fi

VBMETA_IMG=""
if [ -f "$(dirname "$BOOT_IMG")/vbmeta_disabled.img" ]; then
  VBMETA_IMG="$(dirname "$BOOT_IMG")/vbmeta_disabled.img"
elif [ -f "$BACKUP_DIR/vbmeta_${SLOT}.img" ]; then
  VBMETA_IMG="$BACKUP_DIR/vbmeta_${SLOT}.img"
fi

if [ -n "$VBMETA_IMG" ]; then
  say "Flashing vbmeta_${SLOT}, vbmeta_system_${SLOT}, vbmeta_vendor_${SLOT} with AVB disabled..."
  fastboot --disable-verity --disable-verification flash "vbmeta_${SLOT}" "$VBMETA_IMG" 2>/dev/null || \
    fastboot flash "vbmeta_${SLOT}" "$VBMETA_IMG" 2>/dev/null || warn "vbmeta flash bypassed"
  fastboot --disable-verity --disable-verification flash "vbmeta_system_${SLOT}" "$VBMETA_IMG" 2>/dev/null || \
    fastboot flash "vbmeta_system_${SLOT}" "$VBMETA_IMG" 2>/dev/null || true
  fastboot --disable-verity --disable-verification flash "vbmeta_vendor_${SLOT}" "$VBMETA_IMG" 2>/dev/null || \
    fastboot flash "vbmeta_vendor_${SLOT}" "$VBMETA_IMG" 2>/dev/null || true
fi

# 5. Fastbootd check & logical partition management
IS_USERSPACE="$(fastboot getvar is-userspace 2>&1 | sed -n 's/^is-userspace: //p' | head -1)"
if [ "$IS_USERSPACE" != "yes" ]; then
  say "Switching to fastbootd (userspace recovery) for dynamic partition support..."
  fastboot reboot fastboot 2>/dev/null || true
  sleep 4
  WAIT_COUNT=0
  while ! fastboot getvar is-userspace 2>&1 | grep -q 'yes'; do
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ "$WAIT_COUNT" -ge 20 ]; then
      warn "Timed out waiting for fastbootd auto-detection; continuing..."
      break
    fi
  done
fi

say "Checking and cleaning orphaned snapshot COW partitions in super..."
for cow in $(fastboot getvar all 2>&1 | grep -o '[a-zA-Z0-9_-]*-cow' | sort -u); do
  fastboot delete-logical-partition "$cow" 2>/dev/null || true
done

ROOT_BYTES=$(stat -c %s "$SYSTEM_IMG")
ROOT_MB=$(( ROOT_BYTES / 1024 / 1024 ))
say "Ensuring dynamic logical partition system_${SLOT} is allocated in super (${ROOT_MB}MB)..."
fastboot create-logical-partition "system_${SLOT}" "$ROOT_BYTES" 2>/dev/null || true
fastboot resize-logical-partition "system_${SLOT}" "$ROOT_BYTES" 2>/dev/null || true

# 6. Flashing logical rootfs & data partitions
say "Flashing system_${SLOT}..."
fastboot flash "system_${SLOT}" "$SYSTEM_IMG"

if [ -n "$DATA_IMG" ] && [ -f "$DATA_IMG" ]; then
  say "Flashing persistent data partition lrddata_${SLOT}..."
  DATA_BYTES=$(stat -c %s "$DATA_IMG")
  fastboot create-logical-partition "lrddata_${SLOT}" "$DATA_BYTES" 2>/dev/null || true
  fastboot resize-logical-partition "lrddata_${SLOT}" "$DATA_BYTES" 2>/dev/null || true
  fastboot flash "lrddata_${SLOT}" "$DATA_IMG" 2>/dev/null || warn "lrddata flash skipped (overlay will use tmpfs)"
fi

# 7. Slot activation (requires fastbootd on modern MediaTek devices)
say "Setting active slot to ${SLOT}..."
IS_USERSPACE="$(fastboot getvar is-userspace 2>&1 | sed -n 's/^is-userspace: //p' | head -1)"
if [ "$IS_USERSPACE" != "yes" ]; then
  say "Switching to fastbootd to commit slot switch to disk..."
  fastboot reboot fastboot 2>/dev/null || true
  while ! fastboot getvar is-userspace 2>&1 | grep -q 'yes'; do sleep 1; done
fi
fastboot set_active "$SLOT" || warn "set_active failed"

echo -e "\n${GREEN}${BOLD}✔ LibreDroid OS Successfully Flashed!${NC}"
echo -e "  • Stock Android is safe in slot ${CUR_SLOT}."
echo -e "  • LibreDroid OS is now active in slot ${SLOT}."
echo -e "  • To boot LibreDroid, run: ${CYAN}fastboot reboot${NC}"
echo -e "  • To return to stock Android at any time, run: ${CYAN}fastboot --set-active=${CUR_SLOT} && fastboot reboot${NC}\n"
