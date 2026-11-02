#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

pkg update -y >/dev/null
# core: node, runit service manager, storage/API bridges, proot, fs tools, tor, vnc
pkg install -y \
  nodejs-lts \
  termux-services runit \
  termux-api termux-am \
  proot-distro \
  openssh rsync tar zstd unzip zip \
  curl wget jq \
  tor privoxy \
  x11-repo \
  tigervnc websockify \
  gocryptfs \
  aapt \
  python \
  nmap-ncat \
  || true

# x11 extras are best-effort (repo flakes)
pkg install -y novnc x11vnc 2>/dev/null || true

# termux-api backend apps (remind, don't fail)
command -v termux-battery-status >/dev/null || \
  echo "  -> install the Termux:API app for hardware access"

node -v; pkg list-installed 2>/dev/null | wc -l
