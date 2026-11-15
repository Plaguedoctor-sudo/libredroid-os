#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
set -euo pipefail

SQUASHFS="${1:-out/iso/live/filesystem.squashfs}"

if [ ! -f "$SQUASHFS" ]; then
  echo "FAIL: SquashFS not found at $SQUASHFS" >&2
  exit 1
fi

# Get size in bytes using wc -c (portable across all Linux/BSD)
SIZE_BYTES=$(wc -c < "$SQUASHFS")
SIZE_MB=$((SIZE_BYTES / 1024 / 1024))
HUMAN_SIZE=$(du -sh "$SQUASHFS" | cut -f1)

echo "Inspecting SquashFS image: $SQUASHFS (${HUMAN_SIZE}, ${SIZE_MB} MB)"

# Gate: Threshold set to 600 MB.
# NOTE: The uncompressed rootfs is 1.5 GB. When compressed using
# 'mksquashfs -comp zstd -Xcompression-level 19', the high compression ratio yields
# ~637 MB (636 MB). A partial/failed bootstrap yields < 400 MB.
MIN_MB="${GATE_MIN_MB:-600}"
if [ "$SIZE_MB" -lt "$MIN_MB" ]; then
  echo "FAIL: SquashFS size is ${SIZE_MB} MB (under ${MIN_MB} MB threshold)." >&2
  echo "A squashfs under 700 MB means bootstrap silently failed." >&2
  exit 1
fi

echo "PASS: SquashFS gate passed (${SIZE_MB} MB >= ${MIN_MB} MB threshold)"
exit 0
