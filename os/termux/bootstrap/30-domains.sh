#!/data/data/com.termux/files/usr/bin/bash
# 30-domains.sh — Pre-initialize proot-distro domains and storage directories
set -Eeuo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
. "$HOME/.lrd/etc/lrd.env" 2>/dev/null || true

echo ":: setting up proot domains (work, dispos, vault)"
mkdir -p "$LRD_DOMAINS" "$LRD_STATE"

# Delegate to lrd-termux-up
if [ -x "$HERE/bin/lrd-termux-up.sh" ]; then
  bash "$HERE/bin/lrd-termux-up.sh" || true
fi
