#!/data/data/com.termux/files/usr/bin/bash
# LibreDroid I1 installer. Idempotent. Never touches anything outside Termux + /sdcard.
set -Eeuo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"
LRD="$HOME/.lrd"
SHARED="$HOME/storage/shared/LibreDroid"

say()  { printf '\033[1;36m::\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

# ---------- 0. preflight ----------
[ -n "${TERMUX_VERSION:-}" ] || warn "TERMUX_VERSION unset — am I really inside Termux?"
[ -d "$PREFIX" ] || die "no \$PREFIX ($PREFIX) — not Termux"
case "$(uname -m)" in
  aarch64|arm64) ARCH=arm64-v8a ;;
  x86_64)        ARCH=x86_64 ;;
  armv7l|arm)    ARCH=armeabi-v7a ;;
  *) die "unsupported arch $(uname -m)" ;;
esac
say "arch $ARCH  sdk $(getprop ro.build.version.sdk 2>/dev/null || echo ?)  abi $(getprop ro.product.cpu.abilist 2>/dev/null || echo ?)"

avail=$(df -Pk "$HOME" | awk 'NR==2{print $4}')
[ "${avail:-0}" -gt 2000000 ] || warn "only $((avail/1024)) MB free in \$HOME — models want ~2 GB"

# ---------- 1. packages ----------
say "installing packages"
bash "$HERE/bootstrap/00-packages.sh"

# ---------- 2. storage ----------
mkdir -p "$SHARED"/{files,backups,inbox,updates}
if [ ! -d "$HOME/storage/shared" ]; then
  warn "no ~/storage/shared — run 'termux-setup-storage' and grant, then re-run"
  termux-setup-storage || true
fi

# ---------- 3. layout ----------
say "creating $LRD"
mkdir -p "$LRD"/{app,etc,state/{icons,queue},models,domains,log,bin}
install -m600 "$HERE/etc/lrd.env" "$LRD/etc/lrd.env"
install -m644 "$HERE/etc/manifest.webmanifest" "$LRD/app/manifest.webmanifest" 2>/dev/null || true

# ---------- 4. deploy shell + bridge ----------
bash "$HERE/bootstrap/10-deploy.sh"

# ---------- 5. cli ----------
for f in "$HERE"/bin/*; do [ -f "$f" ] && install -m755 "$f" "$LRD/bin/$(basename "$f")"; done
ln -sf "$LRD/bin/lrd-termux-doctor.sh" "$PREFIX/bin/lrd-termux-doctor" 2>/dev/null || true
ln -sf "$LRD/bin/lrd-emit" "$PREFIX/bin/lrd-emit" 2>/dev/null || true
ln -sf "$LRD/bin/lrd-device-probe.sh" "$PREFIX/bin/lrd-device-probe" 2>/dev/null || true
for n in lrd-recover lrd-backup lrd-fullscreen lrd-update lrd-termux-up lrd-persona; do
  [ -e "$LRD/bin/$n.sh" ] && ln -sf "$LRD/bin/$n.sh" "$PREFIX/bin/$n"
done

# ---------- 6. services ----------
if [ -d "$PREFIX/var/service" ]; then
  say "installing runit services"
  for s in lrd tor watchdog backup events; do
    [ -d "$HERE/sv/$s" ] || continue
    rm -rf "$PREFIX/var/service/$s"
    cp -a "$HERE/sv/$s" "$PREFIX/var/service/$s"
    chmod 755 "$PREFIX/var/service/$s/run"
    [ -e "$PREFIX/var/service/$s/finish" ] && chmod 755 "$PREFIX/var/service/$s/finish"
  done
  command -v sv-enable >/dev/null && { sv-enable lrd; sv-enable watchdog; sv-enable tor; sv-enable backup; sv-enable events; } || true
  command -v service-daemon >/dev/null && service-daemon start >/dev/null 2>&1 || true
else
  warn "termux-services missing — services not installed, will run once"
fi

# ---------- 7. boot hook ----------
mkdir -p "$HOME/.termux/boot"
install -m755 "$HERE/boot/lrd-boot.sh" "$HOME/.termux/boot/00-lrd.sh"

# ---------- 8. safeguards ----------
bash "$HERE/safeguards/apply.sh"

# ---------- 9. domains ----------
bash "$HERE/bootstrap/30-domains.sh" || warn "domain setup incomplete (non-fatal)"

# ---------- 10. models (enforce zero-weight sovereign engine, purge large models) ----------
rm -rf "$LRD/models" 2>/dev/null || true

# ---------- 11. first boot ----------
say "starting"
sv up lrd 2>/dev/null || ( setsid node "$LRD/app/server.js" >"$LRD/log/server.log" 2>&1 & )
sleep 2
if curl -fsS "http://127.0.0.1:3001/healthz" >/dev/null 2>&1; then
  say "server up on http://127.0.0.1:3001"
else
  warn "server not answering yet — check $LRD/log/server.log"
fi
say "done. run: lrd-termux-doctor"
