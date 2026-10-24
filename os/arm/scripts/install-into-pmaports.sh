#!/bin/bash
# Copy the LibreDroid packages into a pmaports checkout and checksum them.
set -euo pipefail

PMAPORTS="${PMAPORTS:-$HOME/pmaports}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

[ -d "$PMAPORTS/.git" ] || { echo "✗ PMAPORTS=$PMAPORTS is not a git checkout"; exit 1; }
command -v pmbootstrap >/dev/null || { echo "✗ pmbootstrap not installed"; exit 1; }

for p in libredroid-shell libredroid-config libredroid-meta; do
  echo "→ staging $p"
  rm -rf "$PMAPORTS/main/$p"
  cp -a "$HERE/pmaports/$p" "$PMAPORTS/main/$p"
done

echo "→ generating checksums"
cd "$PMAPORTS"
for p in libredroid-shell libredroid-config libredroid-meta; do
  ( cd "main/$p" && pmbootstrap checksum --arch aarch64 )
done

echo "→ staged. now run:"
echo "   pmbootstrap install --add=libredroid-meta --systemd"
