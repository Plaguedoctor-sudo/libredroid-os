#!/usr/bin/env bash
# LibreDroid I1 builder script
set -Eeuo pipefail

export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-1700000000}"
export TZ="UTC"
export LC_ALL="C.UTF-8"

echo ":: building frontend with Vite + TypeScript"
npm run build

echo ":: creating deterministic LibreDroid I1 distribution tarball (lrd-i1.tgz)"
# Exclude large .iso files if any in dist and normalize timestamps/ownership
tar --sort=name \
    --owner=root:0 \
    --group=root:0 \
    --numeric-owner \
    --mtime="@${SOURCE_DATE_EPOCH}" \
    --exclude='*.iso' \
    -cf - -C . os/termux dist server.js package.json | gzip -n > lrd-i1.tgz

echo ":: build complete. Output: lrd-i1.tgz ($(du -h lrd-i1.tgz | cut -f1))"
echo ":: ready to push to device: adb push lrd-i1.tgz /sdcard/"
