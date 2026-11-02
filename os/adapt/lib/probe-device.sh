#!/usr/bin/env bash
# Audit an attached device over adb. Emits JSON on stdout. Read-only.
set -uo pipefail

# In sandbox, ensure ADB uses writable HOME if HOME is read-only
if [ ! -w "${HOME:-}" ] || [ -z "${HOME:-}" ]; then
  export HOME=/tmp
fi

A() { adb shell "$@" 2>/dev/null | tr -d '\r'; }
P() { A getprop "$1"; }
has_root() { A 'su -c id' 2>/dev/null | grep -q 'uid=0'; }

model="$(P ro.product.model)"; vendor="$(P ro.product.manufacturer)"
device="$(P ro.product.device)"; platform="$(P ro.board.platform)"
hardware="$(P ro.hardware)"; soc="$(P ro.soc.model)"
slot="$(P ro.boot.slot_suffix)"; dyn="$(P ro.boot.dynamic_partitions)"
sdk="$(P ro.build.version.sdk)"; avb="$(P ro.boot.verifiedbootstate)"
locked="$(P ro.boot.flash.locked)"; kernel="$(A uname -r)"
abis="$(P ro.product.cpu.abilist)"

cfg() {
  local k="$1"
  local v
  v="$(A "zcat /proc/config.gz 2>/dev/null" | grep -E "^CONFIG_${k}=" | head -1 || true)"
  [ -n "$v" ] && { case "$v" in *=y|*=m) echo yes ;; *=n) echo no ;; esac; return; }
  A "ls -d /sys/module/${2:-$k} 2>/dev/null" | grep -q . && { echo yes; return; }
  echo unknown
}

nft_redirect="$(cfg NFT_REDIRECT nft_redirect)"
landlock="$(cfg SECURITY_LANDLOCK landlock)"
cgroup2="$(cfg CGROUP_V2)"
userns="$(cfg USER_NS)"
overlay="$(cfg OVERLAY_FS overlay)"
fuse="$(cfg FUSE_FS fuse)"
binder="$(cfg ANDROID_BINDER_IPC binder_linux)"

# display
drm="$(A 'ls /dev/dri 2>/dev/null' | paste -sd, -)"
drm_nodes="$(A 'ls /sys/class/drm 2>/dev/null' | grep -E '^card' | wc -l)"
fb="$(A 'ls /dev/graphics 2>/dev/null' | paste -sd, -)"
panel="$(A 'ls /sys/class/backlight 2>/dev/null' | paste -sd, -)"

# gpu / hal blobs
egl="$(A 'ls /vendor/lib64/egl 2>/dev/null' | paste -sd, -)"
hwc="$(A 'ls /vendor/lib64/hw 2>/dev/null' | grep -iE 'hwcomposer|gralloc' | paste -sd, -)"
gralloc="$(A 'ls /vendor/lib64/hw 2>/dev/null' | grep -i gralloc | head -1)"
audio_hal="$(A 'ls /vendor/lib64/hw 2>/dev/null' | grep -iE 'audio\..*\.so' | paste -sd, -)"
ril="$(A 'ls /vendor/lib64/ 2>/dev/null' | grep -iE 'libril|radio' | paste -sd, -)"
sensors_hal="$(A 'ls /vendor/lib64/hw 2>/dev/null' | grep -i sensors | paste -sd, -)"
camera_hal="$(A 'ls /vendor/lib64/hw 2>/dev/null' | grep -iE 'camera' | paste -sd, -)"

# partitions
by_name="$(A 'ls /dev/block/by-name 2>/dev/null' | paste -sd, -)"
logical="$(A 'ls /dev/block/mapper 2>/dev/null' | paste -sd, -)"

# input / radios
touch="$(A 'getevent -p 2>/dev/null' | grep -ci 'touch' || true)"
[ -z "$touch" ] || [ "$touch" -eq 0 ] 2>/dev/null && touch="$(A 'cat /proc/bus/input/devices 2>/dev/null' | grep -iE 'touchscreen|touchpad' | wc -l)"
wifi="$(A 'ls /sys/class/net 2>/dev/null' | grep -E '^(wlan|wifi)' | wc -l)"
modem="$(A 'ls /dev/ 2>/dev/null' | grep -E '^(ttyUSB|smd|qmi|rmnet)' | wc -l)"
modem_props="$(P gsm.version.baseband)"

# modules + firmware
modules_dir="$(A 'ls /vendor/lib/modules 2>/dev/null' | wc -l)"
firmware_dir="$(A 'ls /vendor/firmware 2>/dev/null' | wc -l)"

root=no; has_root && root=yes

cat <<EOF
{
  "probedAt": "$(date -Is)",
  "device": {
    "model": "$model", "vendor": "$vendor", "codename": "$device",
    "platform": "$platform", "hardware": "$hardware", "soc": "$soc",
    "sdk": ${sdk:-0}, "abis": "$abis", "kernel": "$kernel",
    "slot": "$slot", "dynamicPartitions": "$dyn",
    "verifiedBoot": "$avb", "bootloaderLocked": "$locked", "adbRoot": "$root"
  },
  "kernel": {
    "nft_redirect": "$nft_redirect", "landlock": "$landlock", "cgroup2": "$cgroup2",
    "userns": "$userns", "overlayfs": "$overlay", "fuse": "$fuse", "binder": "$binder"
  },
  "display": { "drm": "$drm", "drmNodes": ${drm_nodes:-0}, "fb": "$fb", "panel": "$panel" },
  "hal": {
    "egl": "$egl", "hwcomposer": "$hwc", "gralloc": "$gralloc",
    "audio": "$audio_hal", "ril": "$ril", "sensors": "$sensors_hal", "camera": "$camera_hal"
  },
  "partitions": { "byName": "$by_name", "logical": "$logical" },
  "io": { "touchDevices": ${touch:-0}, "wifiIfaces": ${wifi:-0}, "modemNodes": ${modem:-0}, "baseband": "$modem_props" },
  "payload": { "vendorModules": ${modules_dir:-0}, "vendorFirmware": ${firmware_dir:-0} }
}
EOF
