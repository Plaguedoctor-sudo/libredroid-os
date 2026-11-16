#!/bin/bash
# ==============================================================================
# arm-probe.sh — porting feasibility triage for an Android device.
# Read-only. Uses root only if already available.
#   ./arm-probe.sh [serial]
# ==============================================================================
set -uo pipefail

command -v adb >/dev/null || { echo "✗ adb not installed"; exit 1; }

SERIAL="${1:-$(adb devices | awk '$2=="device"{print $1; exit}')}"
[ -n "$SERIAL" ] || { echo "✗ no authorised device — enable USB debugging"; exit 1; }

S(){ adb -s "$SERIAL" shell "$@" 2>/dev/null | tr -d '\r'; }
G(){ S getprop "$1"; }
HAS_ROOT=0; S 'su -c true' >/dev/null 2>&1 && HAS_ROOT=1
R(){ [ "$HAS_ROOT" = 1 ] && adb -s "$SERIAL" shell "su -c \"$1\"" 2>/dev/null | tr -d '\r'; }

SCORE=0; MAX=0
add(){ MAX=$((MAX+$1)); [ "$3" = "1" ] && { SCORE=$((SCORE+$1)); printf '  ✓ %s = %s\n' "$2" "$4"; } \
                                            || printf '  ✗ %s = %s\n' "$2" "$4"; }

echo "═══════════════════════════════════════════════════════════════"
echo " LibreDroid ARM porting probe"
echo "═══════════════════════════════════════════════════════════════"

echo; echo "── identity ──────────────────────────────────────────────────"
BRAND=$(G ro.product.brand); MODEL=$(G ro.product.model)
DEV=$(G ro.product.device);  SOC=$(G ro.soc.model)
printf '  %s %s  (codename: %s)\n' "$BRAND" "$MODEL" "$DEV"
printf '  SoC: %s\n' "${SOC:-unknown}"
printf '  Android: %s (SDK %s)\n' "$(G ro.build.version.release)" "$(G ro.build.version.sdk)"
printf '  Root available: %s\n' "$([ "$HAS_ROOT" = 1 ] && echo yes || echo no)"

echo; echo "── scoring ───────────────────────────────────────────────────"

case "$SOC" in
  *SM8*|*SDM8*|*MSM8*|*Snapdragon*) add 4 "SoC family (Qualcomm)" 1 "$SOC" ;;
  *RK3*|*RK35*)                     add 4 "SoC family (Rockchip)" 1 "$SOC" ;;
  *Dimensity*|*MT6*|*MT8*)          add 1 "SoC family (MediaTek)" 0 "$SOC  ← hard mode" ;;
  *)                                add 1 "SoC family (other)"     0 "$SOC" ;;
esac

KV=$(S uname -r)
case "$KV" in
  6.*|5.1[0-9]*|5.2[0-9]*) add 2 "Kernel line" 1 "$KV" ;;
  *)                       add 2 "Kernel line" 0 "$KV  ← needs backporting" ;;
esac

CFG=$(S 'test -r /proc/config.gz && echo yes || echo no')
add 1 "/proc/config.gz readable" "$([ "$CFG" = yes ] && echo 1 || echo 0)" "$CFG"

FDT=$(R 'test -r /sys/firmware/fdt && echo yes || echo no')
add 3 "live DTB at /sys/firmware/fdt" "$([ "$FDT" = yes ] && echo 1 || echo 0)" "$FDT"

AB=$(G ro.boot.slot_suffix)
add 1 "A/B slot scheme" "$([ -n "$AB" ] && echo 1 || echo 0)" "${AB:-single-slot}"

SUPER=$(S 'ls /dev/block/by-name/ 2>/dev/null | grep -c "^super$"')
add 1 "dynamic partitions (super)" "$([ "${SUPER:-0}" -ge 1 ] && echo 1 || echo 0)" "$([ "${SUPER:-0}" -ge 1 ] && echo yes || echo no)"

PARTITIONS=$(S 'ls /dev/block/by-name/ 2>/dev/null | tr "\n" " "')
printf '  · partitions: %s\n' "${PARTITIONS:0:180}"

echo; echo "── hardware surface ──────────────────────────────────────────"
GPU=$(S 'dumpsys SurfaceFlinger 2>/dev/null | grep -m1 -i "GLES:"' | sed 's/.*GLES: //')
printf '  GPU renderer: %s\n' "${GPU:0:110}"
add 2 "GPU has a mainline driver path" \
    "$(echo "$GPU" | grep -qiE 'mali-g(5[12]|7[128]|310|510|610|710)|adreno.*(6[0-9]{2}|7[0-9]{2})' && echo 1 || echo 0)" \
    "${GPU:0:60}"

PANEL=$(S 'cat /sys/class/drm/card0-DSI-1/edid 2>/dev/null | head -c0; dumpsys display 2>/dev/null | grep -m1 -o "name=[^\"]*"' | head -n1)
printf '  panel hint: %s\n' "${PANEL:0:80}"

echo; echo "── modem / audio / camera ────────────────────────────────────"
printf '  modem:  %s\n' "$(S 'getprop | grep -m1 -o "gsm.version.baseband.*" | cut -d: -f2')"
printf '  audio:  %s\n' "$(S 'getprop ro.hardware.audio' || echo unknown)"
printf '  camera: %s\n' "$(S 'getprop ro.hardware.camera' || echo unknown)"

echo; echo "── is a port already done? ───────────────────────────────────"
PMDIR="${PMAPORTS:-$HOME/pmaports}"
if [ -d "$PMDIR/device" ]; then
  HIT=$(ls "$PMDIR/device" 2>/dev/null | grep -i "$DEV" | head -n3)
  if [ -n "$HIT" ]; then
    echo "  ✓ pmaports already has: $HIT"
    add 5 "existing pmaports device" 1 "$HIT"
  else
    echo "  ✗ no pmaports device matching '$DEV'"
    echo "    (clone https://gitlab.com/postmarketOS/pmaports and re-run to check)"
    add 5 "existing pmaports device" 0 "none"
  fi
else
  echo "  · set PMAPORTS=/path/to/pmaports to check"
fi

echo; echo "═══════════════════════════════════════════════════════════════"
PCT=$(( SCORE * 100 / MAX ))
printf ' FEASIBILITY: %d/%d  (%d%%)\n' "$SCORE" "$MAX" "$PCT"
echo "═══════════════════════════════════════════════════════════════"
if   [ "$PCT" -ge 75 ]; then echo " → port it. Mostly userspace work."
elif [ "$PCT" -ge 45 ]; then echo " → doable. Expect 1–3 months of kernel/DTS work."
elif [ "$PCT" -ge 25 ]; then echo " → hard. Try Droidian/Halium before mainline."
else                         echo " → don't port this. Buy a supported device."
fi
echo
echo "next: if /sys/firmware/fdt exists, pull it and decompile:"
echo "  adb shell su -c 'cat /sys/firmware/fdt' > devicetree.dtb"
echo "  dtc -I dtb -O dts devicetree.dtb > devicetree.dts"
echo "  # that .dts is your starting point for a mainline port"
