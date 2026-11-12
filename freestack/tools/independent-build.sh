#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Independent Builder Script (Builder Beta)
# Executes builds under varied environment variables and permissions.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

OUT_DIR=""
TARGET="x200-libreboot"
PROFILE="native"
ALLOW_BLOBS=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --out) OUT_DIR="$2"; shift 2 ;;
        --target) TARGET="$2"; shift 2 ;;
        --profile) PROFILE="$2"; shift 2 ;;
        --allow-blobs) ALLOW_BLOBS="--allow-blobs"; shift ;;
        *) shift ;;
    esac
done

if [ -z "$OUT_DIR" ]; then
    echo "Usage: $0 --out <dir> [--target <target>] [--profile <profile>]" >&2
    exit 1
fi

mkdir -p "$OUT_DIR"

# Hard environment variations for Builder Beta:
export TZ="Asia/Tokyo"
if locale -a 2>/dev/null | grep -qi "de_DE"; then
    export LANG="de_DE.UTF-8"
    export LC_ALL="de_DE.UTF-8"
else
    export LANG="en_GB.utf8"
    export LC_ALL="en_GB.utf8"
fi
export SOURCE_DATE_EPOCH=1700000000
umask 0077

cd "$FS_ROOT"
python3 tools/fsbuild/fsbuild.py stage --target "$TARGET" --profile "$PROFILE" $ALLOW_BLOBS

cp -a "out/root-$TARGET/." "$OUT_DIR/"
echo "✔ Independent build completed: $TARGET -> $OUT_DIR"
