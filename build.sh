#!/usr/bin/env bash
# LibreDroid I1 builder script
set -Eeuo pipefail

echo ":: building frontend with Vite + TypeScript"
npm run build

echo ":: creating LibreDroid I1 distribution tarball (lrd-i1.tgz)"
# Exclude large .iso files if any in dist
tar --exclude='*.iso' -czf lrd-i1.tgz -C . os/termux dist server.js package.json

echo ":: build complete. Output: lrd-i1.tgz ($(du -h lrd-i1.tgz | cut -f1))"
echo ":: ready to push to device: adb push lrd-i1.tgz /sdcard/"
