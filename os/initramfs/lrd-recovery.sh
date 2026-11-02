#!/bin/busybox sh
# lrd-recovery — the tools available when nothing else boots.
export PATH=/bin:/sbin
echo
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  LibreDroid recovery — initramfs shell   ║"
echo "  ╚══════════════════════════════════════════╝"
echo
echo "  store:   $(mountpoint -q /lrdstore && echo mounted || echo 'not mounted')"
echo "  slots:   $(ls -1 /lrdstore/lrd-rootfs_*.raw 2>/dev/null | tr '\n' ' ')"
echo "  cmdline: $(cat /proc/cmdline)"
echo
echo "  commands:"
echo "    r-boot <a|b>      boot a slot (adds FORCE flag, continues)"
echo "    r-once <a|b>      boot a slot once"
echo "    r-recover         restore the newest snapshot into the overlay"
echo "    r-reset           wipe the overlay (factory reset, keeps files)"
echo "    r-conf            edit the adaptation confs in the inactive rootfs"
echo "    r-fsck            check the store filesystem"
echo "    r-status          full state dump"
echo "    r-shell           mount the rootfs read-only at /mnt and give a shell"
echo
cat > /bin/r-status <<'EOS'
#!/bin/sh
echo "== partitions =="; ls -l /dev/block/by-name 2>/dev/null | head -40
echo "== store =="; ls -la /lrdstore 2>/dev/null
echo "== mounts =="; mount
echo "== cmdline =="; cat /proc/cmdline
echo "== thermal =="; for z in /sys/class/thermal/thermal_zone*; do echo "$(cat $z/type): $(cat $z/temp)"; done 2>/dev/null
EOS
cat > /bin/r-boot <<'EOS'
#!/bin/sh
[ -n "$1" ] || { echo "usage: r-boot <a|b>"; exit 2; }
[ -f "/lrdstore/lrd-rootfs_$1.raw" ] || { echo "no rootfs for slot $1"; exit 1; }
echo "booting slot $1"
exec switch_root /newroot /sbin/init
EOS
cat > /bin/r-once <<'EOS'
#!/bin/sh
[ -n "$1" ] || { echo "usage: r-once <a|b>"; exit 2; }
touch "/lrdstore/ONCE_$1"
echo "next boot: slot $1 only"
EOS
cat > /bin/r-reset <<'EOS'
#!/bin/sh
echo "wiping the overlay — user data in /home and /var/lib/lrd is lost"
for s in a b; do
  img="/lrdstore/lrd-overlay_$s.img"
  [ -f "$img" ] && { mkfs.ext4 -q -F "$img"; echo "reset $img"; }
done
EOS
cat > /bin/r-recover <<'EOS'
#!/bin/sh
latest="$(ls -1t /lrdstore/snapshots/*.tar.zst 2>/dev/null | head -1)"
[ -n "$latest" ] || { echo "no snapshots in /lrdstore/snapshots"; exit 1; }
echo "restoring $latest into the overlay"
for s in a b; do
  img="/lrdstore/lrd-overlay_$s.img"
  [ -f "$img" ] || continue
  mkdir -p /ov && mount -o loop "$img" /ov
  tar -I zstd -xf "$latest" -C /ov --strip-components=1 2>/dev/null || tar -xf "$latest" -C /ov
  umount /ov
done
EOS
cat > /bin/r-fsck <<'EOS'
#!/bin/sh
for d in $(blkid -L LRDSTORE); do e2fsck -fy "$d"; done
EOS
cat > /bin/r-shell <<'EOS'
#!/bin/sh
img="$(ls -1 /lrdstore/lrd-rootfs_*.raw 2>/dev/null | head -1)"
[ -n "$img" ] || { echo "no rootfs"; exit 1; }
mkdir -p /mnt; mount -o ro,loop "$img" /mnt || exit 1
echo "rootfs at /mnt — type 'exit' when done"
sh
umount /mnt
EOS
chmod +x /bin/r-*
exec sh
