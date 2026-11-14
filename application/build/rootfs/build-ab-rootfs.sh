#!/usr/bin/env bash
# Sovereign Application Platform — Automated A/B dm-verity SquashFS Rootfs Builder
set -euo pipefail

ARCH="${1:-x86_64}"
BUILD_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "${BUILD_DIR}/../.." && pwd)"
OUT_DIR="${BUILD_DIR}/../out/rootfs/${ARCH}"
STAGING_DIR="/tmp/sap-rootfs-staging-${ARCH}"
KEYS_DIR="${BUILD_DIR}/../out/keys"

say() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

say "Building Sovereign A/B dm-verity Rootfs for ${ARCH}..."

rm -rf "${STAGING_DIR}"
mkdir -p "${STAGING_DIR}"/{bin,sbin,usr/bin,usr/lib,usr/share/sap/models,etc/sap/targets,proc,sys,dev,var/log,run/sap,mnt}
mkdir -p "${OUT_DIR}" "${KEYS_DIR}"

# 1. Populate Staging Rootfs with Sovereign Application Platform Binaries
say "Populating staging rootfs..."
cat > "${STAGING_DIR}/etc/os-release" <<EOF
NAME="Sovereign Application Platform"
ID="sovereign-sap"
VERSION="1.0.0-sovereign"
PRETTY_NAME="Sovereign OS v1.0.0 (${ARCH})"
HOME_URL="https://github.com/Plaguedoctor-sudo/libredroid-os"
SUPPORT_URL="https://github.com/Plaguedoctor-sudo/libredroid-os/issues"
BUG_REPORT_URL="https://github.com/Plaguedoctor-sudo/libredroid-os/issues"
EOF

# Copy target profile
cp "${APP_DIR}/targets/${ARCH}-"*.json "${STAGING_DIR}/etc/sap/targets/" 2>/dev/null || \
cp "${APP_DIR}/targets/x86_64-uefi.json" "${STAGING_DIR}/etc/sap/targets/"

# Copy Native Local AI Engine binary if built
if [ -f "${APP_DIR}/ai/inference/csrc/sap_bench_int4" ]; then
    cp "${APP_DIR}/ai/inference/csrc/sap_bench_int4" "${STAGING_DIR}/bin/sap_ai_engine"
else
    echo "#!/bin/sh\necho 'sap ai stub'" > "${STAGING_DIR}/bin/sap_ai_engine"
    chmod +x "${STAGING_DIR}/bin/sap_ai_engine"
fi

# Bundle INT4 Model Weights Asset into /usr/share/sap/models/
if [ -f "${APP_DIR}/ai/models/smollm2-360m-instruct-q4_0.bin" ]; then
    cp "${APP_DIR}/ai/models/smollm2-360m-instruct-q4_0.bin" "${STAGING_DIR}/usr/share/sap/models/"
    cp "${APP_DIR}/ai/models/model-manifest.json" "${STAGING_DIR}/usr/share/sap/models/"
    say "Bundled INT4 SmolLM2 model weights into rootfs /usr/share/sap/models/"
fi

# Create Sovereign Init script
cat > "${STAGING_DIR}/bin/init" <<'EOF'
#!/bin/sh
# Sovereign OS Minimal PID 1 Init
export PATH=/bin:/sbin:/usr/bin:/usr/sbin
mount -t proc proc /proc
mount -t sysfs sysfs /sys
mount -t devtmpfs devtmpfs /dev
echo "=========================================================="
echo "Sovereign Application Platform (SAP) — Booted Successfully"
echo "Active Slot: dm-verity Cryptographically Sealed Rootfs"
echo "=========================================================="
exec /bin/sh
EOF
chmod +x "${STAGING_DIR}/bin/init"

# 2. Build Deterministic SquashFS Image
SQUASHFS_IMG="${OUT_DIR}/rootfs.squashfs"
rm -f "${SQUASHFS_IMG}"
say "Compressing deterministic SquashFS filesystem (zstd level 19)..."
mksquashfs "${STAGING_DIR}" "${SQUASHFS_IMG}" \
    -comp zstd -Xcompression-level 19 \
    -all-root -reproducible -no-xattrs -no-progress >/dev/null

FS_SIZE=$(stat -c%s "${SQUASHFS_IMG}")
say "SquashFS image generated: ${FS_SIZE} bytes"

# 3. Generate Cryptographic dm-verity Merkle Hash Tree
VERITY_HASH_IMG="${OUT_DIR}/rootfs.verity"
rm -f "${VERITY_HASH_IMG}"
say "Generating dm-verity Merkle hash tree via veritysetup..."

VERITY_OUTPUT=$(/usr/sbin/veritysetup format "${SQUASHFS_IMG}" "${VERITY_HASH_IMG}")
ROOT_HASH=$(echo "${VERITY_OUTPUT}" | awk '/Root hash:/ {print $3}')
SALT=$(echo "${VERITY_OUTPUT}" | awk '/Salt:/ {print $2}')
DATA_BLOCKS=$(echo "${VERITY_OUTPUT}" | awk '/Data blocks:/ {print $3}')
DATA_BLOCK_SIZE=$(echo "${VERITY_OUTPUT}" | awk '/Data block size:/ {print $4}')

say "dm-verity formatted:"
say "  Root Hash:   ${ROOT_HASH}"
say "  Salt:        ${SALT}"
say "  Data Blocks: ${DATA_BLOCKS}"

