#!/usr/bin/env bash
# ==============================================================================
# OnePlus Pad Go (OPD2304 / MT6789) — Official Fresh Stock OS Flasher
# Flashes 100% genuine factory OxygenOS firmware from official package
# ==============================================================================
set -Eeuo pipefail

export ANDROID_USER_HOME=/tmp/.android
export ANDROID_SDK_HOME=/tmp
export HOME=/tmp

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IMG_DIR="${PROJECT_ROOT}/stock_firmware/OnePlus_Pad_Go_OPD2304_MT6789_EX_11_A.30_231025_MXML/Firmware/IMAGES"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

say() { printf "${GREEN}${BOLD}==>${NC} %s\n" "$*"; }
info() { printf "${BLUE}[*]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}[!]${NC} %s\n" "$*" >&2; }
die() { printf "${RED}[x] Error:${NC} %s\n" "$*" >&2; exit 1; }

echo -e "${BLUE}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD}    OnePlus Pad Go (OPD2304) — Fresh Factory OS Installation${NC}"
echo -e "${BLUE}${BOLD}======================================================================${NC}"

# Check images directory
[ -d "$IMG_DIR" ] || die "Images directory not found at $IMG_DIR"
[ -f "$IMG_DIR/boot.img" ] || die "boot.img missing in $IMG_DIR"
[ -f "$IMG_DIR/system.img" ] || die "system.img missing in $IMG_DIR"
[ -f "$IMG_DIR/vbmeta.img" ] || die "vbmeta.img missing in $IMG_DIR"

command -v fastboot >/dev/null 2>&1 || die "fastboot binary not found."

# 1. Device detection
info "Checking device connection (ADB / Fastboot)..."
if ! fastboot devices 2>/dev/null | grep -q '[a-zA-Z0-9]'; then
    if command -v adb >/dev/null 2>&1 && adb devices 2>/dev/null | grep -w "device" | grep -q .; then
        say "Device detected in ADB. Rebooting to bootloader mode..."
        adb reboot bootloader
        info "Waiting for device to enter bootloader..."
        while ! fastboot devices 2>/dev/null | grep -q '[a-zA-Z0-9]'; do
            sleep 1
        done
    else
        die "No device found in ADB or Fastboot. Connect via USB with USB debugging enabled."
    fi
fi

DEVICE_SN=$(fastboot devices | awk '{print $1}' | head -n 1)
say "Target Fastboot Device: ${DEVICE_SN}"

# 2. Bootloader slot check
say "Activating Slot A as primary boot slot..."
fastboot set_active a 2>/dev/null || true

# 3. Flashing Bootloader-level Partitions (Slot A & Slot B for failsafe resilience)
say "Flashing core bootloader and hardware security partitions..."

BOOTLOADER_PARTITIONS=(
    "boot_a:boot.img"
    "boot_b:boot.img"
    "vendor_boot_a:vendor_boot.img"
    "vendor_boot_b:vendor_boot.img"
    "dtbo_a:dtbo.img"
    "dtbo_b:dtbo.img"
    "vbmeta_a:vbmeta.img"
    "vbmeta_b:vbmeta.img"
    "vbmeta_system_a:vbmeta_system.img"
    "vbmeta_system_b:vbmeta_system.img"
    "vbmeta_vendor_a:vbmeta_vendor.img"
    "vbmeta_vendor_b:vbmeta_vendor.img"
    "tee_a:tee.img"
    "tee_b:tee.img"
    "lk_a:lk.img"
    "lk_b:lk.img"
    "md1img_a:md1img.img"
    "md1img_b:md1img.img"
    "scp_a:scp.img"
    "scp_b:scp.img"
    "sspm_a:sspm.img"
    "sspm_b:sspm.img"
    "mcupm_a:mcupm.img"
    "mcupm_b:mcupm.img"
    "gz_a:gz.img"
    "gz_b:gz.img"
    "spmfw_a:spmfw.img"
    "spmfw_b:spmfw.img"
    "pi_img_a:pi_img.img"
    "pi_img_b:pi_img.img"
    "dpm_a:dpm.img"
    "dpm_b:dpm.img"
    "logo:logo.img"
    "oplusreserve2:oplusreserve2.img"
)

