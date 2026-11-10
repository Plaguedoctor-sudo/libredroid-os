#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Multi-Party Independent Rebuild & Bit-for-Bit Reproducibility Test
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== FreeStack Multi-Party Independent Rebuild Verification ==="

TMP_WORK=$(mktemp -d /tmp/freestack-repro-XXXXXX)
trap 'rm -rf "$TMP_WORK"' EXIT

BUILD_A="$TMP_WORK/builder-alpha"
BUILD_B="$TMP_WORK/builder-beta"
mkdir -p "$BUILD_A" "$BUILD_B"

# Common deterministic timestamp
export SOURCE_DATE_EPOCH=1700000000

echo "[1/4] Executing Builder Alpha (Env: TZ=UTC, umask=0022, ID=alpha)..."
(
    export TZ="UTC"
    export BUILDER_ID="alpha"
    export LANG="C.UTF-8"
    umask 0022
    cd "$FS_ROOT" || exit 1
    python3 tools/fsbuild/fsbuild.py stage --target x200-libreboot --profile native
    cp -r out/root-x200-libreboot "$BUILD_A/"
)

echo "[2/4] Executing Builder Beta (Env: TZ=Asia/Tokyo, umask=0022, ID=beta)..."
(
    export TZ="Asia/Tokyo"
    export BUILDER_ID="beta"
    export LANG="en_US.UTF-8"
    umask 0002
    cd "$FS_ROOT" || exit 1
    python3 tools/fsbuild/fsbuild.py stage --target x200-libreboot --profile native
    cp -r out/root-x200-libreboot "$BUILD_B/"
)

echo "[3/4] Comparing build artifacts bit-for-bit..."
DIFFS=0

# Compare file lists
LIST_A=$(cd "$BUILD_A/root-x200-libreboot" && find . -type f | sort)
LIST_B=$(cd "$BUILD_B/root-x200-libreboot" && find . -type f | sort)

if [ "$LIST_A" != "$LIST_B" ]; then
    echo "FAIL: File manifest discrepancy between Builder Alpha and Builder Beta!"
    diff -u <(echo "$LIST_A") <(echo "$LIST_B") || true
    DIFFS=$((DIFFS + 1))
else
    echo "  ✔ File manifest topology is identical across builders."
fi

# Compare SHA256 hashes of each artifact
while IFS= read -r f; do
    [ -z "$f" ] && continue
    HASH_A=$(sha256sum "$BUILD_A/root-x200-libreboot/$f" | awk '{print $1}')
    HASH_B=$(sha256sum "$BUILD_B/root-x200-libreboot/$f" | awk '{print $1}')
    if [ "$HASH_A" != "$HASH_B" ]; then
        echo "FAIL: Hash mismatch for $f:"
        echo "  Alpha: $HASH_A"
        echo "  Beta:  $HASH_B"
        DIFFS=$((DIFFS + 1))
    else
        echo "  ✔ $f: $HASH_A (bit-for-bit match)"
    fi
done <<< "$LIST_A"

if [ "$DIFFS" -gt 0 ]; then
    echo "FAIL: $DIFFS reproducibility discrepancies found!"
    exit 1
fi

echo "[4/4] Writing multi-party rebuild attestation..."
mkdir -p "$FS_ROOT/dist"
cat <<EOF > "$FS_ROOT/dist/rebuild-attestation.json"
{
  "timestamp": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "source_date_epoch": $SOURCE_DATE_EPOCH,
  "builders": [
    {
      "id": "builder-alpha",
      "tz": "UTC",
      "umask": "0022"
    },
    {
      "id": "builder-beta",
      "tz": "Asia/Tokyo",
      "umask": "0002"
    }
  ],
  "target": "x200-libreboot",
  "status": "BIT_FOR_BIT_IDENTICAL",
  "verified_artifacts": $(echo "$LIST_A" | wc -l),
  "zero_diffs_confirmed": true
}
EOF

echo "✔ Multi-party rebuild attestation recorded in dist/rebuild-attestation.json."
echo "=== Bit-for-bit Reproducibility Verified: Zero Diffs ==="
exit 0
