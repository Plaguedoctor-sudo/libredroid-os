#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack SDK Environment Setup (Task 13.6)

SDK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export FREESTACK_SDK_ROOT="$SDK_DIR"
export FREESTACK_SYSROOT="$SDK_DIR/sysroot"

# Point pkg-config to sysroot
export PKG_CONFIG_DIR=""
export PKG_CONFIG_LIBDIR="$FREESTACK_SYSROOT/usr/lib/pkgconfig:$FREESTACK_SYSROOT/usr/share/pkgconfig"
export PKG_CONFIG_SYSROOT_DIR="$FREESTACK_SYSROOT"

# Default compilation flags enforcing security and reproducibility
export CFLAGS="-O2 -pipe -fstack-protector-strong -D_FORTIFY_SOURCE=2 -fPIE -I$FREESTACK_SYSROOT/usr/include"
export CXXFLAGS="$CFLAGS"
export LDFLAGS="-Wl,-z,relro,-z,now -pie -L$FREESTACK_SYSROOT/usr/lib"
export SOURCE_DATE_EPOCH=1700000000

echo "✔ FreeStack SDK v1.0.0 environment active."
echo "  FREESTACK_SDK_ROOT : $FREESTACK_SDK_ROOT"
echo "  FREESTACK_SYSROOT  : $FREESTACK_SYSROOT"
