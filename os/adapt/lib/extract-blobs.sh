#!/usr/bin/env bash
# Pull the vendor payload the rootfs needs. Uses root when available, adb pull otherwise.
set -Eeuo pipefail
if [ ! -w "${HOME:-}" ] || [ -z "${HOME:-}" ]; then
  export HOME=/tmp
  export ANDROID_USER_HOME=/tmp/.android
fi
OUT="${1:?out dir}"
D="$OUT/rootfs-overlay"
mkdir -p "$D"/{usr/lib/lrd/blobs,lib/firmware,lib/modules,etc/lrd}

A(){ adb shell "$@" 2>/dev/null | tr -d '\r'; }
ROOT=""; A 'su -c id' | grep -q uid=0 && ROOT="su -c"

pull() { # src dst
  local src="$1" dst="$2"
  [ -e "$dst" ] && return
  if [ -n "$ROOT" ]; then
    adb shell "$ROOT 'tar -C / -cf - ${src#/}'" > /tmp/lrd-blob.tar 2>/dev/null || return
    tar -C "$dst" -xf /tmp/lrd-blob.tar 2>/dev/null || true
  else
    adb pull "$src" "$dst" >/dev/null 2>&1 || true
  fi
}

say(){ printf '  %s\n' "$*"; }

# --- HAL blobs: only the ones libhybris actually drives ---
say "HAL blobs"
for pat in hwcomposer gralloc libEGL libGLESv2 libGLESv1_CM audio.primary audio.a2dp \
           sensors lights power vibrator memtrack; do
  for dir in /vendor/lib64/hw /vendor/lib/hw /vendor/lib64 /vendor/lib; do
    f="$(A "ls $dir 2>/dev/null" | grep -iE "^${pat}" | head -1 || true)"
    [ -n "$f" ] || continue
    case "$f" in *.so) ;; *) continue ;; esac
    mkdir -p "$D$dir"
    adb pull "$dir/$f" "$D$dir/$f" >/dev/null 2>&1 && say "$dir/$f"
  done
done

# egl subtree (mali/adreno/freedreno all live here)
for dir in /vendor/lib64/egl /vendor/lib/egl /odm/lib64/egl; do
  A "ls $dir 2>/dev/null" | grep -q . || continue
  mkdir -p "$D$dir"
  adb pull "$dir/." "$D$dir/" >/dev/null 2>&1 && say "$dir (egl)"
done

# --- kernel modules: required, without them wifi/touch/panel die ---
say "kernel modules"
kver="$(A uname -r)"
mkdir -p "$D/lib/modules/$kver"
if [ -n "$ROOT" ]; then
  adb shell "$ROOT 'tar -C /vendor/lib/modules -cf - .'" > /tmp/lrd-mod.tar 2>/dev/null || true
  tar -C "$D/lib/modules/$kver" -xf /tmp/lrd-mod.tar 2>/dev/null || true
else
  adb pull /vendor/lib/modules/. "$D/lib/modules/$kver/" >/dev/null 2>&1 || true
fi
mods=$(find "$D/lib/modules/$kver" -name '*.ko' 2>/dev/null | wc -l)
say "$mods modules"

# --- firmware ---
say "firmware"
mkdir -p "$D/lib/firmware"
for src in /vendor/firmware /odm/firmware /vendor/etc/firmware; do
  A "ls $src 2>/dev/null" | grep -q . || continue
  adb pull "$src/." "$D/lib/firmware/" >/dev/null 2>&1 && say "$src"
done
fw=$(find "$D/lib/firmware" -type f 2>/dev/null | wc -l)
say "$fw firmware files"

# --- HAL service binaries (binderised HALs need these) ---
say "HAL binaries"
for b in vendor/bin/hw; do
  A "ls /$b 2>/dev/null" | grep -q . || continue
  mkdir -p "$D/$b"
  adb pull "/$b/." "$D/$b/" >/dev/null 2>&1 && say "/$b"
done

# --- a copy of the DTB, for cmdline and panel timings ---
say "dtb"
mkdir -p "$D/usr/lib/lrd/dtb"
if [ -n "$ROOT" ]; then
  adb shell "$ROOT 'cat /sys/firmware/fdt'" > "$D/usr/lib/lrd/dtb/device.dtb" 2>/dev/null || true
else
  A 'ls /sys/firmware/fdt' | grep -q . && adb shell 'cat /sys/firmware/fdt' > "$D/usr/lib/lrd/dtb/device.dtb" 2>/dev/null || true
fi
[ -s "$D/usr/lib/lrd/dtb/device.dtb" ] && say "$(stat -c %s "$D/usr/lib/lrd/dtb/device.dtb") bytes" || echo "  warning: no DTB (fine — the vendor boot image carries it)"

# --- sizes ---
say "overlay size: $(du -sh "$D" | cut -f1)"
[ "$(du -sm "$D" | cut -f1)" -gt 700 ] && echo "  note: >700MB — rootfs image must account for this"
exit 0
