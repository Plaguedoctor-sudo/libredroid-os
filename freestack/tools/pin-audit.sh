#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Dry run: does every pin resolve? Writes nothing, touches no store.
set -euo pipefail
exec "$(cd "$(dirname "$0")/.." && pwd)/tools/fsbuild/fsbuild.py" pin-audit
