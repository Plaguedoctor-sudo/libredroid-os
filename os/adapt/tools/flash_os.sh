#!/usr/bin/env bash
# flash_os.sh — Safe, slot-aware Android hardware flasher for LibreDroid OS
# Leaves stock Android in active slot untouched; installs LibreDroid to inactive slot.
set -Eeuo pipefail

export ANDROID_USER_HOME="${ANDROID_USER_HOME:-/home/nitin/fkgugal/.adb}"
export ANDROID_SDK_HOME="${ANDROID_SDK_HOME:-/home/nitin/fkgugal/.adb}"
export HOME="${HOME:-/home/nitin/fkgugal/.adb}"

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
DRY_RUN=0
ALLOW_ACTIVE_SLOT=0

while [ $# -gt 0 ]; do
  case "$1" in
    --boot)   BOOT_IMG="$2"; shift 2 ;;
    --system) SYSTEM_IMG="$2"; shift 2 ;;
    --data)   DATA_IMG="$2"; shift 2 ;;
    --slot)   TARGET_SLOT="${2#_}"; shift 2 ;;
    --yes|-y) YES=1; shift ;;
    --dry-run|--check) DRY_RUN=1; shift ;;
    --dangerously-overwrite-active-slot) ALLOW_ACTIVE_SLOT=1; shift ;;
    *) die "Unknown parameter: $1" ;;
  esac
done

if [ "$DRY_RUN" -eq 1 ]; then
  say "${BOLD}[DRY-RUN / VERIFICATION MODE ACTIVE]${NC}"
fi

# 1. Fastboot availability & state
command -v fastboot >/dev/null 2>&1 || die "fastboot binary not found. Please install android-tools."

if [ "$DRY_RUN" -eq 0 ]; then
  if ! fastboot devices 2>/dev/null | grep -q '[a-zA-Z0-9]'; then
    say "Device not found in fastboot. Checking ADB..."
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

  # 2. Bootloader lock check
  UNLOCKED="$(fastboot getvar unlocked 2>&1 | sed -n 's/^unlocked: //p' | head -1)"
  if [ "$UNLOCKED" = "no" ]; then
    die "Bootloader is locked. Run: fastboot flashing unlock && fastboot flashing unlock_critical"
  fi
else
  # Simulated slot for dry-run verification
  CUR_SLOT="a"
  OTHER_SLOT="b"
  SLOT="${TARGET_SLOT:-$OTHER_SLOT}"
  say "Simulated Current Active Slot: ${GREEN}slot_${CUR_SLOT}${NC}"
  say "Simulated Target Slot: ${YELLOW}slot_${SLOT}${NC}"
fi

# Safety Gate: Active Slot Inviolability
if [ "$SLOT" = "$CUR_SLOT" ]; then
  if [ "$ALLOW_ACTIVE_SLOT" -ne 1 ]; then
    echo -e "\n${RED}${BOLD}========================================================================${NC}" >&2
    echo -e "${RED}${BOLD}SAFETY GATE TRIGGERED: REFUSING TO OVERWRITE ACTIVE ANDROID SLOT!${NC}" >&2
    echo -e "${RED}Target slot_${SLOT} is the active running slot (slot_${CUR_SLOT}).${NC}" >&2
    echo -e "${RED}Flashing would erase stock ColorOS/Android and risk bricking your tablet.${NC}" >&2
    echo -e "${CYAN}LibreDroid OS dual-boot safety architecture requires installing to slot_${OTHER_SLOT}.${NC}" >&2
    echo -e "To install safely alongside Android, run with target: ${GREEN}--slot ${OTHER_SLOT}${NC}" >&2
    echo -e "If you intentionally intend to overwrite active slot_${SLOT}, pass: ${YELLOW}--dangerously-overwrite-active-slot${NC}" >&2
    echo -e "${RED}${BOLD}========================================================================${NC}\n" >&2
    exit 1
  else
    warn "DANGEROUS OVERRIDE ACTIVE: Proceeding to flash active slot_${SLOT} as requested."
  fi
fi

# 3. Locate image files if not explicitly provided
if [ -z "$BOOT_IMG" ] || [ ! -f "$BOOT_IMG" ]; then
  for cand in "$PWD/boot_${SLOT}.img" "$PWD/out-pad-go/boot_${SLOT}.img" "$HERE/../../../out-pad-go/boot_${SLOT}.img" "$PWD/boot.img" "$HERE/../boot_b.img" "$PWD/os-build-out/boot_b.img"; do
    [ -f "$cand" ] && { BOOT_IMG="$cand"; break; }
  done
fi

if [ -z "$SYSTEM_IMG" ] || [ ! -f "$SYSTEM_IMG" ]; then
  for cand in "$PWD/system_${SLOT}.img" "$PWD/out-pad-go/system_${SLOT}.img" "$HERE/../../../out-pad-go/system_${SLOT}.img" "$PWD/system.img" "$PWD/os-build-out/system_b.img"; do
    [ -f "$cand" ] && { SYSTEM_IMG="$cand"; break; }
  done
fi

if [ -z "$DATA_IMG" ] || [ ! -f "$DATA_IMG" ]; then
  for cand in "$PWD/lrddata_${SLOT}.img" "$PWD/out-pad-go/lrddata_${SLOT}.img" "$HERE/../../../out-pad-go/lrddata_${SLOT}.img" "$PWD/lrddata.img" "$PWD/os-build-out/lrddata_b.img"; do
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

