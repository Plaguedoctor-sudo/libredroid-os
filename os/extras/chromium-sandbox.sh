#!/bin/sh
# /etc/lrd/chromium-sandbox.sh — wrapped by launch.sh
# Chromium already seccomp-bpf's its renderers. What it does not do is restrict
# the browser process. Use systemd's sandbox for that via a user unit.
exec /usr/bin/chromium \
  --kiosk --noerrdialogs --disable-pinch --overscroll-history-navigation=0 \
  --enable-features=UseOzonePlatform --ozone-platform=wayland \
  --enable-wayland-ime \
  --disable-features=UseChromeOSDirectVideoDecoder \
  --renderer-process-limit=4 \
  --js-flags="--max-old-space-size=384" \
  --disk-cache-size=268435456 \
  --disable-background-networking \
  --disable-component-update \
  --no-first-run --no-default-browser-check \
  --password-store=basic \
  --user-data-dir=/var/lib/lrd/chromium \
  http://127.0.0.1:3001/?kiosk=1
