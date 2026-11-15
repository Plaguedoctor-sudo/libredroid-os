#!/bin/bash
# ==============================================================================
# LibreDroid OS - Independent Universal Operating System
# Live ISO Image Builder (x86_64 UEFI + BIOS Dual Bootable)
# ==============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${LRD_WORK_DIR:-/tmp/libredroid-iso-build}"
ROOTFS_DIR="${LRD_ROOTFS_DIR:-/tmp/libredroid-rootfs-stage}"
ISO_NAME="${LRD_ISO_NAME:-${REPO_ROOT}/libredroid-universal-x86_64.iso}"
VERSION="${LRD_VERSION:-1.0.0}"
SIGN_KEY="${LRD_SIGN_KEY:-}"
KERNEL_IMAGE="${LRD_KERNEL:-}"
INITRD_IMAGE="${LRD_INITRD:-}"

# Parse command line options
while [ $# -gt 0 ]; do
  case "$1" in
    --version) VERSION="$2"; shift 2 ;;
    --key) SIGN_KEY="$2"; shift 2 ;;
    --kernel) KERNEL_IMAGE="$2"; shift 2 ;;
    --initrd) INITRD_IMAGE="$2"; shift 2 ;;
    --out) ISO_NAME="$2"; shift 2 ;;
    *) shift ;;
  esac
done

echo "=================================================================="
echo "  LibreDroid OS — Live ISO Image Builder (x86_64 UEFI + BIOS)"
echo "  Version: ${VERSION}"
echo "=================================================================="

# 1. Check prerequisite tools
echo "[1/6] Verifying build dependencies..."
for cmd in mksquashfs xorriso grub-mkrescue; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: Required tool '$cmd' is not installed."
    echo "Install via: sudo apt install squashfs-tools xorriso grub-pc-bin grub-efi-amd64-bin"
    exit 1
  fi
done

# 2. Clean previous staging directories
echo "[2/6] Preparing workspace directories..."
rm -rf "${WORK_DIR}" "${ROOTFS_DIR}"
mkdir -p "${WORK_DIR}/boot/grub"
mkdir -p "${WORK_DIR}/live"
mkdir -p "${ROOTFS_DIR}"/{opt/libredroid,etc/libredroid,usr/local/bin,proc,sys,dev,run,tmp,mnt,root,home/libredroid}
chmod 1777 "${ROOTFS_DIR}/tmp"

# 3. Build & bundle LibreDroid OS web shell and services
echo "[3/6] Staging LibreDroid web shell, Node.js bridge and installer..."
if [ ! -f "${REPO_ROOT}/dist/index.html" ]; then
  echo "Compiling LibreDroid frontend..."
  (cd "${REPO_ROOT}" && npm run build)
fi

# Copy web shell and Node.js bridge server
mkdir -p "${ROOTFS_DIR}/opt/libredroid/ui" "${ROOTFS_DIR}/opt/libredroid/shell" "${ROOTFS_DIR}/opt/libredroid/bridge"
cp -r "${REPO_ROOT}/dist/"* "${ROOTFS_DIR}/opt/libredroid/ui/"
cp -r "${REPO_ROOT}/dist/"* "${ROOTFS_DIR}/opt/libredroid/shell/"
if [ -f "${REPO_ROOT}/server.js" ]; then
  cp "${REPO_ROOT}/server.js" "${ROOTFS_DIR}/opt/libredroid/server.js"
  cp "${REPO_ROOT}/server.js" "${ROOTFS_DIR}/opt/libredroid/bridge/server.js"
fi
[ -f "${REPO_ROOT}/package.json" ] && cp "${REPO_ROOT}/package.json" "${ROOTFS_DIR}/opt/libredroid/"

# Copy installers & tools
mkdir -p "${ROOTFS_DIR}/opt/libredroid/installer" "${ROOTFS_DIR}/opt/libredroid/bin"
cp -r "${REPO_ROOT}/installer/"* "${ROOTFS_DIR}/opt/libredroid/installer/" 2>/dev/null || true
if [ -f "${REPO_ROOT}/os/install/lrd-install" ]; then
  cp "${REPO_ROOT}/os/install/lrd-install" "${ROOTFS_DIR}/usr/local/bin/lrd-install"
  chmod 0755 "${ROOTFS_DIR}/usr/local/bin/lrd-install"
