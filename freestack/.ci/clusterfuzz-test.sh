#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== ClusterFuzzLite Local Verification ==="
cd "$FS_ROOT/fuzz" || exit 1
make all
echo "✔ Harnesses built and validated for ClusterFuzzLite."
