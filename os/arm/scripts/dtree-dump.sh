#!/bin/bash
# Dump the live device tree from an Android device, root or not.
#   dtree-dump.sh [serial] [outdir]
set -euo pipefail

SERIAL="${1:-$(adb devices | awk '$2=="device"{print $1; exit}')}"
OUT="${2:-./dtree}"
[ -n "$SERIAL" ] || { echo "✗ no device"; exit 1; }

mkdir -p "$OUT"
echo "→ probing for a raw FDT (needs root)…"

if adb -s "$SERIAL" shell 'su -c "test -r /sys/firmware/fdt"' >/dev/null 2>&1; then
  adb -s "$SERIAL" exec-out su -c 'cat /sys/firmware/fdt' > "$OUT/fdt.dtb" 2>/dev/null || true
  if [ -s "$OUT/fdt.dtb" ]; then
    echo "  ✓ raw FDT: $(stat -c%s "$OUT/fdt.dtb") bytes"
    command -v dtc >/dev/null && dtc -I dtb -O dts "$OUT/fdt.dtb" > "$OUT/device.dts" 2>/dev/null \
      && echo "  ✓ decompiled to device.dts"
    exit 0
  fi
fi

echo "→ no root — falling back to /proc/device-tree over toybox tar"
rm -rf "$OUT/tree"; mkdir -p "$OUT/tree"
if adb -s "$SERIAL" exec-out 'tar -cf - -C /proc/device-tree .' 2>/dev/null | tar -xf - -C "$OUT/tree"; then
  N=$(find "$OUT/tree" -type f | wc -l)
  echo "  ✓ ${N} nodes/files extracted"
  command -v python3 >/dev/null || { echo "  ! python3 needed to rebuild the DTS"; exit 0; }
  python3 "$(dirname "$0")/dtree-to-dts.py" "$OUT/tree" > "$OUT/device.dts"
  echo "  ✓ reconstructed $(grep -c '^\s*[a-z].*{' "$OUT/device.dts" 2>/dev/null || echo '?') nodes into device.dts"
else
  echo "✗ both paths failed"; exit 1
fi
