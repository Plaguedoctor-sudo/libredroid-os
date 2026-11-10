#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack SDK Sysroot Assembler & Packager (Task 13.6)

set -euo pipefail

SDK_DIR="$(cd "$(dirname "$0")" && pwd)"
FS_ROOT="$(cd "$SDK_DIR/.." && pwd)"
SYSROOT="$SDK_DIR/sysroot"

echo "=== Assembling FreeStack SDK Sysroot ==="

mkdir -p "$SYSROOT/usr/include"
mkdir -p "$SYSROOT/usr/lib/pkgconfig"
mkdir -p "$SYSROOT/usr/share/pkgconfig"

# 1. Install fskeystore headers and library
if [ -f "$FS_ROOT/keystore/include/fskeystore.h" ]; then
    cp -v "$FS_ROOT/keystore/include/fskeystore.h" "$SYSROOT/usr/include/"
fi

if [ -f "$FS_ROOT/keystore/libfskeystore.a" ]; then
    cp -v "$FS_ROOT/keystore/libfskeystore.a" "$SYSROOT/usr/lib/"
else
    # Build it if missing
    make -C "$FS_ROOT/keystore" libfskeystore.a
    cp -v "$FS_ROOT/keystore/libfskeystore.a" "$SYSROOT/usr/lib/"
fi

# 2. Generate pkg-config metadata for libfskeystore
cat <<'EOF' > "$SYSROOT/usr/lib/pkgconfig/libfskeystore.pc"
prefix=/usr
exec_prefix=${prefix}
libdir=${exec_prefix}/lib
includedir=${prefix}/include

Name: libfskeystore
Description: FreeStack Sovereign Hardware Keystore & Attestation Client Library
Version: 1.0.0
Libs: -L${libdir} -lfskeystore
Cflags: -I${includedir}
EOF

# 3. Generate generic freestack-1.0.pc
cat <<'EOF' > "$SYSROOT/usr/lib/pkgconfig/freestack-1.0.pc"
prefix=/usr
exec_prefix=${prefix}
libdir=${exec_prefix}/lib
includedir=${prefix}/include

Name: freestack
Description: FreeStack Sovereign Platform Core SDK
Version: 1.0.0
Requires: libfskeystore
Cflags: -I${includedir}
EOF

echo "✔ FreeStack Sysroot successfully assembled at: $SYSROOT"
