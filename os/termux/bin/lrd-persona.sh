#!/data/data/com.termux/files/usr/bin/bash
# lrd-persona — switch persona / active domain (vault, work, dispos, hostandroid)
set -uo pipefail
. "$HOME/.lrd/etc/lrd.env"

persona="${1:-}"

if [ -z "$persona" ]; then
  echo "Current persona state:"
  cat "$LRD_STATE/persona.json" 2>/dev/null || echo '{"active": "hostandroid"}'
  echo ""
  echo "Usage: lrd-persona <hostandroid|vault|work|dispos>"
  exit 0
fi

case "$persona" in
  hostandroid|vault|work|dispos)
    echo ":: switching persona to $persona"
    mkdir -p "$LRD_STATE"
    echo "{\"active\": \"$persona\", \"timestamp\": \"$(date -Is)\"}" > "$LRD_STATE/persona.json"
    echo ":: active persona set to $persona"
    ;;
  *)
    echo "xx unknown persona: $persona (must be one of: hostandroid, vault, work, dispos)"
    exit 1
    ;;
esac
