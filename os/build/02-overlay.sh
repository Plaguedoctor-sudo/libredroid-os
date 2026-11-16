#!/usr/bin/env bash
set -euo pipefail
ROOT="${ROOT:-out/rootfs}"
[ -d "$ROOT" ] || { echo "no rootfs"; exit 1; }
rsync -aHAX --numeric-ids os/build/config/includes.chroot/ "$ROOT/"
rsync -aHAX --numeric-ids dist/ "$ROOT"/opt/libredroid/dist/
install -Dm644 server.js "$ROOT"/opt/libredroid/server.js

# Install backend modules into /opt/libredroid
mkdir -p "$ROOT"/opt/libredroid/os/termux/backends "$ROOT"/opt/libredroid/backends
rsync -aHAX os/termux/backends/ "$ROOT"/opt/libredroid/os/termux/backends/
rsync -aHAX os/termux/backends/ "$ROOT"/opt/libredroid/backends/

# Install verification and acceptance tools into /usr/bin
install -Dm755 os/verify/lrd-verify "$ROOT"/usr/bin/lrd-verify
install -Dm755 os/desktop/lrd-doctor "$ROOT"/usr/bin/lrd-doctor
install -Dm755 os/install/lrd-install "$ROOT"/usr/bin/lrd-install
mkdir -p "$ROOT"/usr/share/lrd
install -Dm644 os/desktop/doctor-checks.tsv "$ROOT"/usr/share/lrd/doctor-checks.tsv

# Ensure strict system directory permissions
chmod 0755 "$ROOT"/usr/sbin "$ROOT"/usr/local/bin "$ROOT"/usr/local/sbin 2>/dev/null || true
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
RestartSec=2
NoNewPrivileges=true
PrivateTmp=true
ProtectControlGroups=true
ProtectKernelModules=true
ProtectKernelTunables=true
RestrictRealtime=true
RestrictSUIDSGID=true
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

# Ensure live user is in required hardware and system groups
for grp in audio video render input sudo systemd-journal adm plugdev netdev; do
  sed -i "s/^${grp}:x:\([0-9]*\):.*/&,live/; s/:,live/:live/" "$ROOT"/etc/group 2>/dev/null || true
done

# Clean any deprecated pam_lastlog.so references precisely without touching comments or pam_lastlog2
sed -i '/^[[:space:]]*session[[:space:]].*pam_lastlog\.so/d' "$ROOT"/etc/pam.d/login "$ROOT"/etc/pam.d/common-session 2>/dev/null || true

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