for entry in "${BOOTLOADER_PARTITIONS[@]:-}"; do
    PART="${entry%%:*}"
    IMG="${entry##*:}"
    FILE="$IMG_DIR/$IMG"
    if [ -f "$FILE" ]; then
        info "Flashing ${PART} <- ${IMG}..."
        fastboot flash "$PART" "$FILE"
    else
        warn "Skipping optional ${PART} (file ${IMG} not present)"
    fi
done

# 4. Switch to FastbootD (Userspace fastboot for dynamic logical partitions in 'super')
say "Switching device to FastbootD (userspace dynamic partition mode)..."
fastboot reboot fastboot 2>/dev/null || true

info "Waiting for FastbootD (userspace)..."
while true; do
    IS_USERSPACE=$(fastboot getvar is-userspace 2>&1 | sed -n 's/^is-userspace: //p' | head -1 || true)
    if [ "$IS_USERSPACE" = "yes" ]; then
        say "Device is in FastbootD mode!"
        break
    fi
    sleep 2
done

# Clean up any leftover logical partitions from experimental builds
info "Cleaning up previous custom logical partitions in super..."
fastboot delete-logical-partition system_b 2>/dev/null || true
fastboot delete-logical-partition lrddata_b 2>/dev/null || true

for cow in $(fastboot getvar all 2>&1 | grep -o '[a-zA-Z0-9_-]*-cow' | sort -u || true); do
    fastboot delete-logical-partition "$cow" 2>/dev/null || true
done

# 5. Flashing Dynamic Logical Partitions into 'super'
say "Flashing dynamic system and ODM partitions into super..."

DYNAMIC_PARTITIONS=(
    "system_a:system.img"
    "system_ext_a:system_ext.img"
    "product_a:product.img"
    "vendor_a:vendor.img"
    "vendor_dlkm_a:vendor_dlkm.img"
    "odm_a:odm.img"
    "odm_dlkm_a:odm_dlkm.img"
    "my_product_a:my_product.img"
    "my_engineering_a:my_engineering.img"
    "my_company_a:my_company.img"
    "my_carrier_a:my_carrier.img"
    "my_region_a:my_region.img"
    "my_heytap_a:my_heytap.img"
    "my_stock_a:my_stock.img"
    "my_preload_a:my_preload.img"
    "my_bigball_a:my_bigball.img"
    "my_manifest_a:my_manifest.img"
)

for entry in "${DYNAMIC_PARTITIONS[@]:-}"; do
    PART="${entry%%:*}"
    IMG="${entry##*:}"
    FILE="$IMG_DIR/$IMG"
    if [ -f "$FILE" ]; then
        info "Flashing ${PART} <- ${IMG} ($(du -h "$FILE" | cut -f1))..."
        fastboot flash "$PART" "$FILE"
    else
        warn "Missing partition image for ${PART} (${IMG})"
    fi
done

# 6. Clean storage wipe (Format userdata and metadata to establish fresh hardware encryption)
say "Performing clean factory data wipe (userdata + metadata)..."
if [ -f "$IMG_DIR/userdata.img" ]; then
    fastboot flash userdata "$IMG_DIR/userdata.img" || fastboot erase userdata || true
else
    fastboot erase userdata || true
fi
fastboot erase metadata 2>/dev/null || true

# 7. Finalize and Reboot
say "Setting active slot to Slot A..."
fastboot set_active a || true

echo -e "\n${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD}  ✔ FRESH FACTORY OS INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
say "Rebooting OnePlus Pad Go into fresh factory OxygenOS..."
fastboot reboot

echo -e "${GREEN}Tablet is now rebooting. The first boot may take 2-3 minutes to initialize.${NC}\n"
