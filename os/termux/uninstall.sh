#!/data/data/com.termux/files/usr/bin/bash
set -uo pipefail
PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"
echo ":: stopping"
for s in lrd tor watchdog backup; do sv down "$s" 2>/dev/null; sv-disable "$s" 2>/dev/null; done
pkill -f "$HOME/.lrd/app/server.js" 2>/dev/null || true
pkill -f 'websockify' 2>/dev/null || true
vncserver -kill :1 2>/dev/null || true
echo ":: removing services"
for s in lrd tor watchdog backup; do rm -rf "$PREFIX/var/service/$s"; done
echo ":: removing cli"
for n in lrd-termux-doctor lrd-recover lrd-backup lrd-fullscreen lrd-update lrd-termux-up; do
  rm -f "$PREFIX/bin/$n"; done
echo ":: removing ~/.lrd"
rm -rf "$HOME/.lrd"
rm -f "$HOME/.termux/boot/00-lrd.sh"
echo ":: unmounting vault"
umount "$HOME/.lrd/domains/vault-mnt" 2>/dev/null || true
if [ "${1:-}" = "--purge-shared" ]; then
  echo ":: purging ~/storage/shared/LibreDroid"; rm -rf "$HOME/storage/shared/LibreDroid"
else
  echo ":: kept ~/storage/shared/LibreDroid (backups + files)"
fi
echo ":: done. proot-distro roots remain: proot-distro remove debian / alpine to drop them"
