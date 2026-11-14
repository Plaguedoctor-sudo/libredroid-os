#!/usr/bin/env bash
# Sovereign Application Platform — A/B dm-verity Verification and Negative Tamper Test
set -euo pipefail

ARCH="${1:-x86_64}"
BUILD_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOTFS_DIR="${BUILD_DIR}/../out/rootfs/${ARCH}"
KEYS_DIR="${BUILD_DIR}/../out/keys"

say() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

say "Starting dm-verity Cryptographic Verification Suite for ${ARCH}..."

METADATA_JSON="${ROOTFS_DIR}/verity-slots.json"
[ -f "${METADATA_JSON}" ] || die "Slot metadata not found: ${METADATA_JSON}"

ROOT_HASH=$(python3 -c "import json; print(json.load(open('${METADATA_JSON}'))['rootHash'])")
SALT=$(python3 -c "import json; print(json.load(open('${METADATA_JSON}'))['salt'])")
VERITY_IMG="${ROOTFS_DIR}/rootfs.verity"
SLOT_A="${ROOTFS_DIR}/slot_a.img"
SLOT_B="${ROOTFS_DIR}/slot_b.img"

say "Verifying Slot A against cryptographic Merkle tree..."
/usr/sbin/veritysetup verify "${SLOT_A}" "${VERITY_IMG}" "${ROOT_HASH}"
say "  [PASS] Slot A rootfs cryptographic integrity verified!"

say "Verifying Slot B (Standby Slot)..."
/usr/sbin/veritysetup verify "${SLOT_B}" "${VERITY_IMG}" "${ROOT_HASH}"
say "  [PASS] Slot B rootfs cryptographic integrity verified!"

say "Verifying Root Hash RSA-4096 digital signature..."
VERITY_PUBKEY="${KEYS_DIR}/verity_public_key.pem"
SIG_FILE="${ROOTFS_DIR}/verity.sig"
echo -n "${ROOT_HASH}" | openssl dgst -sha256 -verify "${VERITY_PUBKEY}" -signature "${SIG_FILE}" >/dev/null
say "  [PASS] Root Hash digital signature is mathematically authentic!"

say "Executing Negative Tamper Test (Deliberate 1-byte data corruption)..."
TAMPERED_IMG="/tmp/tampered_slot_${ARCH}.img"
cp "${SLOT_A}" "${TAMPERED_IMG}"

# Corrupt single byte at offset 512
printf '\xFF' | dd of="${TAMPERED_IMG}" bs=1 seek=512 count=1 conv=notrunc 2>/dev/null

# veritysetup MUST fail
set +e
/usr/sbin/veritysetup verify "${TAMPERED_IMG}" "${VERITY_IMG}" "${ROOT_HASH}" 2>/dev/null
VERITY_EXIT=$?
set -e

rm -f "${TAMPERED_IMG}"

if [ "${VERITY_EXIT}" -ne 0 ]; then
    say "  [PASS] Negative Tamper Test Succeeded: dm-verity caught byte alteration and refused mount!"
else
    die "CRITICAL SECURITY FAILURE: dm-verity failed to detect corrupted block!"
fi

say "All A/B dm-verity cryptographic assertions passed cleanly."
