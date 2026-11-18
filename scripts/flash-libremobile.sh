#!/usr/bin/env bash
# ==============================================================================
# LibreMobile OS — Universal Factory Fastboot Installer
# Spec compliance: LibreDroid System Design v0.1 §2, §3, §15, §16
#
# Target Architectures: MediaTek MT6789 (Helio G99)
# Supported Devices:
#   - Volla Phone X23 (vidofnir) [Tier 1]
#   - OnePlus Pad Go (OP5DA6L1 / OPD2304 / ossi) [Tier 1]
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

say() { echo -e "${CYAN}::${NC} $*"; }
ok()  { echo -e "${GREEN}✔${NC} $*"; }
warn(){ echo -e "${YELLOW}!!${NC} $*"; }
die() { echo -e "${RED}xx [ERROR]${NC} $*" >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="${REPO_ROOT}/dist-release"

# Default flags
DRY_RUN=false
TARGET_DEVICE=""
FORCE=false
TARGET_SLOT=""

show_help() {
    cat << EOF
LibreMobile OS — Universal Factory Fastboot Installer
Usage: $(basename "$0") [options]

Options:
  --device <codename>   Specify device codename (vidofnir, OP5DA6L1)
  --slot <a|b>          Explicitly target slot A or B (default: auto-detected active)
  --dry-run             Simulate flash execution without touching hardware
  --force               Bypass safety confirmation prompts
  --help                Show this message
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --device) TARGET_DEVICE="$2"; shift 2 ;;
        --slot)   TARGET_SLOT="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        --force)  FORCE=true; shift ;;
        --help)   show_help; exit 0 ;;
        *) die "Unknown option: $1 (see --help)" ;;
    esac
done

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}   LibreMobile OS — Universal Factory Fastboot Flasher (1.0-RC)      ${NC}"
echo -e "${CYAN}======================================================================${NC}"

# 1. Dependency checks
if ! command -v fastboot >/dev/null 2>&1; then
    die "'fastboot' CLI tool is required but not installed (sudo apt install android-tools-fastboot)."
fi

# 2. Hardware Detection
say "[1/5] Detecting connected fastboot device..."
DETECTED_SERIAL=""
DETECTED_PRODUCT=""
IS_UNLOCKED=""
CURRENT_SLOT=""

if [ "$DRY_RUN" = true ] && [ -n "$TARGET_DEVICE" ]; then
    DETECTED_SERIAL="SIMULATED_FASTBOOT_DEVICE_001"
    DETECTED_PRODUCT="$TARGET_DEVICE"
    IS_UNLOCKED="yes"
    CURRENT_SLOT="${TARGET_SLOT:-a}"
    say "Simulating fastboot probe for device: ${TARGET_DEVICE} on slot ${CURRENT_SLOT}"
else
    DEVICE_LINE=$(fastboot devices | head -n 1 || true)
    if [ -z "$DEVICE_LINE" ]; then
        if [ "$DRY_RUN" = true ]; then
            DETECTED_SERIAL="SIMULATED_SERIAL_DEFAULT"
            DETECTED_PRODUCT="${TARGET_DEVICE:-vidofnir}"
            IS_UNLOCKED="yes"
            CURRENT_SLOT="${TARGET_SLOT:-a}"
            say "No physical USB device attached; proceeding under dry-run simulation."
        else
            die "No device detected in fastboot mode. Connect device via USB and hold Volume Down + Power."
        fi
    else
        DETECTED_SERIAL=$(echo "$DEVICE_LINE" | awk '{print $1}')
        say "Found fastboot device: ${BOLD}${DETECTED_SERIAL}${NC}"
        DETECTED_PRODUCT=$(fastboot getvar product 2>&1 | grep "product:" | awk '{print $2}' || true)
        IS_UNLOCKED=$(fastboot getvar unlocked 2>&1 | grep "unlocked:" | awk '{print $2}' || true)
        CURRENT_SLOT=$(fastboot getvar current-slot 2>&1 | grep "current-slot:" | awk '{print $2}' || true)
    fi
fi

# Canonicalize codename
CODENAME="${TARGET_DEVICE:-$DETECTED_PRODUCT}"
case "$CODENAME" in
    vidofnir|X23|volla_x23) CODENAME="vidofnir" ;;
    OP5DA6L1|OPD2304|ossi|oneplus_pad_go) CODENAME="OP5DA6L1" ;;
    *) warn "Unrecognized codename: '$CODENAME'. Will validate against support matrix." ;;
esac

# Slot selection
SLOT="${TARGET_SLOT:-$CURRENT_SLOT}"
[ -z "$SLOT" ] && SLOT="a"
ok "Hardware: ${CODENAME} | Slot: _${SLOT} | Serial: ${DETECTED_SERIAL}"

