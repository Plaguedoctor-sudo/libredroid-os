#!/data/data/com.termux/files/usr/bin/bash
# lrd-backup — nightly state snapshot to /sdcard. --restore <tar|latest>
set -Eeuo pipefail
. "$HOME/.lrd/etc/lrd.env"
DEST="$LRD_SHARED/backups"; mkdir -p "$DEST"
KEEP=7

if [ "${1:-}" = "--restore" ]; then
  src="${2:-latest}"
  [ "$src" = latest ] && src="$(ls -1t "$DEST"/state-*.tar.zst 2>/dev/null | head -1)"
  [ -n "$src" ] && [ -f "$src" ] || { echo "xx no backup found"; exit 1; }
  echo ":: restoring $src"
  pkill -f "$LRD_HOME/app/server.js" 2>/dev/null || true; sleep 1
  rm -rf "$LRD_STATE"; mkdir -p "$LRD_STATE"
  tar -I zstd -xf "$src" -C "$LRD_HOME"
  echo ":: restored. starting"
  sv up lrd 2>/dev/null || setsid node "$LRD_HOME/app/server.js" >>"$LRD_LOG/server.log" 2>&1 &
  exit 0
fi

# what to back up: state + config + domains markers. NOT models (big, re-downloadable).
ts=$(date +%Y%m%d-%H%M%S)
out="$DEST/state-$ts.tar.zst"
tmp=$(mktemp -d)
ln -s "$LRD_STATE" "$tmp/state" 2>/dev/null || cp -a "$LRD_STATE" "$tmp/state"
mkdir -p "$tmp/etc" && cp -a "$LRD_HOME/etc/." "$tmp/etc/" 2>/dev/null || true
mkdir -p "$tmp/domains" && ls -la "$LRD_DOMAINS" > "$tmp/domains/manifest.txt" 2>/dev/null || true
cat > "$tmp/MANIFEST" <<EOF
created=$(date -Is)
sdk=$(getprop ro.build.version.sdk 2>/dev/null || echo unknown)
model=$(getprop ro.product.model 2>/dev/null || echo unknown)
abis=$(getprop ro.product.cpu.abilist 2>/dev/null || echo unknown)
termux=${TERMUX_VERSION:-unknown}
EOF

tar -C "$tmp" -cf - . | zstd -q -19 -o "$out"
rm -rf "$tmp"
echo ":: $out ($(du -h "$out" | cut -f1))"

ls -1t "$DEST"/state-*.tar.zst | tail -n +$((KEEP+1)) | xargs -r rm -f
echo ":: keeping $KEEP most recent"
