#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Collects m-of-n minisign signatures into a multi-signature manifest file.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$ROOT/tools:$PATH"

MAN="$ROOT/manifest/freestack.manifest.yaml"
SIG="$MAN.sig"
THRESH="${2:-3}"
[ "${1:-}" = "--threshold" ] && THRESH="${2:-3}"

HOLDERS=($(python3 -c "import yaml;print(' '.join(k['holder'] for k in yaml.safe_load(open('$MAN'))['trust']['root_keys']))"))
: > "$SIG.tmp"
got=0
for h in "${HOLDERS[@]:-}"; do
  [ "$got" -ge "$THRESH" ] && break
  key="$ROOT/keys/$h.key"
  [ -f "$key" ] || { echo "skip $h (no key here)"; continue; }
  echo "--- signing as $h ---"
  minisign -Sm "$MAN" -s "$key" -x "/tmp/.fs_$h.minisig"
  { echo "# holder=$h"; cat "/tmp/.fs_$h.minisig"; } >> "$SIG.tmp"
  rm -f "/tmp/.fs_$h.minisig"
  got=$((got+1))
done

if [ "$got" -lt "$THRESH" ]; then
  echo "only $got/$THRESH signatures"
  exit 41
fi

mv "$SIG.tmp" "$SIG"
echo "wrote $SIG with $got signatures"
"$ROOT/tools/fsbuild/fsbuild.py" manifest verify
