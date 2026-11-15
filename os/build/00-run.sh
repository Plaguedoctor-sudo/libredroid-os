#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Re-exec the pipeline inside a single uid namespace so every step sees the
# same ownership and mksquashfs can read root-only paths.
set -euo pipefail
if [ "${LRD_IN_NS:-}" = 1 ]; then exec "$@"; fi
export LRD_IN_NS=1
exec unshare --map-auto --map-root-user --mount --pid --fork "$@"
