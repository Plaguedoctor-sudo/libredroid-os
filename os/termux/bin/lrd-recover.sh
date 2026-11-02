#!/data/data/com.termux/files/usr/bin/bash
# One-command recovery. Never makes things worse.
set -uo pipefail
. "$HOME/.lrd/etc/lrd.env" 2>/dev/null || true
L="$LRD_LOG/server.log"
echo "== lrd-recover $(date -Is) =="

echo "[1/6] killing stragglers"
pkill -f "$LRD_HOME/app/server.js" 2>/dev/null || true
sleep 1

echo "[2/6] last 40 log lines"
tail -n 40 "$L" 2>/dev/null || echo "(no log)"

echo "[3/6] port check"
if (echo > /dev/tcp/127.0.0.1/${LRD_PORT}) 2>/dev/null; then
  echo "  port ${LRD_PORT} still held — killing by port"
  pkill -f "node .*server.js" 2>/dev/null || true; sleep 1
fi

echo "[4/6] state integrity"
[ -d "$LRD_STATE" ] || mkdir -p "$LRD_STATE"
# a corrupt icon cache is the most common cause of a blank launcher
if [ -f "$LRD_STATE/icons/.lock" ]; then rm -f "$LRD_STATE/icons/.lock"; fi
# a corrupt queue can wedge the installer
find "$LRD_STATE/queue" -name '*.part' -mmin +60 -delete 2>/dev/null || true

echo "[5/6] rotating log"
if [ -f "$L" ] && [ "$(stat -c %s "$L" 2>/dev/null || echo 0)" -gt 5000000 ]; then
  mv "$L" "$L.1"; echo "(rotated)"
fi

echo "[6/6] starting"
sv up lrd 2>/dev/null || setsid node "$LRD_HOME/app/server.js" >>"$L" 2>&1 &
for i in $(seq 1 20); do
  sleep 1
  if curl -fsS --max-time 3 "http://127.0.0.1:${LRD_PORT}/healthz" >/dev/null 2>&1; then
    echo "OK — server up"; termux-toast -s "LibreDroid recovered"; exit 0
  fi
done

echo "STILL DOWN."
echo "  * if 'Cannot find module' -> rerun install.sh (dist or server.js missing)"
echo "  * if EADDRINUSE            -> something else owns ${LRD_PORT}: pkill -f server.js"
echo "  * if 'permission denied'   -> the queue dir; rm -rf \$LRD_STATE/queue && mkdir it"
echo "  * nuclear: sv down lrd && rm -rf \$LRD_STATE && sv up lrd"
termux-notification --id lrd --title "LibreDroid DOWN" --content "recovery failed — see ~/.lrd/log/server.log" --priority high
exit 1
