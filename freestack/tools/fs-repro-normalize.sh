#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Determinism Normalizer & Tarball Clamper (Tasks 7.3, 7.4)
# Enforces SOURCE_DATE_EPOCH, zeroes UID/GID, sorts file entries, strips nondeterminism

set -euo pipefail

TARGET_DIR="${1:-freestack/out/root-x200-libreboot}"
OUT_TAR="${2:-freestack/dist/rootfs-normalized.tar.gz}"

export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-1700000000}"
export LC_ALL=C
export TZ=UTC

echo "=== FreeStack Build Normalization & Deterministic Archiver ==="
if [ ! -d "$TARGET_DIR" ]; then
    echo "Warning: Target directory $TARGET_DIR does not exist; running make stage first..."
    (cd freestack && python3 tools/fsbuild/fsbuild.py stage --target x200-libreboot)
fi

mkdir -p "$(dirname "$OUT_TAR")"

if command -v strip-nondeterminism >/dev/null 2>&1; then
    echo "Running strip-nondeterminism on static libraries and archives..."
    find "$TARGET_DIR" -type f \( -name "*.a" -o -name "*.o" \) -exec strip-nondeterminism {} + || true
fi

echo "Creating bit-for-bit reproducible archive..."
tar --sort=name \
    --mtime="@$SOURCE_DATE_EPOCH" \
    --owner=0 --group=0 --numeric-owner \
    --pax-option=exthdr.name=%d/PaxHeaders/%f,delete=atime,delete=ctime \
    -cf - -C "$TARGET_DIR" . | gzip -n > "$OUT_TAR"

HASH=$(sha256sum "$OUT_TAR" | awk '{print $1}')
echo "✔ Normalized archive created at $OUT_TAR"
echo "  Deterministic SHA256: $HASH"
exit 0
