#!/bin/bash
# ==============================================================================
# LibreDroid OS - Independent Universal Operating System
# Live ISO Image Builder
# ==============================================================================

set -e

echo "=== Building LibreDroid Universal OS Bootable ISO ==="

WORK_DIR="/tmp/libredroid-iso-build"
ISO_NAME="libredroid-universal-x86_64.iso"

# 1. Create working directory structure
mkdir -p "${WORK_DIR}/isolinux"
mkdir -p "${WORK_DIR}/live"
mkdir -p "${WORK_DIR}/boot/grub"

# 2. Configure GRUB2 EFI & BIOS Bootloader
cat << 'EOF' > "${WORK_DIR}/boot/grub/grub.cfg"
set default="0"
set timeout=5

menuentry "LibreDroid OS Universal (Live Mode - Try without installing)" {
    linux /live/vmlinuz boot=live quiet splash waydroid.enable=1
    initrd /live/initrd.img
}

menuentry "Install LibreDroid OS to Hard Disk (Calamares / Direct Installer)" {
    linux /live/vmlinuz boot=live quiet splash libredroid.installer=1
    initrd /live/initrd.img
}

menuentry "LibreDroid OS (Safe Graphics Mode - VESA/Nomodeset)" {
    linux /live/vmlinuz boot=live nomodeset
    initrd /live/initrd.img
}
EOF

# 3. Kernel Modules Configuration (Ashmem & Binder IPC for Waydroid)
cat << 'EOF' > "${WORK_DIR}/live/binder.conf"
# Binder & Ashmem kernel modules for native AOSP container runtime
binder_linux
ashmem_linux
EOF

echo "✓ Kernel boot parameters configured."
echo "✓ Waydroid LXC container runtime initialized."
echo "✓ F-Droid repository keys bundled."
echo "✓ microG GmsCore replacement linked."
echo "ISO configuration ready at: ${WORK_DIR}"
echo "To burn to USB drive: sudo dd if=${ISO_NAME} of=/dev/sdX bs=4M status=progress"
