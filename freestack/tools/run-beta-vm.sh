#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Builder Beta VM Launcher & Machine Identity Probe
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

OUT_FILE="${1:-$FS_ROOT/dist/builder-beta-identity.json}"
mkdir -p "$(dirname "$OUT_FILE")"

TMP_D=$(mktemp -d /tmp/fs-beta-vm-XXXXXX)
trap 'rm -rf "$TMP_D"' EXIT

mkdir -p "$TMP_D/initrd"/{bin,sbin,etc,proc,sys,dev,tmp}
cp /usr/bin/busybox "$TMP_D/initrd/bin/busybox"

cat << 'INIT' > "$TMP_D/initrd/init"
#!/bin/busybox sh
/bin/busybox --install -s /bin
mount -t proc proc /proc
mount -t sysfs sys /sys
mount -t devtmpfs dev /dev

MID=$(cat /proc/sys/kernel/random/boot_id | tr -d '-')
UNAME=$(uname -r)
NPROC=$(nproc)
ROOTFS=$(stat -f -c %T /)

echo "FS_BETA_IDENTITY: MID=$MID UNAME=$UNAME NPROC=$NPROC ROOTFS=$ROOTFS"
poweroff -f
INIT
chmod +x "$TMP_D/initrd/init"

(cd "$TMP_D/initrd" && find . | cpio -o -H newc 2>/dev/null) | gzip > "$TMP_D/initrd.img"

VM_KERNEL="/boot/vmlinuz-6.14.0-37-generic"
if [ ! -f "$VM_KERNEL" ]; then
    VM_KERNEL=$(find /boot -name "vmlinuz*" | grep -v "$(uname -r)" | head -n1 || echo "/boot/vmlinuz")
fi

KVM_FLAG=""
if [ -w /dev/kvm ]; then
    KVM_FLAG="-enable-kvm"
fi

VM_OUT=$(qemu-system-x86_64 $KVM_FLAG -m 1024 -smp 2 \
  -kernel "$VM_KERNEL" \
  -initrd "$TMP_D/initrd.img" \
  -append "console=ttyS0 panic=1 quiet" \
  -display none -serial stdio -no-reboot 2>&1)

LINE=$(echo "$VM_OUT" | grep "FS_BETA_IDENTITY:" | tail -n1)
if [ -z "$LINE" ]; then
    echo "Error: VM boot failed to report identity." >&2
    echo "$VM_OUT" >&2
    exit 1
fi

MID=$(echo "$LINE" | sed -n 's/.*MID=\([^ ]*\).*/\1/p' | tr -d '\r\n')
UNAME=$(echo "$LINE" | sed -n 's/.*UNAME=\([^ ]*\).*/\1/p' | tr -d '\r\n')
NPROC=$(echo "$LINE" | sed -n 's/.*NPROC=\([^ ]*\).*/\1/p' | tr -d '\r\n')
ROOTFS=$(echo "$LINE" | sed -n 's/.*ROOTFS=\([^ ]*\).*/\1/p' | tr -d '\r\n')

cat <<EOF > "$OUT_FILE"
{
  "builder": "builder-beta",
  "machine_id": "$MID",
  "uname_r": "$UNAME",
  "nproc": $NPROC,
  "rootfs": "$ROOTFS",
  "tz": "Asia/Tokyo",
  "umask": "0077",
  "lang": "de_DE.UTF-8"
}
EOF

echo "✔ Builder Beta identity captured from VM: $OUT_FILE"
