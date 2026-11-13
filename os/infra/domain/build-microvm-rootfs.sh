#!/usr/bin/env bash
# ==============================================================================
# LibreDroid MicroVM Rootfs Builder
# os/infra/domain/build-microvm-rootfs.sh
#
# Generates minimal, self-contained, bootable ext4 guest rootfs images and initrd
# for Tier 2 Qubes-style hardware-isolated domains (vault, tor-gateway).
# ==============================================================================

set -Eeuo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="${LRD_DOMAINS_DIR:-$HERE/images}"
mkdir -p "$OUTPUT_DIR"

CYAN='\033[1;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BOLD='\033[1m'; NC='\033[0m'
say(){ printf "${CYAN}::${NC} %s\n" "$*"; }
warn(){ printf "${YELLOW}!!${NC} %s\n" "$*" >&2; }
die(){ printf "${RED}xx${NC} %s\n" "$*" >&2; exit 1; }

# Helper to copy binary and all its runtime dependencies
copy_bin_deps() {
    local bin="$1"
    local dest="$2"
    
    [ -f "$bin" ] || die "Binary not found: $bin"
    
    local rel_dir
    rel_dir="$(dirname "$bin" | sed 's|^/||')"
    mkdir -p "$dest/$rel_dir"
    cp -L "$bin" "$dest/$rel_dir/"

    # Parse ldd output
    local libs
    libs="$(ldd "$bin" 2>/dev/null | awk '{if ($3 ~ /^\//) print $3; else if ($1 ~ /^\//) print $1}' || true)"
    for lib in $libs; do
        if [ -f "$lib" ]; then
            local ldir
            ldir="$(dirname "$lib" | sed 's|^/||')"
            mkdir -p "$dest/$ldir"
            cp -L -n "$lib" "$dest/$ldir/" 2>/dev/null || true
        fi
    done
}

build_domain_image() {
    local domain="$1"
    local size_mb="${2:-32}"
    local img_path="$OUTPUT_DIR/${domain}-rootfs.img"
    local work_dir
    work_dir="$(mktemp -d -t "lrd-rootfs-${domain}-XXXXXX")"
    
    say "Building Tier 2 MicroVM Rootfs for domain: ${GREEN}$domain${NC} (Size: ${size_mb}MB)"
    
    # 1. Base directory structure
    mkdir -p "$work_dir"/{bin,sbin,usr/bin,usr/sbin,usr/lib,usr/lib64,lib,lib64,etc,proc,sys,dev,tmp,run,root,var/log,var/run}
    chmod 1777 "$work_dir/tmp"

    # 2. Install busybox userspace
    local busybox_bin
    busybox_bin="$(command -v busybox || true)"
    [ -n "$busybox_bin" ] && [ -f "$busybox_bin" ] || die "busybox not installed on host system."
    cp "$busybox_bin" "$work_dir/bin/busybox"
    chmod 755 "$work_dir/bin/busybox"

    # Install busybox symlinks
    for applet in $($work_dir/bin/busybox --list); do
        if [ ! -e "$work_dir/bin/$applet" ] && [ ! -e "$work_dir/sbin/$applet" ] && [ ! -e "$work_dir/usr/bin/$applet" ]; then
            ln -s /bin/busybox "$work_dir/bin/$applet"
        fi
    done

    # 3. Create domain /init (PID 1 entrypoint)
    cat << 'EOF' > "$work_dir/init"
#!/bin/sh
export PATH=/bin:/sbin:/usr/bin:/usr/sbin
mount -t proc proc /proc
mount -t sysfs sysfs /sys
mount -t devtmpfs devtmpfs /dev 2>/dev/null || true
mount -t tmpfs tmpfs /tmp
mount -t tmpfs tmpfs /run

hostname "$DOMAIN_NAME"
echo "[+] MicroVM domain '$DOMAIN_NAME' booted successfully (PID 1 ready)."

if [ -f /etc/init.d/rcS ]; then
    sh /etc/init.d/rcS
fi

# Keep container / VM interactive shell alive or wait
if [ -c /dev/ttyS0 ]; then
    exec /bin/sh </dev/ttyS0 >/dev/ttyS0 2>&1
elif [ -c /dev/console ]; then
    exec /bin/sh </dev/console >/dev/console 2>&1
else
    while true; do sleep 3600; done
fi
EOF
    chmod 755 "$work_dir/init"
    mkdir -p "$work_dir/etc/init.d"

    # 4. Domain specific configuration
    if [ "$domain" = "vault" ]; then
        mkdir -p "$work_dir/vault"
        chmod 700 "$work_dir/vault"

        # Install gpg if available
        if command -v gpg >/dev/null 2>&1; then
            say "  -> Bundling isolated GnuPG binary and cryptographic dependencies into vault..."
            copy_bin_deps "$(command -v gpg)" "$work_dir"
        fi

        cat << 'EOF' > "$work_dir/etc/init.d/rcS"
#!/bin/sh
echo "[*] Initializing isolated Vault domain (zero-network policy)..."
ip link set lo up 2>/dev/null || true
echo "Vault air-gapped domain initialized."
EOF
        chmod 755 "$work_dir/etc/init.d/rcS"

    elif [ "$domain" = "tor-gateway" ]; then
        mkdir -p "$work_dir/etc/tor" "$work_dir/var/lib/tor"
        chmod 700 "$work_dir/var/lib/tor"

        if command -v tor >/dev/null 2>&1; then
            say "  -> Bundling Tor binary and dynamic dependencies into tor-gateway..."
            copy_bin_deps "$(command -v tor)" "$work_dir"
        fi

        cat << 'EOF' > "$work_dir/etc/tor/torrc"
SocksPort 0.0.0.0:9050
DNSPort 0.0.0.0:5353
DataDirectory /var/lib/tor
RunAsDaemon 0
AutomapHostsOnResolve 1
AutomapHostsSuffixes .exit,.onion
EOF

        cat << 'EOF' > "$work_dir/etc/init.d/rcS"
#!/bin/sh
echo "[*] Initializing Tor-Gateway domain..."
ip link set lo up 2>/dev/null || true
if [ -f /usr/sbin/tor ]; then
    echo "[*] Starting isolated Tor service..."
    /usr/sbin/tor -f /etc/tor/torrc > /var/log/tor.log 2>&1 &
fi
EOF
        chmod 755 "$work_dir/etc/init.d/rcS"
    else
        cat << 'EOF' > "$work_dir/etc/init.d/rcS"
#!/bin/sh
ip link set lo up 2>/dev/null || true
EOF
        chmod 755 "$work_dir/etc/init.d/rcS"
    fi

    # 5. Pack into ext4 image
    rm -f "$img_path"
    say "  -> Packing ext4 filesystem into $img_path..."
    /usr/sbin/mke2fs -q -t ext4 -d "$work_dir" -F "$img_path" "${size_mb}M"
    
    # 6. Also generate companion initramfs cpio.gz for direct kernel boot
    local initrd_path="$OUTPUT_DIR/${domain}-initramfs.cpio.gz"
    say "  -> Generating companion initramfs $initrd_path..."
    ( cd "$work_dir" && find . | cpio -H newc -o 2>/dev/null | gzip -9 > "$initrd_path" )

    # Clean up temporary work directory
    rm -rf "$work_dir"
    
    say "✔ Built domain image: $img_path ($(du -h "$img_path" | cut -f1))"
    say "✔ Built initramfs:    $initrd_path ($(du -h "$initrd_path" | cut -f1))"
}

# Main execution
TARGET="${1:-all}"
if [ "$TARGET" = "all" ]; then
    build_domain_image "vault" 32
    build_domain_image "tor-gateway" 64
else
    build_domain_image "$TARGET" "${2:-32}"
fi

say "${GREEN}${BOLD}✔ All requested Tier 2 MicroVM images successfully compiled!${NC}"
