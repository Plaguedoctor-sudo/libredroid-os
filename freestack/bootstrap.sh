#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
export PATH="$ROOT/tools:$PATH"

need() { command -v "$1" >/dev/null || { echo "warning: missing $1 on host system"; }; }

for t in git python3 bwrap nft minisign curl; do
  need "$t"
done

mkdir -p .store out dist keys

if [ -d .git ]; then
  mkdir -p .git/hooks
  cat > .git/hooks/pre-commit <<'HOOK'
#!/bin/sh
./tools/fsbuild/fsbuild.py schema validate || exit 1
./tools/fsbuild/fsbuild.py rules check || exit 1
HOOK
  chmod +x .git/hooks/pre-commit
fi

echo "FreeStack bootstrap complete."
echo "Next: make gen-keys && make sign && make verify"
