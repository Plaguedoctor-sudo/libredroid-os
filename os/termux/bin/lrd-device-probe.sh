#!/usr/bin/env bash
# lrd-device-probe — real sysfs/devicetree/systemd introspection. --json
set -uo pipefail
JSON=0; [ "${1:-}" = "--json" ] && JSON=1
J() { $JSON && printf '%s\n' "$1" || printf '%s\n' "$1" | jq -C . 2>/dev/null || printf '%s\n' "$1"; }
rd() { cat "$1" 2>/dev/null | tr -d '\0' | tr -d '\n'; }

model="$(rd /sys/firmware/devicetree/base/model)"; [ -z "$model" ] && model="$(rd /proc/device-tree/model)"
compat="$(tr '\0' '\n' </proc/device-tree/compatible 2>/dev/null | paste -sd, -)"
kernel="$(uname -r)"; host="$(uname -n)"

# boot chain
ab=0; slot=""
if [ -f /etc/lrd/slot ]; then slot="$(cat /etc/lrd/slot)"; ab=1; fi
verity=0; grep -q 'dm-verity' /proc/cmdline 2>/dev/null && verity=1

# kernel tier
netns=0; [ -x "$(command -v ip)" ] && netns=1
cgroup2=0; grep -q 'cgroup2' /proc/mounts && cgroup2=1
nft=0; command -v nft >/dev/null && nft list tables >/dev/null 2>&1 && nft=1
landlock=0; grep -q landlock /proc/version 2>/dev/null && landlock=1
sysupdate=0; command -v systemd-sysupdate >/dev/null && sysupdate=1
logind=0; [ -d /run/systemd/system ] && logind=1

# hardware
backlight=0; ls /sys/class/backlight/*/brightness >/dev/null 2>&1 && backlight=1
drm=0; ls /sys/class/drm/card*-* >/dev/null 2>&1 && drm=1
power_supply=0; ls /sys/class/power_supply/*/capacity >/dev/null 2>&1 && power_supply=1
thermal=0; ls /sys/class/thermal/thermal_zone* >/dev/null 2>&1 && thermal=1
cpufreq=0; [ -d /sys/devices/system/cpu/cpu0/cpufreq ] && cpufreq=1
haptics=0; ls /sys/class/leds/*vibrat* >/dev/null 2>&1 && haptics=1
pipewire=0; command -v pactl >/dev/null && pipewire=1
bluez=0; command -v bluetoothctl >/dev/null && bluez=1
nfc=0; ls /sys/class/nfc/* >/dev/null 2>&1 && nfc=1

# nft REDIRECT — the load-bearing one
redirect=0
if [ "$nft" = 1 ]; then nft list ruleset 2>/dev/null | grep -qi 'redirect' && redirect=1; fi

J "$(cat <<EOF
{
  "model": "$model",
  "compatible": "$compat",
  "kernel": "$kernel",
  "hostname": "$host",
  "slot": "$slot",
  "ab": $ab,
  "verity": $verity,
  "tier": {
    "netns": $netns, "cgroup2": $cgroup2, "nft": $nft, "nft_redirect": $redirect,
    "landlock": $landlock, "sysupdate": $sysupdate, "logind": $logind
  },
  "hw": {
    "backlight": $backlight, "drm": $drm, "power_supply": $power_supply,
    "thermal": $thermal, "cpufreq": $cpufreq, "haptics": $haptics,
    "pipewire": $pipewire, "bluez": $bluez, "nfc": $nfc
  },
  "external": $(ls /sys/class/drm/card*-HDMI* 2>/dev/null | while read -r d; do
      printf '{"name":"%s","connected":%s},' "$(basename "$d")" "$([ "$(rd "$d/status")" = connected ] && echo true || echo false)"; done | sed 's/,$//' | sed 's/^/[/;s/$/]/'),
  "thermal_zones": $(for z in /sys/class/thermal/thermal_zone*; do
      [ -e "$z" ] || continue
      t=$(rd "$z/temp"); n=$(rd "$z/type")
      [ -n "$t" ] && printf '{"name":"%s","c":%s},' "$n" "$(awk -v t="$t" 'BEGIN{print (t>1000?t/1000:t)}')"
    done | sed 's/,$//' | sed 's/^/[/;s/$/]/')
}
EOF
)"
