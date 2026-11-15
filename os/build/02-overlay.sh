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

# Ensure lrd-shell-start is executable
chmod 0755 "$ROOT"/usr/local/bin/lrd-shell-start 2>/dev/null || true

# Autologin debug consoles on tty1 and serial ttyS0
mkdir -p "$ROOT"/etc/systemd/system/getty@tty1.service.d
cat > "$ROOT"/etc/systemd/system/getty@tty1.service.d/autologin.conf <<'EOF'
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin live --noclear %I $TERM
EOF

mkdir -p "$ROOT"/etc/systemd/system/serial-getty@ttyS0.service.d
cat > "$ROOT"/etc/systemd/system/serial-getty@ttyS0.service.d/autologin.conf <<'EOF'
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin live --noclear 115200 %I $TERM
EOF

# Ensure graphical.target is default
ln -sf /lib/systemd/system/graphical.target "$ROOT"/etc/systemd/system/default.target

# Ensure live user is in systemd-journal and adm for unprivileged journal access
sed -i 's/^systemd-journal:x:\([0-9]*\):.*/systemd-journal:x:\1:live/' "$ROOT"/etc/group 2>/dev/null || true
sed -i 's/^adm:x:\([0-9]*\):.*/adm:x:\1:live/' "$ROOT"/etc/group 2>/dev/null || true

# Strip pam_lastlog to ensure zero PAM dlopen warnings
sed -i '/pam_lastlog\.so/d' "$ROOT"/etc/pam.d/* 2>/dev/null || true

if [ ! -L "$ROOT/etc/systemd/system/multi-user.target.wants/lrd-bridge.service" ]; then
  mkdir -p "$ROOT/etc/systemd/system/multi-user.target.wants" 2>/dev/null || true
  ln -sf /etc/systemd/system/lrd-bridge.service "$ROOT/etc/systemd/system/multi-user.target.wants/lrd-bridge.service" 2>/dev/null || true
fi
if [ ! -L "$ROOT/etc/systemd/system/graphical.target.wants/lrd-shell.service" ]; then
  mkdir -p "$ROOT/etc/systemd/system/graphical.target.wants" 2>/dev/null || true
  ln -sf /etc/systemd/system/lrd-shell.service "$ROOT/etc/systemd/system/graphical.target.wants/lrd-shell.service" 2>/dev/null || true
fi
if [ "$(id -u)" -eq 0 ]; then
  chroot "$ROOT" systemctl enable lrd-bridge.service 2>/dev/null || true
fi