# 4. Key Ceremony: Generate RSA-4096 / Ed25519 Verity Signing Keypair if not present
VERITY_PRIVKEY="${KEYS_DIR}/verity_signing_key.pem"
VERITY_PUBKEY="${KEYS_DIR}/verity_public_key.pem"
if [ ! -f "${VERITY_PRIVKEY}" ]; then
    say "Generating RSA-4096 verity signing keypair..."
    openssl genrsa -out "${VERITY_PRIVKEY}" 4096 2>/dev/null
    openssl rsa -in "${VERITY_PRIVKEY}" -pubout -out "${VERITY_PUBKEY}" 2>/dev/null
fi

# Sign Root Hash
SIG_FILE="${OUT_DIR}/verity.sig"
echo -n "${ROOT_HASH}" | openssl dgst -sha256 -sign "${VERITY_PRIVKEY}" -out "${SIG_FILE}"
say "Root hash cryptographically signed: ${SIG_FILE}"

# 5. Assemble Dual-Slot A/B Images (slot_a.img & slot_b.img)
SLOT_A_IMG="${OUT_DIR}/slot_a.img"
SLOT_B_IMG="${OUT_DIR}/slot_b.img"

say "Assembling Dual-Slot A/B images..."
cp "${SQUASHFS_IMG}" "${SLOT_A_IMG}"
cp "${SQUASHFS_IMG}" "${SLOT_B_IMG}"

# 6. Generate Bootloader Configurations (systemd-boot & U-Boot extlinux)
say "Generating bootloader integration configs..."

BOOTLOADER_DIR="${OUT_DIR}/bootloader"
mkdir -p "${BOOTLOADER_DIR}/loader/entries"

# systemd-boot for x86_64
SECTORS=$(( DATA_BLOCKS * DATA_BLOCK_SIZE / 512 ))
cat > "${BOOTLOADER_DIR}/loader/entries/sap-slot-a.conf" <<EOF
title      Sovereign OS (Slot A - Verified)
linux      /vmlinuz-sovereign
options    ro console=tty0 console=ttyS0,115200n8 androidboot.slot_suffix=_a dm-mod.create="sap-rootfs,,,ro,0 ${SECTORS} verity 1 /dev/disk/by-partlabel/sap_root_a /dev/disk/by-partlabel/sap_hash_a 4096 4096 ${DATA_BLOCKS} 1 sha256 ${ROOT_HASH} ${SALT}" root=/dev/dm-0
EOF

cat > "${BOOTLOADER_DIR}/loader/entries/sap-slot-b.conf" <<EOF
title      Sovereign OS (Slot B - Standby)
linux      /vmlinuz-sovereign
options    ro console=tty0 console=ttyS0,115200n8 androidboot.slot_suffix=_b dm-mod.create="sap-rootfs,,,ro,0 ${SECTORS} verity 1 /dev/disk/by-partlabel/sap_root_b /dev/disk/by-partlabel/sap_hash_b 4096 4096 ${DATA_BLOCKS} 1 sha256 ${ROOT_HASH} ${SALT}" root=/dev/dm-0
EOF

# U-Boot extlinux.conf for ARM64
cat > "${BOOTLOADER_DIR}/extlinux.conf" <<EOF
default sovereign-slot-a
timeout 20

label sovereign-slot-a
    menu label Sovereign OS Slot A (Verified)
    linux /Image.gz
    append ro root=/dev/dm-0 androidboot.slot_suffix=_a dm-mod.create="sap-rootfs,,,ro,0 ${SECTORS} verity 1 /dev/disk/by-partlabel/sap_root_a /dev/disk/by-partlabel/sap_hash_a 4096 4096 ${DATA_BLOCKS} 1 sha256 ${ROOT_HASH} ${SALT}"

label sovereign-slot-b
    menu label Sovereign OS Slot B (Rollback Standby)
    linux /Image.gz
    append ro root=/dev/dm-0 androidboot.slot_suffix=_b dm-mod.create="sap-rootfs,,,ro,0 ${SECTORS} verity 1 /dev/disk/by-partlabel/sap_root_b /dev/disk/by-partlabel/sap_hash_b 4096 4096 ${DATA_BLOCKS} 1 sha256 ${ROOT_HASH} ${SALT}"
EOF

# Emit A/B Slot Manifest Ledger
METADATA_JSON="${OUT_DIR}/verity-slots.json"
cat > "${METADATA_JSON}" <<EOF
{
  "arch": "${ARCH}",
  "filesystem": "squashfs-zstd",
  "activeSlot": "slot_a",
  "standbySlot": "slot_b",
  "dataBlockSize": ${DATA_BLOCK_SIZE},
  "hashBlockSize": 4096,
  "dataBlocks": ${DATA_BLOCKS},
  "rootHash": "${ROOT_HASH}",
  "salt": "${SALT}",
  "signatureAlgorithm": "RSA-4096-SHA256",
  "rollbackIndex": 1,
  "bootAttemptsRemaining": 3
}
EOF

rm -rf "${STAGING_DIR}"
say "A/B dm-verity Rootfs build complete for ${ARCH}!"
say "  Slot A:   ${SLOT_A_IMG}"
say "  Slot B:   ${SLOT_B_IMG}"
say "  Verity:   ${VERITY_HASH_IMG}"
say "  Ledger:   ${METADATA_JSON}"
