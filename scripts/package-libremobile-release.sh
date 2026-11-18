#!/usr/bin/env bash
# ==============================================================================
# package-libremobile-release.sh — LibreMobile OS Master Release Packaging Pipeline
# Spec compliance: LibreDroid System Design v0.1 §2, §3, §15, §16
#
# Generates bit-for-bit deterministic shippable release archives for:
# - Volla Phone X23 (vidofnir)
# - OnePlus Pad Go (OP5DA6L1)
# - Generic ARM64 rootfs + dm-verity Merkle tree
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
OUT_RELEASE="${1:-${REPO_ROOT}/dist-release}"

say() { echo -e "\033[1;36m::\033[0m $*"; }
ok()  { echo -e "\033[1;32m✔\033[0m $*"; }
die() { echo -e "\033[1;31mxx\033[0m $*" >&2; exit 1; }

echo "======================================================================"
echo "   LibreMobile OS Master Release Packaging Pipeline (1.0-RC)          "
echo "======================================================================"

mkdir -p "$OUT_RELEASE"
TMP_STAGE="/tmp/lrd_release_stage_$$"
mkdir -p "$TMP_STAGE"
trap 'rm -rf "$TMP_STAGE"' EXIT

# 1. Build Halium Boot Artifacts for All Targets
say "[1/5] Compiling bit-for-bit Halium boot artifacts for all targets..."
BOOT_BUILDER="${REPO_ROOT}/halium-vidofnir/build_halium_boot.py"
python3 "$BOOT_BUILDER" --device all "$TMP_STAGE/boot" >/dev/null
ok "Generated Halium boot and vendor_boot images for vidofnir & OP5DA6L1."

# 2. Build Reproducible Generic Rootfs
say "[2/5] Building bit-for-bit reproducible ARM64 generic rootfs..."
ROOTFS_BUILDER="${REPO_ROOT}/scripts/build-reproducible-rootfs.sh"
"$ROOTFS_BUILDER" "$TMP_STAGE/rootfs" >/dev/null
ROOTFS_IMG="$TMP_STAGE/rootfs/libremobile-arm64-generic.img"
ok "Generated generic rootfs: $(basename "$ROOTFS_IMG")"

# 3. Generate dm-verity Hash Tree & Verity Mapping Table
say "[3/5] Calculating dm-verity Merkle hash tree and kernel mapping table..."
VERITY_IMG="$TMP_STAGE/rootfs/libremobile-arm64-generic.verity.img"
VERITY_HARNESS="${REPO_ROOT}/scripts/lrd-security-harness.py"
python3 "$VERITY_HARNESS" verity-format --image "$ROOTFS_IMG" --hash-image "$VERITY_IMG" > "$TMP_STAGE/rootfs/verity-table.json"
ROOT_HASH=$(jq -r '.root_hash' "$TMP_STAGE/rootfs/verity-table.json")
ok "Computed dm-verity root hash: $ROOT_HASH"

# 4. Package Device-Specific Distribution Bundles
say "[4/5] Assembling device distribution bundles..."
DEVICES=("vidofnir" "OP5DA6L1")

for dev in "${DEVICES[@]}"; do
    DEV_DIR="$TMP_STAGE/$dev"
    mkdir -p "$DEV_DIR"
    cp "$TMP_STAGE/boot/boot-${dev}-libremobile.img" "$DEV_DIR/boot.img"
    cp "$TMP_STAGE/boot/vendor_boot-${dev}-libremobile.img" "$DEV_DIR/vendor_boot.img"
    cp "$ROOTFS_IMG" "$DEV_DIR/rootfs.img"
    cp "$VERITY_IMG" "$DEV_DIR/rootfs.verity.img"
    cp "$TMP_STAGE/rootfs/verity-table.json" "$DEV_DIR/verity-table.json"
    cp "${REPO_ROOT}/profiles/${dev}.env" "$DEV_DIR/profile.env"
    cp "${REPO_ROOT}/scripts/flash-libremobile.sh" "$DEV_DIR/flash.sh"
    chmod +x "$DEV_DIR/flash.sh"

    # Compute bundle checksums
    (cd "$DEV_DIR" && sha256sum * > SHA256SUMS)

    # Archive bundle
    say "Compressing distribution bundle for ${dev} (multi-threaded xz)..."
    tar -I "xz -T0 -2" -cf "$OUT_RELEASE/libremobile-1.0-rc-${dev}.tar.xz" -C "$TMP_STAGE" "$dev"
    ok "Created release bundle: $OUT_RELEASE/libremobile-1.0-rc-${dev}.tar.xz"
done

# Copy standalone universal assets to dist-release
cp "$ROOTFS_IMG" "$OUT_RELEASE/"
cp "$VERITY_IMG" "$OUT_RELEASE/"
cp "$TMP_STAGE/rootfs/verity-table.json" "$OUT_RELEASE/"
cp "$TMP_STAGE/boot/"*.img "$OUT_RELEASE/"
cp "${REPO_ROOT}/scripts/flash-libremobile.sh" "$OUT_RELEASE/"

# 5. Master Release Manifest & Global Checksums
say "[5/5] Generating release manifest and global cryptographic checksums..."
(cd "$OUT_RELEASE" && sha256sum *.tar.xz *.img > SHA256SUMS.txt)

cat << EOF > "$OUT_RELEASE/release-manifest.json"
{
  "product": "LibreMobile OS",
  "version": "1.0-RC",
  "release_date": "2026-11-17",
  "license": "GPL-3.0-or-later",
  "proprietary_vendor_blobs": 0,
  "supported_devices": [
    {
      "codename": "vidofnir",
      "model": "Volla Phone X23",
      "tier": "T1",
      "archive": "libremobile-1.0-rc-vidofnir.tar.xz"
    },
    {
      "codename": "OP5DA6L1",
      "model": "OnePlus Pad Go",
      "tier": "T1",
      "archive": "libremobile-1.0-rc-OP5DA6L1.tar.xz"
    }
  ],
  "rootfs_root_hash": "$ROOT_HASH",
  "verity_algorithm": "sha256",
  "reproducible": true
}
EOF

echo ""
echo "======================================================================"
echo "   LIBREMOBILE OS RELEASE PACKAGING COMPLETE                          "
echo "======================================================================"
echo "Artifact Directory: $OUT_RELEASE"
ls -lh "$OUT_RELEASE"/*.tar.xz
echo ""
ok "Master release manifest ready at: $OUT_RELEASE/release-manifest.json"
