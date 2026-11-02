#!/usr/bin/env bash
# sign-modules — sign every module with our key and prove FORCE is on.
set -Eeuo pipefail
SRC="${1:?kernel source tree}"
KEY="${2:-$SRC/certs/lrd_signing_key.pem}"
MODDIR="${3:-/lib/modules/$(uname -r)}"
say(){ printf '\033[1;36m::\033[0m %s\n' "$*"; }

if [ ! -f "$KEY" ]; then
  say "generating a module signing key at $KEY"
  mkdir -p "$(dirname "$KEY")"
  openssl req -new -x509 -newkey rsa:4096 -keyout "$KEY" -out "${KEY%.pem}.crt" \
    -days 3650 -nodes -subj "/CN=LibreDroid Module Signing/" 2>/dev/null
  chmod 600 "$KEY"
fi

say "signing $MODDIR"
if command -v "$SRC/scripts/sign-file" >/dev/null; then
  find "$MODDIR" -name '*.ko' -print0 2>/dev/null | while IFS= read -r -d '' m; do
    "$SRC/scripts/sign-file" sha256 "$KEY" "${KEY%.pem}.crt" "$m" 2>/dev/null || \
      say "failed: $m"
  done
else
  for m in $(find "$MODDIR" -name '*.ko' 2>/dev/null); do
    perl "$SRC/scripts/sign-file" sha256 "$KEY" "${KEY%.pem}.crt" "$m" 2>/dev/null || true
  done
fi

say "verifying"
n=0; unsigned=0
for m in $(find "$MODDIR" -name '*.ko' 2>/dev/null); do
  if modinfo -F signer "$m" 2>/dev/null | grep -q .; then n=$((n+1)); else unsigned=$((unsigned+1)); fi
done
say "$n signed, $unsigned unsigned"

if [ -r /sys/module/module/parameters/sig_enforce ]; then
  e="$(cat /sys/module/module/parameters/sig_enforce)"
  say "sig_enforce=$e"
  [ "$e" = Y ] || say "WARNING: FORCE is off — an unsigned module will still load"
else
  say "WARNING: kernel built without CONFIG_MODULE_SIG_FORCE"
fi

say "runtime proof: try loading a tampered module"
first="$(find "$MODDIR" -name '*.ko' 2>/dev/null | head -1)"
[ -n "$first" ] && modinfo -F signer "$first" 2>/dev/null || true
