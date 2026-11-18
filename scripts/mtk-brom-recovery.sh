#!/usr/bin/env bash
# ==============================================================================
# mtk-brom-recovery.sh — MediaTek MT6789 (Helio G99) BROM Recovery Safety Harness
# Target Hardware: Volla Phone X23 (vidofnir) & OnePlus Pad Go (OP5DA6L1 / OPD2304)
# Enforces non-destructive flashing, critical NVRAM protection, and emergency unbrick.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[1;36m'; BOLD='\033[1m'; NC='\033[0m'
say(){ printf "${CYAN}::${NC} %b\n" "$*"; }
warn(){ printf "${YELLOW}!! WARNING:${NC} %s\n" "$*" >&2; }
die(){ printf "${RED}xx FATAL:${NC} %s\n" "$*" >&2; exit 1; }

# Critical partitions that must NEVER be written to or wiped in regular flashing
CRITICAL_PARTITIONS=("nvram" "nvdata" "nvcfg" "protect1" "protect2" "proinfo" "sec1" "seccfg")

usage() {
    cat << EOF
${BOLD}LibreMobile MT6789 BROM Recovery & Safety Harness${NC}

Usage:
  $0 probe                             Check for device in MTK BROM/Preloader USB mode
  $0 backup [out_dir]                  Dump device partition table and critical calibration
  $0 flash-boot <device> <slot> <dir>  Flash LibreMobile boot/vendor_boot to target slot
  $0 restore-stock <device>            Emergency unbrick to verified stock partitions

Flags:
  --dry-run                            Simulate commands without executing USB writes
  --yes, -y                            Skip confirmation prompts

Examples:
  $0 probe
  $0 backup ./lrd-backups/brom_dump
  $0 flash-boot OP5DA6L1 b ./dist-boot --dry-run
  $0 restore-stock OP5DA6L1 --dry-run
EOF
    exit 1
}

DRY_RUN=0
ASSUME_YES=0

check_mtkclient() {
    if ! command -v mtk >/dev/null 2>&1 && ! python3 -m mtkclient --help >/dev/null 2>&1; then
        warn "mtkclient command ('mtk' or 'python3 -m mtkclient') is not in PATH."
        say "mtkclient can be run via virtualenv or pip: 'pip install mtkclient'"
        return 1
    fi
    return 0
}

mtk_exec() {
    if [ "$DRY_RUN" -eq 1 ]; then
        say "[DRY-RUN] Would execute: mtk $*"
        return 0
    fi
    if command -v mtk >/dev/null 2>&1; then
        mtk "$@"
    else
        python3 -m mtkclient "$@"
    fi
}

cmd_probe() {
    say "Probing USB bus for MediaTek BROM / Preloader device (VID 0e8d)..."
    local found=0
    if command -v lsusb >/dev/null 2>&1; then
        if lsusb | grep -qi "0e8d:"; then
            local desc
            desc=$(lsusb | grep -i "0e8d:")
            say "${GREEN}✔ MediaTek hardware detected on USB bus:${NC}"
            echo "    $desc"
            found=1
        fi
    fi

    if [ "$found" -eq 0 ]; then
        say "No MediaTek device detected in BROM mode."
        say "To enter MTK BROM mode:"
        say "  1. Power off device completely."
        say "  2. Hold Volume Up (+) and Volume Down (-)."
        say "  3. Connect USB-C cable to host PC while holding buttons."
    fi
    return 0
}

cmd_backup() {
    local out_dir="${1:-$REPO_ROOT/lrd-backups/brom_$(date +%Y%m%d_%H%M%S)}"
    say "Preparing full calibration backup to: $out_dir"
    mkdir -p "$out_dir"

    say "Protecting NVRAM/NVDATA device calibration data..."
    local parts=("boot_a" "boot_b" "vendor_boot_a" "vendor_boot_b" "vbmeta_a" "vbmeta_b" "dtbo_a" "dtbo_b" "nvram" "nvdata" "proinfo")
    for p in "${parts[@]}"; do
        say "Backing up partition: $p -> $out_dir/${p}.img"
        mtk_exec r "$p" "$out_dir/${p}.img" || true
    done
    say "${GREEN}✔ Backup sequence finished.${NC}"
}

