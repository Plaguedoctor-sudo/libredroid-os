#!/usr/bin/env bash
# ==============================================================================
# LibreDroid Mobile OS — Master Build Orchestrator
# The Sovereign Successor to Android for ARM64 Mobile Hardware
# (Snapdragon, MediaTek Dimensity/Helio, Exynos, Google Tensor)
# ==============================================================================
set -euo pipefail

export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-1700000000}"
export E2FSPROGS_FAKE_TIME="${SOURCE_DATE_EPOCH:-1700000000}"
export TZ="UTC"
export LC_ALL="C.UTF-8"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/output"
TARGET_IMG="${OUTPUT_DIR}/libredroid-mobile-arm64-treble.img"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}   LibreDroid Mobile OS — Master Image Builder (Android Successor)   ${NC}"
echo -e "${CYAN}   Target: ARM64-v8a Project Treble A/B Smartphones & Tablets         ${NC}"
echo -e "${CYAN}======================================================================${NC}"

mkdir -p "$OUTPUT_DIR"

# 1. Host Tooling Preflight
echo -e "\n${CYAN}[1/5] Checking host toolchain prerequisites...${NC}"
MISSING=()
for tool in mke2fs e2fsck gcc node npm python3; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        MISSING+=("$tool")
    fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
    echo -e "${RED}[ERROR] Missing required build tools: ${MISSING[*]}${NC}"
    echo "Install via: sudo apt install e2fsprogs build-essential nodejs npm python3"
    exit 1
fi
echo -e "${GREEN}✔ All host build tools present.${NC}"

# 2. Build Mobile Native Daemons
echo -e "\n${CYAN}[2/5] Compiling LibreDroid mobile hardware daemons...${NC}"
echo "  -> Compiling lrd-telephonyd (Cellular RIL / SIM / SMS / VoLTE daemon)..."
gcc -O2 -Wall "${SCRIPT_DIR}/telephony/lrd-telephonyd.c" -o "${SCRIPT_DIR}/telephony/lrd-telephonyd" -lpthread

echo "  -> Compiling lrd-telephony (CLI controller)..."
gcc -O2 -Wall "${SCRIPT_DIR}/telephony/lrd-telephony.c" -o "${SCRIPT_DIR}/telephony/lrd-telephony"

echo "  -> Compiling lrd-sensord (Linux IIO accelerometer / proximity / ALS daemon)..."
gcc -O2 -Wall "${SCRIPT_DIR}/sensors/lrd-sensord.c" -o "${SCRIPT_DIR}/sensors/lrd-sensord" -lpthread -lm

echo "  -> Compiling lrd-wakelockd (Android pouch-cell wakelock governor)..."
gcc -O2 -Wall "${SCRIPT_DIR}/power/lrd-wakelockd.c" -o "${SCRIPT_DIR}/power/lrd-wakelockd" -lpthread

echo -e "${GREEN}✔ Hardware daemons ready.${NC}"

# 3. Build Responsive Touch Web Shell
echo -e "\n${CYAN}[3/5] Building responsive touch web shell...${NC}"
cd "$REPO_ROOT"
if [ ! -f "dist/index.html" ]; then
    echo "  Running 'npm run build'..."
    npm run build
else
    echo "  Rebuilding latest UI shell assets..."
    npm run build
fi
echo -e "${GREEN}✔ Web shell compiled.${NC}"

# 4. Run Treble GSI Image Assembly
echo -e "\n${CYAN}[4/5] Assembling Project Treble system image (system.img)...${NC}"
chmod +x "${SCRIPT_DIR}/treble/build-treble-gsi.sh"
"${SCRIPT_DIR}/treble/build-treble-gsi.sh"

# Move generated system image to canonical output path
TREBLE_OUT="${SCRIPT_DIR}/treble/output/libredroid-arm64-treble-system.img"
if [ -f "$TREBLE_OUT" ]; then
    cp "$TREBLE_OUT" "$TARGET_IMG"
    echo -e "${GREEN}✔ System image staged: ${TARGET_IMG}${NC}"
else
    echo -e "${RED}[ERROR] Treble build script did not produce expected image.${NC}"
    exit 1
fi

# 5. Generate Checksums and Verification Metadata
echo -e "\n${CYAN}[5/5] Generating cryptographic hashes and metadata...${NC}"
cd "$OUTPUT_DIR"
sha256sum "$(basename "$TARGET_IMG")" > "$(basename "$TARGET_IMG").sha256"

cat << EOF > "${OUTPUT_DIR}/build-metadata.json"
{
  "os_name": "LibreDroid Mobile OS",
  "version": "1.0.0-arm64",
  "target_architecture": "arm64-v8a",
  "partition_type": "Project Treble A/B system.img",
  "filesystem": "ext4",
  "build_epoch": ${SOURCE_DATE_EPOCH},
  "sha256": "$(awk '{print $1}' "$(basename "$TARGET_IMG").sha256")",
  "supported_socs": [
    "Qualcomm Snapdragon (845, 855, 865, 888, 8 Gen 1/2/3, 7/6 series)",
    "MediaTek Dimensity (9000, 8000, 7000 series, Helio G-series, MT6789)",
    "Samsung Exynos (1330, 1380, 2100, 2200, 2400)",
    "Google Tensor (G1, G2, G3)"
  ]
}
EOF

IMG_SIZE=$(du -h "$TARGET_IMG" | cut -f1)
echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}   BUILD COMPLETE: LibreDroid Mobile OS is Ready for Flashing!        ${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "Image Path:    $TARGET_IMG ($IMG_SIZE)"
echo -e "SHA256:        $(cat "${TARGET_IMG}.sha256")"
echo -e "Metadata:      ${OUTPUT_DIR}/build-metadata.json"
echo ""
echo -e "${YELLOW}Flashing Options:${NC}"
echo "  1. Direct Full Install:  ./android/fastboot/flash-mobile-os.sh"
echo "  2. Non-Destructive Dual-Boot: ./android/fastboot/dualboot-slot-switcher.sh"
echo ""
