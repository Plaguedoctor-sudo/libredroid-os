#!/data/data/com.termux/files/usr/bin/bash
# lrd-update — apply update tarball or hot-reload LibreDroid
set -Eeuo pipefail
. "$HOME/.lrd/etc/lrd.env"

SRC="${1:-$LRD_SHARED/updates/lrd-i1.tgz}"
if [ ! -f "$SRC" ]; then
  echo ":: checking /sdcard/lrd-i1.tgz"
  [ -f "/sdcard/lrd-i1.tgz" ] && SRC="/sdcard/lrd-i1.tgz"
fi

if [ -f "$SRC" ]; then
  echo ":: applying update from $SRC"
  tmp=$(mktemp -d)
  tar -xzf "$SRC" -C "$tmp"
  if [ -d "$tmp/dist" ]; then
    cp -a "$tmp/dist" "$LRD_HOME/app/"
  fi
  if [ -f "$tmp/server.js" ]; then
    cp -a "$tmp/server.js" "$LRD_HOME/app/"
  fi
  if [ -d "$tmp/os/termux" ]; then
    bash "$tmp/os/termux/bootstrap/10-deploy.sh"
  fi
  rm -rf "$tmp"
  echo ":: restarting server"
  sv restart lrd 2>/dev/null || { pkill -f "$LRD_HOME/app/server.js" || true; sleep 1; setsid node "$LRD_HOME/app/server.js" >>"$LRD_LOG/server.log" 2>&1 & }
  echo ":: update complete"
else
  echo "xx no update tarball found at $SRC"
  echo "usage: lrd-update [path/to/lrd-i1.tgz]"
  exit 1
fi
