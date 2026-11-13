#!/usr/bin/env bash
# One-touch safe flashing script for LibreDroid OS (OnePlus Pad Go OPD2304)
# Guaranteed Slot-Safety: Installs to the inactive slot to preserve stock Android.
set -Eeuo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/.." && pwd)"

say(){ printf "\033[1;36m::\033[0m %s\n" "$*"; }
warn(){ printf "\033[1;33m!!\033[0m %s\n" "$*" >&2; }
die(){ printf "\033[0;31mxx\033[0m %s\n" "$*" >&2; exit 1; }

SLOT=""
ARGS=()

while [ $# -gt 0 ]; do
  case "$1" in
    --slot) SLOT="${2#_}"; shift 2 ;;
    --dry-run|--check) ARGS+=("$1"); shift ;;
    --yes|-y) ARGS+=("$1"); shift ;;
    --dangerously-overwrite-active-slot) ARGS+=("$1"); shift ;;
    *) ARGS+=("$1"); shift ;;
  esac
done

IS_DRY_RUN=0
for a in "$@"; do
  case "$a" in
    --dry-run|--check) IS_DRY_RUN=1 ;;
  esac
done

# If slot was not explicitly passed, query current slot if fastboot device is present
if [ -z "$SLOT" ]; then
  if [ "$IS_DRY_RUN" -eq 0 ] && command -v fastboot >/dev/null 2>&1 && fastboot devices 2>/dev/null | grep -q '[a-zA-Z0-9]'; then
    CUR="$(fastboot getvar current-slot 2>&1 | sed -n 's/^current-slot: //p' | head -1 || true)"
    if [ "$CUR" = "a" ]; then
      SLOT="b"
    elif [ "$CUR" = "b" ]; then
      SLOT="a"
    fi
  fi
  # Safe default if fastboot device not currently queried
  SLOT="${SLOT:-b}"
fi

say "Selected target slot: slot_${SLOT}"

BOOT_IMG="$HERE/boot_${SLOT}.img"
[ -f "$BOOT_IMG" ] || BOOT_IMG="$HERE/boot_b.img"
[ -f "$BOOT_IMG" ] || BOOT_IMG="$HERE/boot_a.img"

SYSTEM_IMG="$HERE/system_${SLOT}.img"
[ -f "$SYSTEM_IMG" ] || SYSTEM_IMG="$HERE/system_b.img"
[ -f "$SYSTEM_IMG" ] || SYSTEM_IMG="$HERE/system_a.img"

DATA_IMG="$HERE/lrddata_${SLOT}.img"
[ -f "$DATA_IMG" ] || DATA_IMG="$HERE/lrddata_b.img"
[ -f "$DATA_IMG" ] || DATA_IMG="$HERE/lrddata_a.img"

bash "$REPO_ROOT/os/adapt/tools/flash_os.sh" \
  --slot "$SLOT" \
  --boot "$BOOT_IMG" \
  --system "$SYSTEM_IMG" \
  --data "$DATA_IMG" \
  "${ARGS[@]}"
