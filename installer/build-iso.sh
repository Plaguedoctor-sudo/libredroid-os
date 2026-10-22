#!/bin/bash
# ==============================================================================
# LibreDroid OS - Independent Universal Operating System
# Live ISO Image Builder (x86_64 UEFI + BIOS Dual Bootable)
# ==============================================================================

set -e

echo "=== Building LibreDroid Universal OS Bootable ISO ==="

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="/tmp/libredroid-iso-build"
ROOTFS_DIR="/tmp/libredroid-rootfs-stage"
ISO_NAME="${REPO_ROOT}/libredroid-universal-x86_64.iso"

# 1. Clean previous build artifacts
rm -rf "${WORK_DIR}" "${ROOTFS_DIR}"
mkdir -p "${WORK_DIR}/boot/grub"
mkdir -p "${WORK_DIR}/live"
mkdir -p "${ROOTFS_DIR}/opt/libredroid"
mkdir -p "${ROOTFS_DIR}/etc/libredroid"

# 2. Bundle compiled LibreDroid OS web shell and services
echo "[1/5] Bundling LibreDroid OS production build and Waydroid bridge..."
if [ ! -d "${REPO_ROOT}/dist" ]; then
    echo "Compiling LibreDroid frontend..."
    cd "${REPO_ROOT}" && npm run build
fi

cp -r "${REPO_ROOT}/dist" "${ROOTFS_DIR}/opt/libredroid/ui"
cp "${REPO_ROOT}/package.json" "${ROOTFS_DIR}/opt/libredroid/"
cp -r "${REPO_ROOT}/installer" "${ROOTFS_DIR}/opt/libredroid/"

# 3. Create Waydroid, Binder & microG system configuration
cat << 'EOF' > "${ROOTFS_DIR}/etc/libredroid/binder.conf"
# Binder & Ashmem kernel modules for native AOSP container runtime
binder_linux
ashmem_linux
EOF

cat << 'EOF' > "${ROOTFS_DIR}/opt/libredroid/launch-desktop.sh"
#!/bin/bash
# Starts local LibreDroid sovereign environment
echo "Starting LibreDroid Sovereign Desktop..."
cd /opt/libredroid/ui
python3 -m http.server 3001 --bind 127.0.0.1 &
WEB_PID=$!

# Launch Waydroid container bridge in background
if command -v waydroid &>/dev/null; then
    waydroid session start &
fi

# Launch Chromium/Browser in Kiosk App mode
if command -v google-chrome &>/dev/null; then
    google-chrome --kiosk --app=http://127.0.0.1:3001
elif command -v chromium &>/dev/null; then
    chromium --kiosk --app=http://127.0.0.1:3001
elif command -v firefox &>/dev/null; then
    firefox --kiosk http://127.0.0.1:3001
fi

wait $WEB_PID
EOF
chmod +x "${ROOTFS_DIR}/opt/libredroid/launch-desktop.sh"

# 4. Generate Live SquashFS Filesystem
echo "[2/5] Creating compressed live root filesystem (SquashFS)..."
mksquashfs "${ROOTFS_DIR}" "${WORK_DIR}/live/filesystem.squashfs" -comp xz -noappend

# 5. Copy kernel & initrd from host boot
echo "[3/5] Locating host Linux kernel and initrd..."
KERNEL_IMAGE=$(ls -t /boot/vmlinuz* 2>/dev/null | head -n 1)
INITRD_IMAGE=$(ls -t /boot/initrd.img* 2>/dev/null | head -n 1)

if [ -r "${KERNEL_IMAGE}" ] && [ -r "${INITRD_IMAGE}" ]; then
    echo "Using kernel: ${KERNEL_IMAGE}"
    echo "Using initrd: ${INITRD_IMAGE}"
    cp "${KERNEL_IMAGE}" "${WORK_DIR}/live/vmlinuz"
    cp "${INITRD_IMAGE}" "${WORK_DIR}/live/initrd.img"
else
    # Fallback to readable 6.14 kernel
    cp /boot/vmlinuz-6.14.0-37-generic "${WORK_DIR}/live/vmlinuz"
    cp /boot/initrd.img-6.14.0-37-generic "${WORK_DIR}/live/initrd.img"
fi

# 6. Configure GRUB2 EFI & BIOS Bootloader
echo "[4/5] Generating GRUB2 Dual EFI/BIOS bootloader menu..."
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

menuentry "LibreDroid OS Universal (Live Mode - Try without installing)" --class os {
    linux /live/vmlinuz boot=live quiet splash waydroid.enable=1
    initrd /live/initrd.img
}

menuentry "Install LibreDroid OS to Hard Disk (Calamares / Direct Installer)" --class os {
    linux /live/vmlinuz boot=live quiet splash libredroid.installer=1
    initrd /live/initrd.img
}

menuentry "LibreDroid OS (Safe Graphics Mode - VESA/Nomodeset)" --class os {
    linux /live/vmlinuz boot=live nomodeset
    initrd /live/initrd.img
}
EOF

# 7. Create Hybrid Bootable ISO with grub-mkrescue
echo "[5/5] Building bootable ISO image with grub-mkrescue (xorriso)..."
grub-mkrescue -o "${ISO_NAME}" "${WORK_DIR}" -- -volid "LIBREDROID_OS"

echo "=================================================================="
echo "✓ SUCCESS: LibreDroid Universal Bootable ISO created at:"
echo "  ${ISO_NAME}"
echo ""
echo "ISO Details:"
ls -lh "${ISO_NAME}"
file "${ISO_NAME}"
echo "=================================================================="
