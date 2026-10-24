#!/bin/bash
# ==============================================================================
# install-droidian.sh — Post-install setup inside Droidian Halium rootfs
# ==============================================================================
set -euo pipefail

echo "── Setting up LibreDroid on Droidian ───────────────────────"

# Ensure runtime directories
install -d -m0755 /run/libredroid /var/lib/libredroid/domains /etc/nftables.d

# Ensure libhybris paths
export LD_LIBRARY_PATH=/usr/lib/aarch64-linux-gnu/libhybris:${LD_LIBRARY_PATH:-}

# Verify vendor gralloc and hwcomposer availability
for lib in libgralloc.mtk.so hwcomposer.mtk.so; do
  if [ -f "/vendor/lib64/$lib" ] || [ -f "/vendor/lib64/hw/$lib" ]; then
    echo "  ✓ found vendor binary: $lib"
  else
    echo "  ! warning: $lib not detected in /vendor/lib64"
  fi
done

# Enable LibreDroid services
systemctl daemon-reload
systemctl enable libredroid-bridge.service
systemctl enable libredroid-netns.service

echo "✓ Droidian adaptation ready."
