#!/usr/bin/env bash
# Build the base arm64 rootfs and bake in one adaptation package.
set -Eeuo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$PWD/build-out}"; SIZE="${SIZE:-6G}"
ADAPT_DEB="${1:?usage: build-rootfs.sh <lrd-adapt-*.deb> [extra.deb...]}"
shift || true

command -v debos >/dev/null || { echo "apt install debos"; exit 1; }
mkdir -p "$OUT"
cp "$@" "$OUT/" 2>/dev/null || true

export ADAPT_DEB OUT SIZE
debos -t architecture:arm64 -t adaptdeb="$(realpath "$ADAPT_DEB")" -t out="$OUT" "$HERE/debos.yaml"

# the image must carry a label the initramfs can find if slot detection fails
img="$OUT/lrd-rootfs.img"
[ -f "$img" ] || { echo "no image produced"; exit 1; }
e2label "$img" LRDROOT 2>/dev/null || true
truncate -s "$SIZE" "$img"
e2fsck -fy "$img" >/dev/null 2>&1 || true
resize2fs "$img" >/dev/null 2>&1 || true
echo ":: $img  $(du -h "$img" | cut -f1)  sha256=$(sha256sum "$img" | cut -c1-16)…"