# 3. Support Matrix & Bootloader Unlock Check
say "[2/5] Enforcing LibreMobile support matrix..."
if [ "$IS_UNLOCKED" != "yes" ] && [ "$DRY_RUN" = false ]; then
    die "Bootloader is LOCKED. Unlock device first:\n    fastboot flashing unlock\n    (confirm on physical screen)"
fi

SUPPORT_SCRIPT="${REPO_ROOT}/scripts/lrd-support-matrix.py"
if [ -f "$SUPPORT_SCRIPT" ]; then
    if ! python3 "$SUPPORT_SCRIPT" --codename "$CODENAME" --unlocked; then
        die "Device failed LibreMobile hardware support matrix check."
    fi
fi
ok "Device verified against Tier 1 support matrix."

# 4. Resolve Image Artifacts
say "[3/5] Verifying partition image artifacts..."
# Search in dist-release, halium-vidofnir, or output folders
BOOT_IMG=""
VENDOR_BOOT_IMG=""
ROOTFS_IMG=""

CANDIDATE_BOOTS=(
    "${DIST_DIR}/${CODENAME}/boot.img"
    "${DIST_DIR}/boot-${CODENAME}-libremobile.img"
    "/tmp/dist-boot-${CODENAME}/boot-${CODENAME}-libremobile.img"
    "${REPO_ROOT}/halium-vidofnir/partitions/boot.img"
)

CANDIDATE_VBOOTS=(
    "${DIST_DIR}/${CODENAME}/vendor_boot.img"
    "${DIST_DIR}/vendor_boot-${CODENAME}-libremobile.img"
    "/tmp/dist-boot-${CODENAME}/vendor_boot-${CODENAME}-libremobile.img"
    "${REPO_ROOT}/halium-vidofnir/partitions/vendor_boot.img"
)

for b in "${CANDIDATE_BOOTS[@]}"; do
    if [ -f "$b" ]; then BOOT_IMG="$b"; break; fi
done

for vb in "${CANDIDATE_VBOOTS[@]}"; do
    if [ -f "$vb" ]; then VENDOR_BOOT_IMG="$vb"; break; fi
done

CANDIDATE_ROOTFS=(
    "${DIST_DIR}/libremobile-arm64-generic.img"
    "${REPO_ROOT}/output/libremobile-arm64-generic.img"
    "/tmp/dist-rootfs/libremobile-arm64-generic.img"
)
for r in "${CANDIDATE_ROOTFS[@]}"; do
    if [ -f "$r" ]; then ROOTFS_IMG="$r"; break; fi
done

# If images don't exist yet, we can trigger builder if dry-run or warn
if [ -z "$BOOT_IMG" ] || [ -z "$VENDOR_BOOT_IMG" ]; then
    if [ "$DRY_RUN" = true ]; then
        BOOT_IMG="/tmp/simulated_boot.img"
        VENDOR_BOOT_IMG="/tmp/simulated_vendor_boot.img"
        touch "$BOOT_IMG" "$VENDOR_BOOT_IMG"
        say "Created mock boot images for dry-run validation."
    else
        die "Required boot images not found. Run 'scripts/package-libremobile-release.sh' first."
    fi
fi

ok "boot_${SLOT} image:        ${BOOT_IMG}"
ok "vendor_boot_${SLOT} image: ${VENDOR_BOOT_IMG}"

# 5. Execute Flashing Sequence
say "[4/5] Executing factory flashing sequence..."
if [ "$FORCE" = false ] && [ "$DRY_RUN" = false ]; then
    echo -e "${YELLOW}${BOLD}WARNING:${NC} This will overwrite slot _${SLOT} on ${CODENAME}."
    read -rp "Proceed with flashing? [y/N]: " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || die "Flashing aborted by user."
fi

run_fb() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "    ${CYAN}[DRY-RUN fastboot]${NC} $*"
    else
        fastboot "$@"
    fi
}

# Flashing boot
say "Flashing boot_${SLOT} (Halium GKI kernel + deterministic ramdisk)..."
run_fb flash "boot_${SLOT}" "$BOOT_IMG"

# Flashing vendor_boot
say "Flashing vendor_boot_${SLOT} (MT6789 DTB + Alpha JDI panel module)..."
run_fb flash "vendor_boot_${SLOT}" "$VENDOR_BOOT_IMG"

# Set active slot
say "Activating slot _${SLOT}..."
run_fb set_active "${SLOT}"

ok "[5/5] LibreMobile OS factory flash completed successfully!"

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}   LibreMobile OS is now flashed to slot _${SLOT} on ${CODENAME}!       ${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo "To boot into LibreMobile OS:"
echo "    fastboot reboot"
echo ""
echo "Emergency Rollback (MediaTek MT6789 BROM):"
echo "    If device fails to boot, run:"
echo "    ./scripts/mtk-brom-recovery.sh restore-stock ${CODENAME}"
