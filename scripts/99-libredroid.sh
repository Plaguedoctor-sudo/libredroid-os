#!/system/bin/sh
set -e
# LibreDroid OS Auto-Boot & Kiosk Service for OnePlus Pad Go
exec >> /data/lrd_boot.log 2>&1
echo "[lrd] ==============================================="
echo "[lrd] Starting LibreDroid auto-boot at $(date)..."

# 1. Wait for Android boot completed
while [ "$(getprop sys.boot_completed)" != "1" ]; do
  sleep 2
done
echo "[lrd] Android boot completed. Waiting for storage mount..."

# 2. Wait up to 60s for MicroSD storage mount
ROOTFS=""
for i in $(seq 1 30); do
  if [ -f "/storage/3465-3632/libredroid/system_a.img" ]; then
    ROOTFS="/storage/3465-3632/libredroid/system_a.img"
    break
  fi
  ROOTFS="$(find /storage /mnt/media_rw -name system_a.img 2>/dev/null | head -1)"
  if [ -n "$ROOTFS" ] && [ -f "$ROOTFS" ]; then
    break
  fi
  sleep 2
done

if [ -z "$ROOTFS" ] || [ ! -f "$ROOTFS" ]; then
  echo "[lrd] ERROR: system_a.img not found on storage after 60s."
  exit 1
fi

echo "[lrd] Found LibreDroid rootfs at: $ROOTFS"

# 3. Mount rootfs and kernel filesystems
mkdir -p /data/lrd_root
mountpoint -q /data/lrd_root || mount -o rw "$ROOTFS" /data/lrd_root
mount -t proc proc /data/lrd_root/proc 2>/dev/null || true
mount -t sysfs sys /data/lrd_root/sys 2>/dev/null || true
mount -o bind /dev /data/lrd_root/dev 2>/dev/null || true
mkdir -p /data/lrd_root/dev/pts
mount -t devpts devpts /data/lrd_root/dev/pts 2>/dev/null || true
mount -o bind /vendor /data/lrd_root/vendor 2>/dev/null || true
mount -o bind /odm /data/lrd_root/odm 2>/dev/null || true
mount -o bind /vendor_dlkm /data/lrd_root/vendor_dlkm 2>/dev/null || true

# 4. Configure DNS
mkdir -p /data/lrd_root/etc /data/lrd_root/var/log
echo "nameserver 8.8.8.8" > /data/lrd_root/etc/resolv.conf
echo "nameserver 1.1.1.1" >> /data/lrd_root/etc/resolv.conf

# 5. Start LibreDroid Dropbear SSH server on port 2222
chroot /data/lrd_root /bin/busybox sh -c "
  export PATH=/bin:/sbin:/usr/bin:/usr/sbin
  killall dropbear 2>/dev/null || true
  dropbear -p 2222 -R
"
echo "[lrd] Dropbear SSH daemon active on port 2222."

# 6. Start LibreDroid Node.js server on port 3001
killall node 2>/dev/null || true
chroot /data/lrd_root /usr/bin/env -i HOME=/root PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin LRD_BIND=0.0.0.0 LRD_STRICT_LOCAL=0 /usr/bin/node /opt/libredroid/server.js >> /data/lrd_root/var/log/libredroid.log 2>&1 &
echo "[lrd] LibreDroid UI server initiated in background on port 3001."

# 7. Wait for user unlocked and launch Kiosk UI
(
  for i in $(seq 1 45); do
    if dumpsys user 2>/dev/null | grep -q "RUNNING_UNLOCKED"; then
      sleep 2
      am start -n com.android.chrome/com.google.android.apps.chrome.Main -d "http://127.0.0.1:3001/?kiosk=1" 2>/dev/null || \
      am start -a android.intent.action.VIEW -d "http://127.0.0.1:3001/?kiosk=1" 2>/dev/null || true
      echo "[lrd] Kiosk UI launched on display."
      exit 0
    fi
    sleep 2
  done
) &

echo "[lrd] LibreDroid OS boot sequence completed successfully!"
