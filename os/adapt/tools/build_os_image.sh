#!/usr/bin/env bash
# build_os_image.sh — Generates the complete LibreDroid OS rootfs and data images
# Produces:
#   1. system_b.img (ext4, labeled LRDROOT)
#   2. lrddata_b.img (ext4, labeled LRDDATA for persistent /overlay)
set -Eeuo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
TOP="$(cd "$HERE/../../.." && pwd)"
OUT_DIR="${1:-$PWD/os-build-out}"
mkdir -p "$OUT_DIR"
OUT="$(cd "$OUT_DIR" && pwd)"
SIZE="${SYSTEM_SIZE:-2G}"
DATA_SIZE="${DATA_SIZE:-512M}"
SLOT="${TARGET_SLOT:-a}"

say(){ printf '\033[1;36m::\033[0m %s\n' "$*"; }
warn(){ printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }
die(){ printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

mkdir -p "$OUT"
STAGE="$OUT/rootfs-stage"
rm -rf "$STAGE"
mkdir -p "$STAGE"

say "Staging LibreDroid OS rootfs (Target Slot: $SLOT)..."

# 1. Base rootfs extraction (Alpine Linux AArch64)
ALPINE_TAR="${ALPINE_TAR:-/tmp/alpine-minirootfs-3.20.0-aarch64.tar.gz}"
if [ ! -f "$ALPINE_TAR" ]; then
  say "Fetching Alpine Linux AArch64 minirootfs..."
  curl -fsSL "https://dl-cdn.alpinelinux.org/alpine/v3.20/releases/aarch64/alpine-minirootfs-3.20.0-aarch64.tar.gz" -o "$ALPINE_TAR" 2>/dev/null || true
fi

if [ -f "$ALPINE_TAR" ]; then
  say "Extracting base AArch64 Linux rootfs into stage..."
  tar -zxf "$ALPINE_TAR" -C "$STAGE"
else
  warn "Alpine minirootfs not found. Generating basic directory skeleton..."
  mkdir -p "$STAGE"/{bin,sbin,usr/bin,usr/sbin,usr/lib,usr/share,etc,var/lib/lrd,run/lrd,tmp,root,home/lrd,dev,proc,sys,vendor,odm,product,vendor_dlkm,odm_dlkm,opt/libredroid}
fi

# Ensure essential mountpoints exist
mkdir -p "$STAGE"/{bin,sbin,usr/bin,usr/sbin,usr/lib,usr/share,etc,var/lib/lrd,run/lrd,tmp,root,home/lrd,dev,proc,sys,vendor,odm,product,vendor_dlkm,odm_dlkm,opt/libredroid}
mkdir -p "$STAGE"/etc/{environment.d,modules-load.d,udev/rules.d,pulse,ofono,lrd,init.d}
mkdir -p "$STAGE"/etc/systemd/system/{sysinit.target.wants,multi-user.target.wants,cage.service.d,pulseaudio.service.d}

# Configure standard inittab and rcS for Busybox init
cat > "$STAGE/etc/inittab" << 'EOF'
::sysinit:/etc/init.d/rcS
::respawn:/bin/sh
tty0::respawn:/bin/sh
tty1::respawn:/bin/sh
::ctrlaltdel:/sbin/reboot
::shutdown:/bin/umount -a -r
EOF
chmod +x "$STAGE/etc/inittab"

cat > "$STAGE/etc/init.d/rcS" << 'EOF'
#!/bin/sh
export PATH=/bin:/sbin:/usr/bin:/usr/sbin
echo "=================================================="
echo "    WELCOME TO LIBREDROID OS (AArch64)            "
echo "=================================================="
mount -t proc proc /proc 2>/dev/null
mount -t sysfs sysfs /sys 2>/dev/null
mount -t devtmpfs devtmpfs /dev 2>/dev/null
mkdir -p /dev/pts /dev/shm
mount -t devpts devpts /dev/pts 2>/dev/null
mount -t tmpfs tmpfs /dev/shm 2>/dev/null
mount -t tmpfs tmpfs /run 2>/dev/null
[ -x /usr/bin/lrd-adapt-apply ] && /usr/bin/lrd-adapt-apply || true
echo "LibreDroid OS kernel and hardware initialized."
EOF
chmod +x "$STAGE/etc/init.d/rcS"

# 2. Copy lrd-adapt-common package payload
COMMON_PKG="$TOP/os/adapt/packages/lrd-adapt-common"
if [ -d "$COMMON_PKG" ]; then
  say "Installing lrd-adapt-common runtime..."
  cp -a "$COMMON_PKG/usr/." "$STAGE/usr/"
  cp -a "$COMMON_PKG/etc/." "$STAGE/etc/"
fi

# 2b. Copy device-specific adaptation package if present
ADAPT_PKG="${ADAPT_PKG:-}"
if [ -z "$ADAPT_PKG" ]; then
  ADAPT_PKG="$(ls -d "$TOP"/adapt-out/lrd-adapt-*/ 2>/dev/null | head -1 || true)"
fi
if [ -n "$ADAPT_PKG" ] && [ -d "$ADAPT_PKG" ]; then
  say "Installing device adaptation package from $ADAPT_PKG..."
  [ -d "$ADAPT_PKG/etc" ] && cp -a "$ADAPT_PKG/etc/." "$STAGE/etc/"
  [ -d "$ADAPT_PKG/usr" ] && cp -a "$ADAPT_PKG/usr/." "$STAGE/usr/"
  [ -d "$ADAPT_PKG/lib" ] && cp -a "$ADAPT_PKG/lib/." "$STAGE/lib/" 2>/dev/null || true
  [ -d "$ADAPT_PKG/vendor" ] && cp -a "$ADAPT_PKG/vendor/." "$STAGE/vendor/" 2>/dev/null || true
fi

# Ensure compiled lrd-propset binary is present if gcc is available
if [ ! -f "$STAGE/usr/lib/lrd/adapt/lrd-propset.bin" ] && [ -f "$STAGE/usr/lib/lrd/adapt/src/lrd-propset.c" ] && command -v gcc >/dev/null 2>&1; then
  say "Compiling lrd-propset helper..."
  gcc -O2 -o "$STAGE/usr/lib/lrd/adapt/lrd-propset.bin" "$STAGE/usr/lib/lrd/adapt/src/lrd-propset.c" -ldl 2>/dev/null || true
  chmod +x "$STAGE/usr/lib/lrd/adapt/lrd-propset.bin" 2>/dev/null || true
fi

# 3. Copy LibreDroid Shell and Server
say "Deploying LibreDroid Shell and Server into /opt/libredroid..."
mkdir -p "$STAGE/opt/libredroid/dist"
if [ -d "$TOP/dist" ]; then
  cp -a "$TOP/dist/." "$STAGE/opt/libredroid/dist/"
else
  warn "dist/ directory not found; building frontend..."
  (cd "$TOP" && npm run build)
  cp -a "$TOP/dist/." "$STAGE/opt/libredroid/dist/"
fi

cp "$TOP/server.js" "$STAGE/opt/libredroid/server.js"
cp "$TOP/package.json" "$STAGE/opt/libredroid/package.json"
mkdir -p "$STAGE/opt/libredroid/os/termux"
cp -a "$TOP/os/termux/backends" "$STAGE/opt/libredroid/os/termux/"
cp -a "$TOP/os/termux/etc" "$STAGE/opt/libredroid/os/termux/" 2>/dev/null || true

# 4. Systemd services configuration
cat > "$STAGE/etc/systemd/system/lrd-bridge.service" <<'EOF'
[Unit]
Description=LibreDroid Bridge Server
DefaultDependencies=no
After=lrd-adapt-apply.service
Before=cage.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/libredroid
Environment=NODE_ENV=production
Environment=LRD_PORT=3001
Environment=LRD_BIND=127.0.0.1
Environment=LRD_HOME=/root/.lrd
Environment=LRD_BACKEND=hostandroid
ExecStart=/usr/bin/node /opt/libredroid/server.js
Restart=always
RestartSec=2
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable services by creating symlinks in .wants
ln -sf /etc/systemd/system/lrd-adapt-apply.service "$STAGE/etc/systemd/system/sysinit.target.wants/"
ln -sf /etc/systemd/system/lrd-props.service "$STAGE/etc/systemd/system/sysinit.target.wants/"
ln -sf /etc/systemd/system/lrd-binder.service "$STAGE/etc/systemd/system/sysinit.target.wants/"
ln -sf /etc/systemd/system/lrd-adapt-late.service "$STAGE/etc/systemd/system/multi-user.target.wants/"
ln -sf /etc/systemd/system/lrd-adapt-validate.service "$STAGE/etc/systemd/system/multi-user.target.wants/"
ln -sf /etc/systemd/system/lrd-firstboot-gate.service "$STAGE/etc/systemd/system/multi-user.target.wants/"
ln -sf /etc/systemd/system/lrd-bridge.service "$STAGE/etc/systemd/system/multi-user.target.wants/"

# 5. OS Release and Hostname identity
cat > "$STAGE/etc/os-release" <<'EOF'
NAME="LibreDroid OS"
ID=libredroid
VERSION="1.0 (Bare-Metal Sovereign)"
VERSION_ID="1.0"
PRETTY_NAME="LibreDroid OS 1.0 (Halium Hybrid)"
HOME_URL="https://libredroid.local"
SUPPORT_URL="https://libredroid.local"
BUG_REPORT_URL="https://libredroid.local"
EOF

echo "libredroid" > "$STAGE/etc/hostname"
echo "127.0.0.1 localhost libredroid" > "$STAGE/etc/hosts"

# Make all bin scripts executable
chmod +x "$STAGE/usr/bin/"* 2>/dev/null || true
chmod +x "$STAGE/usr/lib/lrd/adapt/"* 2>/dev/null || true

# 6. Build the ext4 system image
SYSTEM_IMG="$OUT/system_${SLOT}.img"
rm -f "$SYSTEM_IMG"
say "Creating ext4 filesystem $SYSTEM_IMG (Label: LRDROOT, Size: $SIZE)..."
mke2fs -t ext4 -L LRDROOT -d "$STAGE" "$SYSTEM_IMG" "$SIZE"
# Also provide alias/symlink if needed
[ "$SLOT" != "b" ] && ln -sf "system_${SLOT}.img" "$OUT/system_b.img" || true
[ "$SLOT" != "a" ] && ln -sf "system_${SLOT}.img" "$OUT/system_a.img" || true

# 7. Build the persistent data image
DATA_IMG="$OUT/lrddata_${SLOT}.img"
rm -f "$DATA_IMG"
say "Creating ext4 filesystem $DATA_IMG (Label: LRDDATA, Size: $DATA_SIZE)..."
DATA_STAGE="$OUT/data-stage"
rm -rf "$DATA_STAGE"
mkdir -p "$DATA_STAGE"/{upper,work}
mke2fs -t ext4 -L LRDDATA -d "$DATA_STAGE" "$DATA_IMG" "$DATA_SIZE"
[ "$SLOT" != "b" ] && ln -sf "lrddata_${SLOT}.img" "$OUT/lrddata_b.img" || true
[ "$SLOT" != "a" ] && ln -sf "lrddata_${SLOT}.img" "$OUT/lrddata_a.img" || true
rm -rf "$DATA_STAGE" "$STAGE"

say "LibreDroid OS Image Build Complete:"
say "  • Rootfs: $SYSTEM_IMG ($(du -h "$SYSTEM_IMG" | cut -f1)) [ext4: LRDROOT]"
say "  • Data:   $DATA_IMG ($(du -h "$DATA_IMG" | cut -f1)) [ext4: LRDDATA]"
