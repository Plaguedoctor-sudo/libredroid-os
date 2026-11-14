#!/bin/bash
[ -f ~/.bashrc ] && . ~/.bashrc

# only fire on the real tty1 console, once
if [ -z "${WAYLAND_DISPLAY:-}" ] && [ "${XDG_VTNR:-0}" = "1" ]; then
  export XDG_RUNTIME_DIR="/run/user/$(id -u)"
  export XDG_SESSION_TYPE=wayland
  export XDG_CURRENT_DESKTOP=LibreDroid
  export GDK_BACKEND=wayland
  export QT_QPA_PLATFORM=wayland
  export MOZ_ENABLE_WAYLAND=1
  export SHELL_URL="http://127.0.0.1:3001"

  # don't paint a dead page — wait for the bridge
  for _ in $(seq 1 80); do
    curl -sf "$SHELL_URL/api/status" >/dev/null 2>&1 && break
    sleep 0.25
  done

  exec dbus-run-session -- cage -- /usr/bin/chromium \
    --kiosk --app="$SHELL_URL" \
    --ozone-platform=wayland --enable-wayland-ime --touch-events=enabled \
    --enable-features=WebGPU,WebBluetooth,WebUSB,GeoLocation,VaapiVideoDecoder \
    --enable-experimental-web-platform-features \
    --use-gl=egl --enable-zero-copy --ignore-gpu-blocklist \
    --user-data-dir=/home/libredroid/.config/lrd-chromium \
    --password-store=basic --no-first-run --noerrdialogs \
    --disable-infobars --disable-session-crashed-bubble \
    --disable-features=Translate,OptimizationHints
fi
