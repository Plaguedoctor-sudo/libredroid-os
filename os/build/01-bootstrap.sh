#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
set -euo pipefail
SNAP="${SNAP:-20251101T000000Z}"
ARCH=amd64
SUITE=trixie
ROOT="${ROOT:-out/rootfs}"
MIRROR="http://snapshot.debian.org/archive/debian/${SNAP}/"
SEC="${SEC:-http://snapshot.debian.org/archive/debian-security/${SNAP}/}"

command -v mmdebstrap >/dev/null || { echo "apt install mmdebstrap uidmap"; exit 1; }

# Unmount any stale mounts from previous runs before deleting
if [ -d "$ROOT" ]; then
  for m in "$ROOT"/dev/pts "$ROOT"/dev/shm "$ROOT"/dev/mqueue "$ROOT"/dev/hugepages "$ROOT"/dev "$ROOT"/proc "$ROOT"/sys; do
    umount -l "$m" 2>/dev/null || true
  done
fi

rm -rf "$ROOT" 2>/dev/null || {
  # In unprivileged user namespace mode, handle rootfs recreate cleanly
  mv "$ROOT" "${ROOT}.bak.$$" 2>/dev/null || rm -rf "$ROOT"
}
mkdir -p "$ROOT"

INCLUDE=$(tr '\n' ',' < os/build/package-lists/libredroid.list.chroot \
          | sed 's/,$//')

KEYRING="/usr/share/keyrings/debian-archive-keyring.gpg"
if [ ! -f "$KEYRING" ]; then
  for k in "$HOME/.local/share/keyrings/debian-archive-keyring.gpg" "/usr/share/keyrings/debian-archive-keyring.gpg"; do
    if [ -f "$k" ]; then
      KEYRING="$k"
      break
    fi
  done
fi

# Debian snapshot security repository format for trixie
if [[ "$SEC" == deb* ]]; then
  SEC_ARG="$SEC"
elif [ -n "$SEC" ]; then
  SEC_ARG="deb $SEC trixie-security main contrib non-free-firmware"
else
  SEC_ARG=""
fi

if [ -n "$SEC_ARG" ]; then
  mmdebstrap \
    --mode="${MODE:-unshare}" \
    --arch="$ARCH" \
    --variant=minbase \
    --components="main,contrib,non-free-firmware" \
    --include="$INCLUDE,firmware-iwlwifi,firmware-realtek,intel-microcode,amd64-microcode" \
    --aptopt='Acquire::Check-Valid-Until "false"' \
    --aptopt='APT::Install-Recommends "false"' \
    --aptopt='APT::Install-Suggests "false"' \
    --hook-dir os/build/hooks \
    --keyring="$KEYRING" \
    "$SUITE" "$ROOT" "$MIRROR" "$SEC_ARG"
else
  mmdebstrap \
    --mode="${MODE:-unshare}" \
    --arch="$ARCH" \
    --variant=minbase \
    --components="main,contrib,non-free-firmware" \
    --include="$INCLUDE,firmware-iwlwifi,firmware-realtek,intel-microcode,amd64-microcode" \
    --aptopt='Acquire::Check-Valid-Until "false"' \
    --aptopt='APT::Install-Recommends "false"' \
    --aptopt='APT::Install-Suggests "false"' \
    --hook-dir os/build/hooks \
    --keyring="$KEYRING" \
    "$SUITE" "$ROOT" "$MIRROR"
fi

# Ensure /boot/vmlinuz exists if kernel installed as vmlinuz-<version>
if [ ! -e "$ROOT/boot/vmlinuz" ]; then
  for k in "$ROOT"/boot/vmlinuz-*; do
    if [ -f "$k" ]; then
      ln -sf "$(basename "$k")" "$ROOT/boot/vmlinuz"
      break
    fi
  done
fi

# sanity: the things that were missing
for p in bin/sh lib/x86_64-linux-gnu/libc.so.6 sbin/init usr/bin/node \
         usr/bin/cage usr/bin/chromium boot/vmlinuz; do
  [ -e "$ROOT/$p" ] || { echo "MISSING $p"; exit 1; }
done
echo "bootstrap ok: $(du -sh "$ROOT" | cut -f1)"
