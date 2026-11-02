#!/usr/bin/env bash
# lrd-harden.service helper
set -Eeuo pipefail
say(){ printf '\033[1;36m::\033[0m %s\n' "$*"; }
BASE=/etc/systemd/system/lrd-harden.conf
[ -f "$BASE" ] || BASE=/usr/lib/lrd/security/10-lrd-harden.conf
n=0
for u in /etc/systemd/system/lrd-*.service; do
  [ -f "$u" ] || continue
  # skip the ones that must write the filesystem or load modules
  case "$(basename "$u")" in
    lrd-adapt-apply.service|lrd-adapt-late.service|lrd-props.service) continue ;;
  esac
  d="$u.d"; mkdir -p "$d"
  [ -f "$BASE" ] && cp -f "$BASE" "$d/10-lrd-harden.conf"
  n=$((n+1))
done
systemctl daemon-reload 2>/dev/null || true
say "hardened $n units"
systemd-analyze security --no-pager 2>/dev/null | grep -E 'lrd-|cage' | head -20 || true