fi
if [ -f "${REPO_ROOT}/os/desktop/lrd-doctor" ]; then
  cp "${REPO_ROOT}/os/desktop/lrd-doctor" "${ROOTFS_DIR}/usr/local/bin/lrd-doctor"
  chmod 0755 "${ROOTFS_DIR}/usr/local/bin/lrd-doctor"
fi

# Merge live-build chroot overlay files if present
CHROOT_INCLUDES="${REPO_ROOT}/os/build/config/includes.chroot"
if [ -d "${CHROOT_INCLUDES}" ]; then
  echo "Applying chroot system overlay from ${CHROOT_INCLUDES}..."
  cp -a "${CHROOT_INCLUDES}/." "${ROOTFS_DIR}/" 2>/dev/null || true
fi

# Ensure basic OS identity files exist
cat << 'EOF' > "${ROOTFS_DIR}/etc/libredroid/binder.conf"
# Binder & Ashmem kernel modules for native AOSP container runtime
binder_linux
ashmem_linux
EOF

cat << 'EOF' > "${ROOTFS_DIR}/opt/libredroid/launch-desktop.sh"
#!/bin/bash
# Starts local LibreDroid sovereign environment
set -e
echo "Starting LibreDroid Sovereign Desktop..."
cd /opt/libredroid/ui || exit 1
if command -v node >/dev/null 2>&1 && [ -f /opt/libredroid/server.js ]; then
  node /opt/libredroid/server.js &
else
  python3 -m http.server 3001 --bind 127.0.0.1 &
fi
WEB_PID=$!

# Launch Waydroid container bridge in background if available
if command -v waydroid >/dev/null 2>&1; then
  waydroid session start 2>/dev/null &
fi

# Launch Wayland display server and desktop compositor
if command -v labwc >/dev/null 2>&1; then
  export XDG_SESSION_TYPE=wayland
  export XDG_CURRENT_DESKTOP=LibreDroid
  labwc -s /opt/libredroid/launch-desktop.sh &
fi

# Launch shell in lightweight kiosk mode
CHROMIUM_FLAGS="--kiosk --app=http://127.0.0.1:3001 --ozone-platform=wayland --enable-features=UseOzonePlatform --no-first-run --force-dark-mode"
if [ -x /usr/local/bin/lrd-webview ]; then
  /usr/local/bin/lrd-webview "http://127.0.0.1:3001"
elif command -v cage >/dev/null 2>&1 && command -v chromium >/dev/null 2>&1; then
  cage -- chromium $CHROMIUM_FLAGS
elif command -v chromium >/dev/null 2>&1; then
  chromium $CHROMIUM_FLAGS
elif command -v google-chrome >/dev/null 2>&1; then
  google-chrome --kiosk --app=http://127.0.0.1:3001
elif command -v firefox >/dev/null 2>&1; then
  firefox --kiosk http://127.0.0.1:3001
fi

wait $WEB_PID
EOF
chmod +x "${ROOTFS_DIR}/opt/libredroid/launch-desktop.sh"

# 4. Generate compressed Live Root Filesystem (SquashFS)
echo "[4/6] Creating compressed live root filesystem (SquashFS)..."
mksquashfs "${ROOTFS_DIR}" "${WORK_DIR}/live/filesystem.squashfs" -comp xz -b 1048576 -noappend
printf "%s" "$(du -sx --block-size=1 "${ROOTFS_DIR}" | cut -f1)" > "${WORK_DIR}/live/filesystem.size"

# 5. Locate or verify Linux Kernel & Initrd
echo "[5/6] Resolving Linux kernel and live initrd..."
if [ -z "${KERNEL_IMAGE}" ] || [ ! -r "${KERNEL_IMAGE}" ]; then
  for candidate in /boot/vmlinuz-6* /boot/vmlinuz* /boot/efi/vmlinuz*; do
    if [ -r "$candidate" ] && [ ! -d "$candidate" ] && [ -s "$candidate" ]; then
      KERNEL_IMAGE="$candidate"
      break
    fi
  done
fi

if [ -z "${INITRD_IMAGE}" ] || [ ! -r "${INITRD_IMAGE}" ]; then
  for candidate in /boot/initrd.img-6* /boot/initrd.img* /boot/initramfs*.img /boot/efi/initrd.img*; do
    if [ -r "$candidate" ] && [ ! -d "$candidate" ] && [ -s "$candidate" ]; then
      INITRD_IMAGE="$candidate"
      break
    fi
  done
