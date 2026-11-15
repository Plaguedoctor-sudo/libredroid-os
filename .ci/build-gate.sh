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

# 1. Structural integrity assertions: essential binaries, root ownership paths, and user databases
echo "[1/3] Asserting required paths in SquashFS..."
SQUASH_LIST=$(unsquashfs -l "$SQUASHFS")
for p in usr/bin/cage usr/bin/chromium usr/bin/node etc/shadow root; do
  grep -E "^squashfs-root/$p" >/dev/null <<< "$SQUASH_LIST" \
    || { echo "FAIL: missing required path $p in $SQUASHFS" >&2; exit 1; }
done
# Check init binary (merged-usr in Debian Trixie places it at usr/sbin/init with sbin -> usr/sbin)
grep -E "^squashfs-root/(sbin|usr/sbin)/init" >/dev/null <<< "$SQUASH_LIST" \
  || { echo "FAIL: missing init binary in $SQUASHFS" >&2; exit 1; }

# 2. Package database sanity assertion
echo "[2/3] Asserting installed package count..."
pkgs=$(unsquashfs -cat "$SQUASHFS" var/lib/dpkg/status | grep -c '^Package:')
echo "Found $pkgs packages in dpkg database."
[ "$pkgs" -ge 250 ] || { echo "FAIL: only $pkgs packages (expected at least 250)" >&2; exit 1; }

# 3. Secondary size regression tripwire
# NOTE: The uncompressed rootfs is ~1.5 GB. With zstd level 19 compression, it packs to ~637 MB.
# 600 MB is a floor tripwire against partial bootstraps; this floor must rise as OS content grows.
echo "[3/3] Asserting minimum size regression floor..."
MIN_MB="${GATE_MIN_MB:-600}"
if [ "$SIZE_MB" -lt "$MIN_MB" ]; then
  echo "FAIL: SquashFS size is ${SIZE_MB} MB (under ${MIN_MB} MB threshold)." >&2
  exit 1
fi

echo "PASS: All SquashFS integrity, package count ($pkgs), and size checks passed."
exit 0
