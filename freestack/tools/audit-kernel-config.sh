#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Fail on any in-kernel driver not listed in docs/DRIVER-POLICY.md.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CFG="${CFG:-/proc/config.gz}"
if [[ ! -e "$CFG" ]]; then
  if [[ -f "$FS_ROOT/.config" ]]; then
    CFG="$FS_ROOT/.config"
  elif [[ -f "/boot/config-$(uname -r)" ]]; then
    CFG="/boot/config-$(uname -r)"
  fi
fi

POLICY="${POLICY:-$FS_ROOT/docs/DRIVER-POLICY.md}"
[[ -f "$POLICY" ]] || { echo "no policy at $POLICY"; exit 1; }

fail=0
while read -r key; do
  sym="${key#CONFIG_}"
  sym="${sym%%=*}"
  sym="$(echo "$sym" | tr 'A-Z' 'a-z')"
  grep -qi -- "$sym" "$POLICY" || { echo "unlisted in-kernel driver: $key"; fail=1; }
done < <(zgrep -E '^CONFIG_.*=y' "$CFG" \
         | grep -E '_(HCD|WIFI|DRM|SND|BT|MMC|PCI|ACPI)' \
         | grep -vE 'CONFIG_(ACPI|PCI|SND|DRM|MMC)_[A-Z_]*=y$' || true)
exit "$fail"
