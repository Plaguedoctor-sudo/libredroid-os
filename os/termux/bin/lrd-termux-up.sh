#!/data/data/com.termux/files/usr/bin/bash
# lrd-termux-up — bring up the app-level "domains". Idempotent.
set -Eeuo pipefail
. "$HOME/.lrd/etc/lrd.env"

say(){ printf '\033[1;36m::\033[0m %s\n' "$*"; }

# ---- tor-gw (the only egress path that matters) ----
say "tor"
sv up tor 2>/dev/null || true
sleep 3
for i in $(seq 1 30); do
  (echo > /dev/tcp/127.0.0.1/9050) 2>/dev/null && break; sleep 1
done
echo > /dev/tcp/127.0.0.1/9050 2>/dev/null && say "tor SOCKS 9050 up" || { echo "xx tor never opened 9050"; exit 1; }

# ---- domain roots ----
mkdir -p "$LRD_DOMAINS"
setup_domain() {  # name distro
  local n="$1" d="$2" root="$LRD_DOMAINS/$1"
  if [ ! -d "$root" ]; then
    say "installing domain $n ($d)"
    proot-distro install --override-alias "lrd-$n" "$d" >/dev/null 2>&1 || \
      proot-distro install "$d" >/dev/null
    root="$(proot-distro login "$d" -- true >/dev/null 2>&1; echo "$PREFIX/var/lib/proot-distro/installed-rootfs/$d")"
    [ -d "$root" ] && ln -sfn "$root" "$LRD_DOMAINS/$n"
  fi
  # per-domain env: everything through tor
  local etc="$root/etc/profile.d/99-lrd.sh"
  [ -d "$root" ] && cat > "$etc" <<EOF
export all_proxy=socks5h://$LRD_TOR_SOCKS
export ALL_PROXY=socks5h://$LRD_TOR_SOCKS
export http_proxy=http://$LRD_TOR_HTTP https_proxy=http://$LRD_TOR_HTTP
export no_proxy=127.0.0.1,localhost
export LRD_DOMAIN=$n
EOF
  say "domain $n ready"
}
setup_domain work  debian
setup_domain dispos alpine

# ---- dispos is ephemeral: wipe its overlay on each start ----
if [ "${1:-}" = "--reset-dispos" ] || [ ! -f "$LRD_DOMAINS/dispos/.clean" ]; then
  say "dispos: wiping state"
  rd="$LRD_DOMAINS/dispos"
  [ -d "$rd" ] && rm -rf "$rd"/root/.bash_history "$rd"/tmp/* "$rd"/var/log/* "$rd"/root/.cache 2>/dev/null || true
  touch "$rd/.clean" 2>/dev/null || true
fi

# ---- vault: gocryptfs-backed ----
if [ ! -f "$LRD_VAULT_IMG" ]; then
  say "creating vault image (1 GiB)"
  head -c 1G /dev/zero > "$LRD_VAULT_IMG"
  mkfs.ext4 -q -F "$LRD_VAULT_IMG"
fi
mkdir -p "$LRD_DOMAINS/vault-mnt"
if ! mountpoint -q "$LRD_DOMAINS/vault-mnt" 2>/dev/null; then
  passfile="$LRD_STATE/vault.key"
  if [ -f "$passfile" ]; then
    gocryptfs -q -passfile "$passfile" -extpass "cat $passfile" \
      "$LRD_DOMAINS/vault-mnt" 2>/dev/null || say "vault needs manual unlock (lrd-vault-unlock)"
  fi
fi

# ---- streamed surface (one X display for streamed domains) ----
if ! pgrep -f 'Xvnc.*:1' >/dev/null 2>&1; then
  say "starting streamed surface on :1"
  vncserver :1 -geometry 1280x800 -depth 24 -localhost yes 2>/dev/null || true
  sleep 2
  if ! pgrep -f websockify >/dev/null 2>&1; then
    websockify --web "$PREFIX/share/novnc" 6080 127.0.0.1:5901 >/dev/null 2>&1 &
    say "noVNC on http://127.0.0.1:6080"
  fi
fi

say "domains up. attach: proot-distro login lrd-work / lrd-dispos"
