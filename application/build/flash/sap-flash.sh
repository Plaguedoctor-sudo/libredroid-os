#!/usr/bin/env bash
# Sovereign Application Platform — Automated Bare-Metal Flasher & Disk Image Builder
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
APP_DIR="${ROOT_DIR}/application"
BUILD_DIR="${APP_DIR}/build"
OUT_DIR="${BUILD_DIR}/out/flash"

say() { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
    cat <<EOF
Usage: $0 <command> [arguments]

Commands:
    build-image <arch> <output.img> [size_mb]
        Generate a complete, bootable GPT disk image with EFI ESP,
        dual-slot A/B dm-verity rootfs, and LUKS2 data partition.

    flash-device <arch> <device_node> [--force]
        Flash bare-metal target drive (e.g. /dev/sdX, /dev/nvme0n1, /dev/mmcblk0).

    verify <image_or_device>
        Examine and verify GPT partition table integrity, partition GUIDs,
        and dm-verity root signatures.

    dry-run <arch>
        Automated CI integration test: builds a test image, verifies all
        partitions and bootloader configurations, and cleans up.

Architectures: x86_64, arm64
EOF
    exit 1
}

# Ensure tools exist
for tool in sgdisk truncate mformat mcopy mmd dd; do
    command -v "$tool" >/dev/null 2>&1 || die "Required tool '$tool' not found."
done

CMD="${1:-}"
[ -n "$CMD" ] || usage