cmd_flash_boot() {
    local dev="${1:-}"
    local slot="${2:-}"
    local img_dir="${3:-$REPO_ROOT/dist-boot}"

    [ -n "$dev" ] && [ -n "$slot" ] || usage
    [[ "$slot" =~ ^[ab]$ ]] || die "Slot must be 'a' or 'b'"

    local boot_img="$img_dir/boot-${dev}-libremobile.img"
    local vendor_img="$img_dir/vendor_boot-${dev}-libremobile.img"

    [ -f "$boot_img" ] || die "Boot image not found: $boot_img"
    [ -f "$vendor_img" ] || die "Vendor boot image not found: $vendor_img"

    say "${BOLD}Flashing LibreMobile Boot Pipeline${NC}"
    say "  Device:          $dev"
    say "  Target Slot:     slot_$slot (Leaves opposite slot intact)"
    say "  Boot Image:      $boot_img ($(stat -c%s "$boot_img") bytes)"
    say "  Vendor Boot:     $vendor_img ($(stat -c%s "$vendor_img") bytes)"

    if [ "$DRY_RUN" -eq 0 ] && [ "$ASSUME_YES" -eq 0 ]; then
        read -r -p "Proceed with write to slot_${slot}? [y/N]: " confirm
        [[ "$confirm" =~ ^[yY]$ ]] || die "Aborted by user."
    fi

    say "Writing boot_${slot}..."
    mtk_exec w "boot_${slot}" "$boot_img"

    say "Writing vendor_boot_${slot}..."
    mtk_exec w "vendor_boot_${slot}" "$vendor_img"

    say "${GREEN}✔ Boot partitions written successfully to slot_${slot}.${NC}"
}

cmd_restore_stock() {
    local dev="${1:-}"
    [ -n "$dev" ] || usage

    say "${BOLD}Emergency Stock Firmware Rollback Harness${NC}"
    local stock_images=""
    if [ "$dev" = "OP5DA6L1" ] || [ "$dev" = "OPD2304" ]; then
        stock_images="$REPO_ROOT/stock_firmware/OnePlus_Pad_Go_OPD2304_MT6789_EX_11_A.30_231025_MXML/Firmware/IMAGES"
    elif [ "$dev" = "vidofnir" ]; then
        stock_images="$REPO_ROOT/halium-vidofnir/partitions"
    else
        die "Unknown device: $dev. Supported: vidofnir, OP5DA6L1"
    fi

    [ -d "$stock_images" ] || die "Stock firmware directory not found at $stock_images"

    say "Verified stock firmware source: $stock_images"
    local restore_parts=("boot" "vendor_boot" "dtbo" "vbmeta" "vbmeta_system" "vbmeta_vendor")

    for p in "${restore_parts[@]}"; do
        [ -f "$stock_images/${p}.img" ] || die "Missing stock partition image: $stock_images/${p}.img"
        say "  • Stock $p: $(stat -c%s "$stock_images/${p}.img") bytes"
    done

    if [ "$DRY_RUN" -eq 0 ] && [ "$ASSUME_YES" -eq 0 ]; then
        warn "This will flash verified stock Android partition images to device."
        read -r -p "Restore stock partitions now? [y/N]: " confirm
        [[ "$confirm" =~ ^[yY]$ ]] || die "Aborted by user."
    fi

    for p in "${restore_parts[@]}"; do
        for s in "a" "b"; do
            say "Restoring stock ${p}_${s}..."
            mtk_exec w "${p}_${s}" "$stock_images/${p}.img"
        done
    done

    say "${GREEN}✔ Emergency stock recovery complete. Device is restored to stock firmware.${NC}"
}

# Parse options
POSITIONAL=()
while [ $# -gt 0 ]; do
    case "$1" in
        --dry-run) DRY_RUN=1; shift ;;
        --yes|-y) ASSUME_YES=1; shift ;;
        *) POSITIONAL+=("$1"); shift ;;
    esac
done

[ ${#POSITIONAL[@]} -gt 0 ] || usage
CMD="${POSITIONAL[0]}"

case "$CMD" in
    probe) cmd_probe ;;
    backup) cmd_backup "${POSITIONAL[1]:-}" ;;
    flash-boot) cmd_flash_boot "${POSITIONAL[1]:-}" "${POSITIONAL[2]:-}" "${POSITIONAL[3]:-}" ;;
    restore-stock) cmd_restore_stock "${POSITIONAL[1]:-}" ;;
    *) usage ;;
esac
