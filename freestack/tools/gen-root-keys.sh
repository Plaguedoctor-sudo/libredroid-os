#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Offline root key ceremony. Run on an air-gapped machine.
# Produces 5 keypairs; any 3 sign a release. Never run twice for one key set.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$ROOT/tools:$PATH"

HOLDERS=(foundation-a foundation-b foundation-auditor community-a community-b)
KEYS="$ROOT/keys"
mkdir -p "$KEYS"
chmod 700 "$KEYS"

command -v minisign >/dev/null || { echo "install minisign or ensure tools/minisign is executable"; exit 1; }

echo "== FreeStack root key ceremony =="
echo "5 keypairs, threshold 3-of-5. Each passphrase typed by a different person."
echo

for h in "${HOLDERS[@]:-}"; do
  if [ -f "$KEYS/$h.key" ]; then echo "skip $h (exists)"; continue; fi
  echo "--- $h ---"
  minisign -G -p "$KEYS/$h.pub" -s "$KEYS/$h.key" -W
  chmod 600 "$KEYS/$h.key"
done

{
  echo "# FreeStack root keys — generated $(date -u +%FT%TZ)"
  echo "# threshold: 3 of 5. Any 3 sign a manifest."
  echo
  for h in "${HOLDERS[@]:-}"; do
    fp=$(grep -v '^untrusted' "$KEYS/$h.pub" | tail -n1)
    printf '%-20s %s\n' "$h" "$fp"
  done
} > "$KEYS/ROOT-KEYS.txt"

python3 - "$KEYS" <<'PY'
import json, sys, pathlib
k = pathlib.Path(sys.argv[1])
print(json.dumps({"threshold": {"m": 3, "n": 5},
                  "holders": sorted(p.stem for p in k.glob("*.pub"))},
                 indent=2), file=open(k / "threshold.json", "w"))
PY

cat > "$KEYS/ceremony.md" <<'MD'
# Key ceremony — offline procedure

## Before
1. Air-gapped machine, no network, no radios. Fresh boot.
2. Two witnesses, different organisations. Both sign the transcript.
3. Verify the `minisign` binary hash against a previously published value.
4. Blank removable media for key transfer.

## During
1. Run `tools/gen-root-keys.sh` on the air-gapped machine.
2. Each holder types their own passphrase, in view of witnesses, on their turn.
3. Read each public key fingerprint aloud. Witnesses record all five.
4. Copy `keys/<holder>.key` + `.pub` to that holder's own media, one at a time.
5. Copy `keys/*.pub`, `ROOT-KEYS.txt`, `threshold.json` to a separate media.

## After
1. Publish `keys/*.pub`, `ROOT-KEYS.txt`, `threshold.json` to the repo.
   Private keys never enter the repo.
2. Publish the ceremony transcript with both witness signatures.
3. Each holder stores their private key on hardware, ideally two copies,
   in two physical locations.
4. Destroy the air-gapped machine's copies.
5. Record the fingerprints in `docs/TRUST.md`.

## Rotation
Adding a key needs 3 existing signatures. Removing one needs 4. A key set
lives 24 months maximum, then a new ceremony and a re-signed manifest.
MD

echo
echo "done. private keys in $KEYS (chmod 600). publish only *.pub, ROOT-KEYS.txt, threshold.json."