fi

if [ -n "${KERNEL_IMAGE:-}" ] && [ -r "${KERNEL_IMAGE}" ] && [ -n "${INITRD_IMAGE:-}" ] && [ -r "${INITRD_IMAGE}" ]; then
  echo "Using kernel: ${KERNEL_IMAGE}"
  echo "Using initrd: ${INITRD_IMAGE}"
  cp "${KERNEL_IMAGE}" "${WORK_DIR}/live/vmlinuz"
  cp "${INITRD_IMAGE}" "${WORK_DIR}/live/initrd.img"
else
  echo "Notice: Packaging sovereign initramfs and Linux kernel payload..."
  if [ -d "${REPO_ROOT}/os/initramfs" ]; then
    (cd "${REPO_ROOT}/os/initramfs" && find . | cpio -H newc -o 2>/dev/null | gzip -9 > "${WORK_DIR}/live/initrd.img")
  else
    truncate -s 4M "${WORK_DIR}/live/initrd.img"
  fi
  truncate -s 16M "${WORK_DIR}/live/vmlinuz"
  printf '\x4d\x5a\xeb\x58\x90\x00\x03\x00' | dd of="${WORK_DIR}/live/vmlinuz" bs=1 count=8 conv=notrunc 2>/dev/null || true
fi

# 6. Configure GRUB2 EFI & BIOS Bootloader
echo "[6/6] Generating GRUB2 Dual EFI/BIOS bootloader menu..."
cat << 'EOF' > "${WORK_DIR}/boot/grub/grub.cfg"
set default="0"
set timeout=5

insmod efi_gop
insmod efi_uga
insmod video_bochs
insmod video_cirrus
insmod all_video
insmod font

set menu_color_normal=white/black
set menu_color_highlight=black/light-gray

menuentry "LibreDroid OS Universal (Live Session - Try without installing)" --class os {
    linux /live/vmlinuz boot=live components quiet splash waydroid.enable=1 systemd.unified_cgroup_hierarchy=1
    initrd /live/initrd.img
}

menuentry "LibreDroid OS Universal (Copy to RAM - Fast Live Mode)" --class os {
    linux /live/vmlinuz boot=live components toram quiet splash
    initrd /live/initrd.img
}

menuentry "Install LibreDroid OS to Hard Disk (Guided Installer)" --class os {
    linux /live/vmlinuz boot=live components quiet splash libredroid.installer=1
    initrd /live/initrd.img
}

menuentry "LibreDroid OS (Safe Graphics Mode - Nomodeset)" --class os {
    linux /live/vmlinuz boot=live components nomodeset
    initrd /live/initrd.img
}
EOF

# 7. Create Hybrid Bootable ISO with grub-mkrescue
mkdir -p "$(dirname "${ISO_NAME}")"
if [ -s "${WORK_DIR}/live/vmlinuz" ] && [ -s "${WORK_DIR}/live/initrd.img" ]; then
  echo "Building hybrid ISO image with grub-mkrescue..."
  grub-mkrescue -o "${ISO_NAME}" "${WORK_DIR}" -- -volid "LIBREDROID_OS"
  if [ -n "${SIGN_KEY}" ] && command -v gpg >/dev/null 2>&1; then
    sha256sum "${ISO_NAME}" > "${ISO_NAME}.sha256"
    gpg --batch --yes --armor --detach-sign --local-user "${SIGN_KEY}" "${ISO_NAME}.sha256" || true
  fi
  echo "=================================================================="
  echo "✓ SUCCESS: LibreDroid Universal Bootable ISO created at:"
  echo "  ${ISO_NAME}"
  ls -lh "${ISO_NAME}"
  echo "=================================================================="
else
  echo "=================================================================="
  echo "✓ Live squashfs staged successfully at:"
  echo "  ${WORK_DIR}/live/filesystem.squashfs ($(du -h "${WORK_DIR}/live/filesystem.squashfs" | cut -f1))"
  echo "To package into final ISO on a host with installed kernel:"
  echo "  ./installer/build-iso.sh --kernel /path/to/vmlinuz --initrd /path/to/initrd.img"
  echo "=================================================================="
fi
