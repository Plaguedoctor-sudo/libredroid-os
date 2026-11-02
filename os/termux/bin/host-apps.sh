#!/data/data/com.termux/files/usr/bin/bash
# host-apps — list / launch / share between LibreDroid and the host Android.
set -uo pipefail
. "$HOME/.lrd/etc/lrd.env"
cmd="${1:-list}"; shift || true

case "$cmd" in
  list)
    pm list packages -3 -f | while IFS='=' read -r p pkg; do
      apk="${p#package:}"
      printf '%s\t%s\n' "$pkg" "$apk"
    done
    ;;
  launch)  # host-apps launch <pkg>
    pkg="${1:?pkg}"
    comp=$(cmd package resolve-activity --brief -c android.intent.category.LAUNCHER "$pkg" 2>/dev/null | tail -1)
    if [ -n "$comp" ]; then am start -n "$comp" -f 0x10200000 >/dev/null
    else monkey -p "$pkg" -c android.intent.category.LAUNCHER 1 >/dev/null; fi
    echo "launched $pkg"
    ;;
  share)   # host-apps share <file> [mime]
    f="${1:?file}"; mime="${2:-*/*}"
    termux-open --content-type "$mime" "$f"
    ;;
  open-url) termux-open-url "${1:?url}" ;;
  pick)    # host-apps pick — copy a host file into the shell's file root
    # Android's SAF picker: use termux-open? simplest is the /sdcard mirror
    ls -la "$HOME/storage/shared" | head -40
    ;;
  intent)  # host-apps intent <action> [data]
    am start -a "${1:?action}" ${2:+-d "$2"} >/dev/null && echo "sent $1"
    ;;
  *) echo "usage: host-apps {list|launch <pkg>|share <file> [mime]|open-url <url>|intent <action> [data]}";;
esac
