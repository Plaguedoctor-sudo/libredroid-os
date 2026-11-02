#!/data/data/com.termux/files/usr/bin/bash
# Runs on device boot via Termux:Boot. Must return fast.
exec >>"$HOME/.lrd/log/boot.log" 2>&1
echo "=== boot $(date -Is) ==="
termux-wake-lock 2>/dev/null || true
# runit supervisor, then the services it supervises
service-daemon start 2>/dev/null || true
sleep 1
for s in tor lrd watchdog backup events; do sv up "$s" 2>/dev/null || true; done
sleep 2
# emit lifecycle event to SSE stream
boots=$(cat "$HOME/.lrd/state/boots" 2>/dev/null || echo 1)
"$HOME/.lrd/bin/lrd-emit" lifecycle "{\"phase\":\"running\",\"bootCount\":$boots}" 2>/dev/null || true

curl -fsS http://127.0.0.1:3001/healthz >/dev/null 2>&1 \
  && termux-toast -s "LibreDroid up" \
  || termux-notification --id lrd --title "LibreDroid" --content "server failed to start — tap to recover" \
       --action "$HOME/.lrd/bin/lrd-recover.sh" --priority high
