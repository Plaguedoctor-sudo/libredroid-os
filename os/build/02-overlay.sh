#!/usr/bin/env bash
set -euo pipefail
ROOT="${ROOT:-out/rootfs}"
[ -d "$ROOT" ] || { echo "no rootfs"; exit 1; }
rsync -aHAX --numeric-ids os/build/config/includes.chroot/ "$ROOT/"
rsync -aHAX --numeric-ids dist/ "$ROOT"/opt/libredroid/dist/
install -Dm644 server.js "$ROOT"/opt/libredroid/server.js
rm -f "$ROOT"/etc/systemd/system/lrd-bridge.service
cat > "$ROOT"/etc/systemd/system/lrd-bridge.service <<'EOF'
[Unit]
Description=LibreDroid bridge
After=network.target
[Service]
User=live
WorkingDirectory=/opt/libredroid
ExecStart=/usr/bin/node server.js
Restart=always
[Install]
WantedBy=multi-user.target
EOF

if [ ! -L "$ROOT/etc/systemd/system/multi-user.target.wants/lrd-bridge.service" ]; then
  mkdir -p "$ROOT/etc/systemd/system/multi-user.target.wants" 2>/dev/null || true
  ln -sf /etc/systemd/system/lrd-bridge.service "$ROOT/etc/systemd/system/multi-user.target.wants/lrd-bridge.service" 2>/dev/null || true
fi
if [ "$(id -u)" -eq 0 ]; then
  chroot "$ROOT" systemctl enable lrd-bridge.service 2>/dev/null || true
fi
