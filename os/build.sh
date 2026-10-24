#!/bin/bash
# LibreDroid OS — reference image builder (x86_64, hybrid BIOS+EFI live ISO)
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD="$REPO/os/build"
DIST="$REPO/dist"

need() { command -v "$1" >/dev/null 2>&1 || { echo "✗ missing: $1"; exit 1; }; }
for c in lb mmdebstrap xorriso node npm; do need "$c"; done

sudo -v
echo "── 1/4  building the shell ──────────────────────────────"
cd "$REPO"
if [ -f package-lock.json ]; then npm ci --no-audit --fund=false
else npm install --no-audit --fund=false; fi
npm run build

echo "── 2/4  staging shell into the image ────────────────────"
STAGE="$BUILD/config/includes.chroot/opt/libredroid/shell"
rm -rf "$STAGE"; mkdir -p "$STAGE"
if [ -d "$DIST" ] && [ -f "$DIST/index.html" ]; then
  cp -a "$DIST"/. "$STAGE"/
  echo "   ✓ staged dist/ ($(du -sh "$STAGE" | cut -f1))"
else
  cp -a "$BUILD/placeholder"/. "$STAGE"/
  echo "   ! dist/ missing — using placeholder shell"
fi

echo "── 3/4  permissions ────────────────────────────────────"
chmod +x "$BUILD"/auto/config
chmod +x "$BUILD"/config/hooks/live/*.hook.chroot
chmod +x "$BUILD"/config/includes.chroot/opt/libredroid/bin/*
chmod +x "$BUILD"/config/includes.chroot/opt/libredroid/bridge/*.sh

echo "── 4/4  lb build (this takes 15–40 min) ────────────────"
cd "$BUILD"
sudo lb clean --purge
sudo lb build

ISO="$(ls -1t "$BUILD"/*.iso 2>/dev/null | head -n1 || true)"
if [ -n "$ISO" ]; then
  echo; echo "✓ ISO ready: $ISO"; ls -lh "$ISO"
  echo
  echo "boot it:  qemu-system-x86_64 -enable-kvm -m 4096 -smp 4 \\"
  echo "            -drive file=$ISO,format=raw -vga virtio -display gtk"
else
  echo "✗ no ISO produced"; exit 1
fi
