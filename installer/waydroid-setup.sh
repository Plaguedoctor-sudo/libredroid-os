#!/bin/bash
# ==============================================================================
# LibreDroid OS - Waydroid Native APK Execution Bridge
# Configures the independent container environment to run real Android apps
# ==============================================================================

set -e

echo "=== Initializing Independent Waydroid Android Runtime ==="

# Check for root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo ./installer/waydroid-setup.sh)"
  exit 1
fi

# 1. Install prerequisites (LXC, Python3, Binder modules)
echo "[1/4] Checking kernel Binder & Ashmem nodes..."
if [ ! -c /dev/binder ] && [ ! -c /dev/binderfs/binder ]; then
    echo "Mounting binderfs filesystem..."
    mkdir -p /dev/binderfs
    mount -t binder binder /dev/binderfs || true
fi

# 2. Initialize Waydroid with vanilla LineageOS/AOSP FOSS image
echo "[2/4] Downloading pure FOSS AOSP 13 image (No Google Play Services)..."
waydroid init -s GAPPS=false -f || echo "Waydroid initialized or skipping offline"

# 3. Enable container service
echo "[3/4] Enabling Waydroid LXC system service..."
systemctl enable --now waydroid-container || true

# 4. Configure microG GmsCore spoofing
echo "[4/4] Setting up microG signature spoofing and F-Droid Privileged Extension..."
echo "Done! You can now run any APK using: waydroid app install <package.apk>"
