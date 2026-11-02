#!/data/data/com.termux/files/usr/bin/bash
# lrd-fullscreen — launch LibreDroid shell as PWA / Kiosk mode
set -uo pipefail
. "$HOME/.lrd/etc/lrd.env"

URL="http://${LRD_BIND:-127.0.0.1}:${LRD_PORT:-3001}/?kiosk=1"

echo ":: opening $URL"
if command -v termux-open-url >/dev/null 2>&1; then
  termux-open-url "$URL"
else
  # fallback to Chrome / default browser intent
  am start -a android.intent.action.VIEW -d "$URL" >/dev/null 2>&1 || \
  am start -n com.android.chrome/com.google.android.apps.chrome.Main -d "$URL" >/dev/null 2>&1 || true
fi
