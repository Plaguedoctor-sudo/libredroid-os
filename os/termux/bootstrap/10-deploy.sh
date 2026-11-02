#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
LRD="$HOME/.lrd"

# source tree: prefer ../.. (repo layout), else a pushed tarball
SRC=""
for c in "$HERE/../.." "$HERE" "$HOME/lrd-src"; do
  [ -f "$c/server.js" ] && { SRC="$(cd "$c" && pwd)"; break; }
done
[ -n "$SRC" ] || { echo "xx no server.js found — pass a repo root"; exit 1; }

echo ":: deploying from $SRC"
rm -rf "$LRD/app/dist" "$LRD/app/os"
mkdir -p "$LRD/app"

# shell
if [ -d "$SRC/dist" ]; then cp -a "$SRC/dist" "$LRD/app/dist"; else
  echo "!! no dist/ — run 'npm run build' on the desktop first"; fi

# bridge + backends
install -m644 "$SRC/server.js" "$LRD/app/server.js"
for d in os os/termux os/termux/backends; do
  [ -d "$SRC/$d" ] && cp -a "$SRC/$d" "$LRD/app/$d"
done
cp -a "$HERE/backends/." "$LRD/app/os/termux/backends/" 2>/dev/null || true

# pwa manifest + icon
install -m644 "$HERE/etc/manifest.webmanifest" "$LRD/app/dist/manifest.webmanifest" 2>/dev/null || true
mkdir -p "$LRD/app/dist/icons"
[ -f "$HERE/etc/icon-512.png" ] && cp "$HERE/etc/icon-512.png" "$LRD/app/dist/icons/" || true

# patch index.html: manifest link + viewport-fit + dvh + no-overscroll
IDX="$LRD/app/dist/index.html"
if [ -f "$IDX" ] && ! grep -q 'lrd-manifest' "$IDX"; then
  python - "$IDX" <<'PY'
import sys,re
p=sys.argv[1]; s=open(p,encoding='utf8').read()
s=s.replace('</head>', '<link rel="manifest" href="/manifest.webmanifest"><!--lrd-manifest-->\n</head>')
s=re.sub(r'<meta name="viewport"[^>]*>',
 '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">', s, count=1)
open(p,'w',encoding='utf8').write(s)
print(":: patched index.html")
PY
fi

# node_modules (only if present; server.js is zero-dep, this is for the shell build tools)
[ -d "$SRC/node_modules" ] && [ ! -d "$LRD/app/node_modules" ] && \
  ln -sfn "$SRC/node_modules" "$LRD/app/node_modules" || true

echo ":: deployed $(du -sh "$LRD/app" | cut -f1)"