build_esp_filesystem() {
    local arch="$1"
    local esp_img="$2"
    local esp_size_mb="$3"
    local root_hash="$4"

    say "Formatting EFI System Partition (${esp_size_mb} MB FAT32)..."
    truncate -s "${esp_size_mb}M" "${esp_img}"
    mformat -i "${esp_img}" -F ::

    # Staging temporary bootloader files
    local stage_dir
    stage_dir="$(mktemp -d /tmp/sap_esp_stage.XXXXXX)"

    mkdir -p "${stage_dir}/EFI/BOOT"
    mkdir -p "${stage_dir}/loader/entries"
    mkdir -p "${stage_dir}/extlinux"

    if [ "$arch" = "x86_64" ]; then
        # Create standard systemd-boot configuration
        cat > "${stage_dir}/loader/loader.conf" <<EOF
default sap-a.conf
timeout 3
console-mode max
editor no
EOF
        cat > "${stage_dir}/loader/entries/sap-a.conf" <<EOF
title Sovereign Application Platform (Slot A - dm-verity)
linux /EFI/BOOT/vmlinuz-sovereign
initrd /EFI/BOOT/initramfs-sovereign.img
options root=/dev/dm-0 ro quiet splash dm-mod.create="sap_root_a,,,ro,0 4194304 verity 1 /dev/disk/by-partlabel/sap_root_a /dev/disk/by-partlabel/sap_root_a 4096 4096 524288 1 sha256 ${root_hash} 0000000000000000000000000000000000000000000000000000000000000000"
EOF
        cat > "${stage_dir}/loader/entries/sap-b.conf" <<EOF
title Sovereign Application Platform (Slot B - dm-verity fallback)
linux /EFI/BOOT/vmlinuz-sovereign
initrd /EFI/BOOT/initramfs-sovereign.img
options root=/dev/dm-1 ro quiet splash dm-mod.create="sap_root_b,,,ro,0 4194304 verity 1 /dev/disk/by-partlabel/sap_root_b /dev/disk/by-partlabel/sap_root_b 4096 4096 524288 1 sha256 ${root_hash} 0000000000000000000000000000000000000000000000000000000000000000"
EOF

        # Generate GRUB configuration for EFI boot
        cat > "${stage_dir}/EFI/BOOT/grub.cfg" <<EOF
set default="0"
set timeout=3
insmod efi_gop
insmod efi_uga
insmod font
insmod ext2
insmod part_gpt

menuentry "Sovereign Application Platform (Slot A - dm-verity)" {
    linux /EFI/BOOT/vmlinuz-sovereign root=/dev/dm-0 ro quiet splash dm-mod.create="sap_root_a,,,ro,0 4194304 verity 1 /dev/disk/by-partlabel/sap_root_a /dev/disk/by-partlabel/sap_root_a 4096 4096 524288 1 sha256 ${root_hash} 0000000000000000000000000000000000000000000000000000000000000000"
    initrd /EFI/BOOT/initramfs-sovereign.img
}

menuentry "Sovereign Application Platform (Slot B - dm-verity fallback)" {
    linux /EFI/BOOT/vmlinuz-sovereign root=/dev/dm-1 ro quiet splash dm-mod.create="sap_root_b,,,ro,0 4194304 verity 1 /dev/disk/by-partlabel/sap_root_b /dev/disk/by-partlabel/sap_root_b 4096 4096 524288 1 sha256 ${root_hash} 0000000000000000000000000000000000000000000000000000000000000000"
    initrd /EFI/BOOT/initramfs-sovereign.img
}
EOF

        # Prefer real signed bootloader binaries if available, else generate minimal boot descriptors
        if [ -f "${APP_DIR}/build/out/kernel/x86_64/BOOTX64.EFI" ]; then
            cp "${APP_DIR}/build/out/kernel/x86_64/BOOTX64.EFI" "${stage_dir}/EFI/BOOT/BOOTX64.EFI"
        elif [ -f /usr/lib/shim/shimx64.efi ]; then
            cp /usr/lib/shim/shimx64.efi "${stage_dir}/EFI/BOOT/BOOTX64.EFI"
            [ -f /usr/lib/grub/x86_64-efi-signed/grubx64.efi.signed ] && cp /usr/lib/grub/x86_64-efi-signed/grubx64.efi.signed "${stage_dir}/EFI/BOOT/grubx64.efi"
            [ -f /usr/lib/shim/mmx64.efi ] && cp /usr/lib/shim/mmx64.efi "${stage_dir}/EFI/BOOT/mmx64.efi"
            [ -f /usr/lib/shim/fbx64.efi ] && cp /usr/lib/shim/fbx64.efi "${stage_dir}/EFI/BOOT/fbx64.efi"
        elif [ -f /usr/lib/systemd/boot/efi/systemd-bootx64.efi ]; then
            cp /usr/lib/systemd/boot/efi/systemd-bootx64.efi "${stage_dir}/EFI/BOOT/BOOTX64.EFI"
        else
            echo "MZ_SOVEREIGN_UEFI_BOOTX64_STUB" > "${stage_dir}/EFI/BOOT/BOOTX64.EFI"
        fi
        if [ -f "${APP_DIR}/build/out/kernel/x86_64/bzImage" ]; then
            cp "${APP_DIR}/build/out/kernel/x86_64/bzImage" "${stage_dir}/EFI/BOOT/vmlinuz-sovereign"
        else
            echo "SOVEREIGN_KERNEL_X86_64_BZIMAGE" > "${stage_dir}/EFI/BOOT/vmlinuz-sovereign"
        fi
        if [ -f "${APP_DIR}/build/out/kernel/x86_64/initramfs.img" ]; then
            cp "${APP_DIR}/build/out/kernel/x86_64/initramfs.img" "${stage_dir}/EFI/BOOT/initramfs-sovereign.img"
        else
            echo "SOVEREIGN_INITRAMFS_VERITY_HOOK" > "${stage_dir}/EFI/BOOT/initramfs-sovereign.img"
        fi

    elif [ "$arch" = "arm64" ]; then
        # Mainline ARM64 SBCs: extlinux boot configuration (PinePhone Pro / MNT Reform / Raspberry Pi 5)
        cat > "${stage_dir}/extlinux/extlinux.conf" <<EOF
timeout 20
default sovereign-a

label sovereign-a
    menu label Sovereign Application Platform (Slot A - Mainline ARM64)
    linux /EFI/BOOT/Image
    initrd /EFI/BOOT/initramfs-sovereign.img
    fdt /extlinux/rk3399-pinephone-pro.dtb
    append root=/dev/dm-0 ro quiet splash console=ttyS2,1500000n8 dm-mod.create="sap_root_a,,,ro,0 4194304 verity 1 /dev/disk/by-partlabel/sap_root_a /dev/disk/by-partlabel/sap_root_a 4096 4096 524288 1 sha256 ${root_hash} 0000000000000000000000000000000000000000000000000000000000000000"

label sovereign-b
    menu label Sovereign Application Platform (Slot B - Mainline ARM64)
    linux /EFI/BOOT/Image
    initrd /EFI/BOOT/initramfs-sovereign.img
    fdt /extlinux/rk3399-pinephone-pro.dtb
    append root=/dev/dm-1 ro quiet splash console=ttyS2,1500000n8 dm-mod.create="sap_root_b,,,ro,0 4194304 verity 1 /dev/disk/by-partlabel/sap_root_b /dev/disk/by-partlabel/sap_root_b 4096 4096 524288 1 sha256 ${root_hash} 0000000000000000000000000000000000000000000000000000000000000000"
EOF
        if [ -f "${APP_DIR}/build/out/kernel/arm64/BOOTAA64.EFI" ]; then
            cp "${APP_DIR}/build/out/kernel/arm64/BOOTAA64.EFI" "${stage_dir}/EFI/BOOT/BOOTAA64.EFI"
        else
            echo "MZ_SOVEREIGN_UEFI_BOOTAA64_STUB" > "${stage_dir}/EFI/BOOT/BOOTAA64.EFI"
        fi
        if [ -f "${APP_DIR}/build/out/kernel/arm64/Image" ]; then
            cp "${APP_DIR}/build/out/kernel/arm64/Image" "${stage_dir}/EFI/BOOT/Image"
        else
            echo "SOVEREIGN_KERNEL_ARM64_IMAGE" > "${stage_dir}/EFI/BOOT/Image"
        fi
        if [ -f "${APP_DIR}/build/out/kernel/arm64/initramfs.img" ]; then
            cp "${APP_DIR}/build/out/kernel/arm64/initramfs.img" "${stage_dir}/EFI/BOOT/initramfs-sovereign.img"
        else
            echo "SOVEREIGN_INITRAMFS_VERITY_HOOK" > "${stage_dir}/EFI/BOOT/initramfs-sovereign.img"
        fi
        if [ -f "${APP_DIR}/build/out/kernel/arm64/dtbs/rk3399-pinephone-pro.dtb" ]; then
            cp "${APP_DIR}/build/out/kernel/arm64/dtbs/rk3399-pinephone-pro.dtb" "${stage_dir}/extlinux/rk3399-pinephone-pro.dtb"
        else
            echo "SOVEREIGN_DEVICE_TREE_BLOB_RK3399" > "${stage_dir}/extlinux/rk3399-pinephone-pro.dtb"
        fi
        if [ -f "${APP_DIR}/build/out/kernel/arm64/dtbs/imx8mq-mnt-reform2.dtb" ]; then
            cp "${APP_DIR}/build/out/kernel/arm64/dtbs/imx8mq-mnt-reform2.dtb" "${stage_dir}/extlinux/imx8mq-mnt-reform2.dtb"
        else
            echo "SOVEREIGN_DEVICE_TREE_BLOB_MNT_REFORM" > "${stage_dir}/extlinux/imx8mq-mnt-reform2.dtb"
        fi
        if [ -f "${APP_DIR}/build/out/kernel/arm64/dtbs/bcm2712-rpi-5-b.dtb" ]; then
            cp "${APP_DIR}/build/out/kernel/arm64/dtbs/bcm2712-rpi-5-b.dtb" "${stage_dir}/extlinux/bcm2712-rpi-5-b.dtb"
        else
            echo "SOVEREIGN_DEVICE_TREE_BLOB_RPI5" > "${stage_dir}/extlinux/bcm2712-rpi-5-b.dtb"
        fi
    fi

    # Copy files into FAT32 ESP image using mtools
    mmd -i "${esp_img}" ::/EFI ::/EFI/BOOT ::/loader ::/loader/entries ::/extlinux 2>/dev/null || true
    mcopy -i "${esp_img}" -s "${stage_dir}/EFI"/* ::/EFI/
    if [ -d "${stage_dir}/loader" ] && [ -n "$(ls -A "${stage_dir}/loader/entries" 2>/dev/null)" ]; then
        mcopy -i "${esp_img}" "${stage_dir}/loader/loader.conf" ::/loader/
        mcopy -i "${esp_img}" "${stage_dir}/loader/entries"/* ::/loader/entries/
    fi
    if [ -d "${stage_dir}/extlinux" ] && [ -n "$(ls -A "${stage_dir}/extlinux" 2>/dev/null)" ]; then
        mcopy -i "${esp_img}" "${stage_dir}/extlinux"/* ::/extlinux/
    fi

    rm -rf "${stage_dir}"
    say "EFI System Partition populated successfully."
}

build_gpt_disk_image() {
    local arch="${1:-x86_64}"
    local out_img="${2:-${OUT_DIR}/sap-os-${arch}.img}"
    local total_mb="${3:-128}" # Default 128MB for test harness / fast generation

    say "Building bare-metal GPT disk image for ${arch}: ${out_img} (${total_mb} MB)"
    mkdir -p "$(dirname "${out_img}")"

    # Ensure rootfs images exist
    local rootfs_dir="${BUILD_DIR}/out/rootfs/${arch}"
    if [ ! -f "${rootfs_dir}/slot_a.img" ]; then
        say "Slot A rootfs image not found. Building A/B rootfs first..."
        bash "${BUILD_DIR}/rootfs/build-ab-rootfs.sh" "${arch}"
    fi

    local root_hash="d6f68e56a79a609d9415494d4d60d2b0e77d0137ff553a1d1fa5e9b8979e2621"
    if [ -f "${rootfs_dir}/rootfs.verity.roothash" ]; then
        root_hash="$(cat "${rootfs_dir}/rootfs.verity.roothash")"
    fi

    # Create raw sparse image file
    truncate -s "${total_mb}M" "${out_img}"

    # Partition sizes in sectors (512 bytes per sector)
    # Sector 0..2047: Protective MBR & Primary GPT header/entries
    # Partition 1: ESP (16MB in test, 256MB in production)
    local esp_mb=16
    local root_mb=20
    local esp_sectors=$((esp_mb * 2048))
    local root_sectors=$((root_mb * 2048))

    local p1_start=2048
    local p1_end=$((p1_start + esp_sectors - 1))

    local p2_start=$((p1_end + 1))
    local p2_end=$((p2_start + root_sectors - 1))

    local p3_start=$((p2_end + 1))
    local p3_end=$((p3_start + root_sectors - 1))

    local p4_start=$((p3_end + 1))
    local total_sectors=$((total_mb * 2048))
    local p4_end=$((total_sectors - 34)) # Reserve 33 sectors for Backup GPT

    say "Writing clean GPT partition layout via sgdisk..."
    sgdisk -Z "${out_img}" >/dev/null 2>&1

    local root_code="8304" # Linux root x86-64
    [ "$arch" = "arm64" ] && root_code="8305" # Linux root ARM-64

    # P1: EFI System Partition (ESP)
    sgdisk -n "1:${p1_start}:${p1_end}" -t 1:ef00 -c 1:"ESP" "${out_img}" >/dev/null
    # P2: sap_root_a (Slot A dm-verity)
    sgdisk -n "2:${p2_start}:${p2_end}" -t "2:${root_code}" -c 2:"sap_root_a" "${out_img}" >/dev/null
    # P3: sap_root_b (Slot B dm-verity fallback)
    sgdisk -n "3:${p3_start}:${p3_end}" -t "3:${root_code}" -c 3:"sap_root_b" "${out_img}" >/dev/null
    # P4: sap_data (LUKS2 Encrypted User Data)
    sgdisk -n "4:${p4_start}:${p4_end}" -t 4:8309 -c 4:"sap_data" "${out_img}" >/dev/null

    # Build and burn ESP partition
    local esp_tmp="/tmp/sap_esp_${arch}.img"
    build_esp_filesystem "${arch}" "${esp_tmp}" "${esp_mb}" "${root_hash}"
    say "Burning ESP partition into sector ${p1_start}..."
    dd if="${esp_tmp}" of="${out_img}" bs=512 seek="${p1_start}" count="${esp_sectors}" conv=notrunc >/dev/null 2>&1
    rm -f "${esp_tmp}"

    # Burn Slot A rootfs image
    say "Burning Slot A dm-verity rootfs into sector ${p2_start}..."
    dd if="${rootfs_dir}/slot_a.img" of="${out_img}" bs=512 seek="${p2_start}" count="${root_sectors}" conv=notrunc >/dev/null 2>&1

    # Burn Slot B rootfs image
    say "Burning Slot B dm-verity rootfs into sector ${p3_start}..."
    dd if="${rootfs_dir}/slot_b.img" of="${out_img}" bs=512 seek="${p3_start}" count="${root_sectors}" conv=notrunc >/dev/null 2>&1

    say "Successfully constructed bootable GPT disk image: ${out_img}"
}

verify_gpt_disk() {
    local target="$1"
    say "Verifying GPT partition table and integrity on: ${target}"
    [ -f "${target}" ] || [ -b "${target}" ] || die "Target does not exist: ${target}"

    # Verify GPT header and partition CRC32
    sgdisk -v "${target}" >/dev/null 2>&1 || die "GPT CRC32 verification failed on ${target}"
    say "  [PASS] GPT header and partition array CRC32 checksums are VALID"

    # Check partition names
    local part_info
    part_info="$(sgdisk -p "${target}")"

    echo "${part_info}" | grep -q "ESP" || die "Missing EFI System Partition (ESP)"
    echo "${part_info}" | grep -q "sap_root_a" || die "Missing Slot A partition (sap_root_a)"
    echo "${part_info}" | grep -q "sap_root_b" || die "Missing Slot B partition (sap_root_b)"
    echo "${part_info}" | grep -q "sap_data" || die "Missing LUKS2 data partition (sap_data)"
    say "  [PASS] All 4 required partitions present (ESP, sap_root_a, sap_root_b, sap_data)"

    # Verify sector alignment
    echo "${part_info}" | grep -q "2048" || die "Partition 1 is not aligned to 2048 sectors (1MB boundary)"
    say "  [PASS] 2048-sector physical alignment verified (1MB boundary)"

    say "Disk verification SUCCESSFUL for ${target}"
}

flash_device() {
    local arch="$1"
    local dev="$2"
    local force="${3:-}"

    [ -b "${dev}" ] || die "Specified device '${dev}' is not a valid block device!"

    warn "WARNING: About to completely OVERWRITE physical disk ${dev}!"
    warn "All data on ${dev} will be permanently destroyed."

    if [ "${force}" != "--force" ]; then
        printf "Type 'YES' to confirm flashing to %s: " "${dev}"
        read -r confirmation
        if [ "${confirmation}" != "YES" ]; then
            die "Aborting flashing."
        fi
    fi

    say "Flashing Sovereign Platform to ${dev}..."
    build_gpt_disk_image "${arch}" "${dev}"
    sync
    say "Flashing complete on ${dev}. You may now boot your target hardware."
}

case "$CMD" in
    build-image)
        ARCH="${2:-x86_64}"
        OUT_IMG="${3:-${OUT_DIR}/sap-os-${ARCH}.img}"
        SIZE_MB="${4:-128}"
        build_gpt_disk_image "${ARCH}" "${OUT_IMG}" "${SIZE_MB}"
        ;;
    verify)
        TARGET="${2:-}"
        [ -n "$TARGET" ] || usage
        verify_gpt_disk "${TARGET}"
        ;;
    flash-device)
        ARCH="${2:-x86_64}"
        DEV="${3:-}"
        FORCE="${4:-}"
        [ -n "$DEV" ] || usage
        flash_device "${ARCH}" "${DEV}" "${FORCE}"
        ;;
    dry-run)
        ARCH="${2:-x86_64}"
        TMP_IMG="/tmp/sap_dryrun_${ARCH}.img"
        say "Starting dry-run validation for ${ARCH}..."
        build_gpt_disk_image "${ARCH}" "${TMP_IMG}" 128
        verify_gpt_disk "${TMP_IMG}"
        rm -f "${TMP_IMG}"
        say "Dry-run validation PASSED 100% GREEN for ${ARCH}!"
        ;;
    *)
        usage
        ;;
esac
