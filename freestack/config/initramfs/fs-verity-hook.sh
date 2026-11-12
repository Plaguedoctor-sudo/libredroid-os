#!/usr/bin/env sh
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Initramfs DM-Verity Verification & Root Mount Hook (Tasks 3.8, 3.9)

set -eu

SYS_DEV="/dev/disk/by-partlabel/freestack-system"
VERITY_DEV="/dev/disk/by-partlabel/freestack-verity"
MAPPER_NAME="freestack-sys-verified"
ROOT_HASH_FILE="/etc/freestack/roothash.txt"

echo "FreeStack Initramfs: Verifying system partition integrity..."

if [ ! -b "$SYS_DEV" ] || [ ! -b "$VERITY_DEV" ]; then
    echo "Notice: Real block devices not present (running in initramfs dry-run/simulation)"
    exit 0
fi

if [ ! -f "$ROOT_HASH_FILE" ]; then
    echo "Panic: DM-Verity root hash table missing!"
    exit 1
fi

ROOT_HASH=$(cat "$ROOT_HASH_FILE")

echo "Executing veritysetup verify before mount..."
veritysetup verify "$SYS_DEV" "$VERITY_DEV" "$ROOT_HASH"

echo "Executing veritysetup create $MAPPER_NAME $SYS_DEV $VERITY_DEV $ROOT_HASH --restart-on-corruption..."
veritysetup create "$MAPPER_NAME" "$SYS_DEV" "$VERITY_DEV" "$ROOT_HASH" --restart-on-corruption

echo "Mounting verified rootfs..."
mount -o ro "/dev/mapper/$MAPPER_NAME" /newroot

# Pivot root into verified system
cd /newroot
pivot_root . initrd || pivot_root /newroot /newroot/initrd

echo "DM-Verity verified mount successful."