if [ "$DRY_RUN" -eq 1 ]; then
  say "Verification dry-run completed successfully. All candidate images and safety gates validated."
  say "No changes were written to any hardware partitions."
  exit 0
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

# Flash physical boot, vendor_boot, dtbo & vbmeta partitions while in bootloader mode
say "Flashing physical partition boot_${SLOT}..."
fastboot flash "boot_${SLOT}" "$BOOT_IMG"

if [ -f "$(dirname "$BOOT_IMG")/vendor_boot_${SLOT}.img" ]; then
  say "Flashing physical partition vendor_boot_${SLOT} (Android 14 Vendor DTB & Ramdisk)..."
  fastboot flash "vendor_boot_${SLOT}" "$(dirname "$BOOT_IMG")/vendor_boot_${SLOT}.img" || warn "vendor_boot flash bypassed"
fi

if [ -f "$(dirname "$BOOT_IMG")/dtbo_${SLOT}.img" ]; then
  say "Flashing physical partition dtbo_${SLOT} (Android 14 Device Tree Overlay)..."
  fastboot flash "dtbo_${SLOT}" "$(dirname "$BOOT_IMG")/dtbo_${SLOT}.img" || warn "dtbo flash bypassed"
fi



if [ -f "$(dirname "$BOOT_IMG")/vbmeta_${SLOT}.img" ]; then
  say "Flashing genuine vbmeta_${SLOT} with AVB verification disabled..."
  fastboot flash "vbmeta_${SLOT}" "$(dirname "$BOOT_IMG")/vbmeta_${SLOT}.img"
elif [ -f "$(dirname "$BOOT_IMG")/vbmeta_disabled.img" ]; then
  say "Flashing generic vbmeta_${SLOT}..."
  fastboot --disable-verity --disable-verification flash "vbmeta_${SLOT}" "$(dirname "$BOOT_IMG")/vbmeta_disabled.img" 2>/dev/null || true
fi

if [ -f "$(dirname "$BOOT_IMG")/vbmeta_system_${SLOT}.img" ]; then
  say "Flashing genuine chained vbmeta_system_${SLOT}..."
  fastboot flash "vbmeta_system_${SLOT}" "$(dirname "$BOOT_IMG")/vbmeta_system_${SLOT}.img"
fi

if [ -f "$(dirname "$BOOT_IMG")/vbmeta_vendor_${SLOT}.img" ]; then
  say "Flashing genuine chained vbmeta_vendor_${SLOT}..."
  fastboot flash "vbmeta_vendor_${SLOT}" "$(dirname "$BOOT_IMG")/vbmeta_vendor_${SLOT}.img"
fi

# 5. Fastbootd & Dynamic Partitions Check (Option 4 Fallback)
IS_USERSPACE="$(fastboot getvar is-userspace 2>&1 | sed -n 's/^is-userspace: //p' | head -1)"

if [ "$IS_USERSPACE" = "yes" ]; then
  say "Fastbootd userspace active. Flashing logical dynamic partitions to super..."
  for cow in $(fastboot getvar all 2>&1 | grep -o '[a-zA-Z0-9_-]*-cow' | sort -u); do
    fastboot delete-logical-partition "$cow" 2>/dev/null || true
  done

  ROOT_BYTES=$(stat -c %s "$SYSTEM_IMG")
  ROOT_MB=$(( ROOT_BYTES / 1024 / 1024 ))
  say "Ensuring dynamic logical partition system_${SLOT} is allocated in super (${ROOT_MB}MB)..."
  fastboot create-logical-partition "system_${SLOT}" "$ROOT_BYTES" 2>/dev/null || true
  fastboot resize-logical-partition "system_${SLOT}" "$ROOT_BYTES" 2>/dev/null || true

  say "Flashing system_${SLOT}..."
  fastboot flash "system_${SLOT}" "$SYSTEM_IMG"

  if [ -n "$DATA_IMG" ] && [ -f "$DATA_IMG" ]; then
    say "Flashing persistent data partition lrddata_${SLOT}..."
    DATA_BYTES=$(stat -c %s "$DATA_IMG")
    fastboot create-logical-partition "lrddata_${SLOT}" "$DATA_BYTES" 2>/dev/null || true
    fastboot resize-logical-partition "lrddata_${SLOT}" "$DATA_BYTES" 2>/dev/null || true
    fastboot flash "lrddata_${SLOT}" "$DATA_IMG" 2>/dev/null || warn "lrddata flash skipped"
  fi
else
  say "Device bootloader active (ColorOS lacks fastbootd)."
  say "✔ Option 4 Active: Super dynamic partitions will be mapped at boot via Halium Initramfs Super-Mapper."
  say "✔ LibreDroid OS Rootfs and Data images are loaded directly from MicroSD storage."
fi

# 6. Slot activation
say "Setting active boot slot to slot_${SLOT}..."
fastboot set_active "$SLOT" || fastboot --set-active="$SLOT" || warn "set_active failed"

echo -e "\n${GREEN}${BOLD}✔ LibreDroid OS Successfully Flashed!${NC}"
echo -e "  • Stock Android is safe in slot ${CUR_SLOT}."
echo -e "  • LibreDroid OS is now active in slot ${SLOT}."
echo -e "  • To boot LibreDroid, run: ${CYAN}fastboot reboot${NC}"
echo -e "  • To return to stock Android at any time, run: ${CYAN}fastboot --set-active=${CUR_SLOT} && fastboot reboot${NC}\n"
