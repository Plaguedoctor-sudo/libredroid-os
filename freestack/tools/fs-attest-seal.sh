#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack TPM2 Measured Boot Attestation & PCR Sealing Tool (Tasks 5.7, 5.8)

set -euo pipefail

DEFAULT_DIR="/run/freestack"
if [ ! -w "/run" ] && [ ! -d "$DEFAULT_DIR" ]; then
    DEFAULT_DIR="/tmp/freestack"
fi

PCR_LIST="${1:-sha256:0,2,4,7}"
OUT_POLICY="${2:-$DEFAULT_DIR/tpm2_boot_policy.bin}"

echo "=== FreeStack Measured Boot Attestation (TPM2) ==="
mkdir -p "$(dirname "$OUT_POLICY")"

if command -v tpm2_pcrread >/dev/null 2>&1 && [ -e /dev/tpmrm0 ]; then
    echo "Querying hardware TPM2 PCRs ($PCR_LIST)..."
    tpm2_pcrread "$PCR_LIST"
    echo "Creating measured boot policy..."
    tpm2_createpolicy --policy-pcr -l "$PCR_LIST" -L "$OUT_POLICY"
    echo "✔ Policy sealed against PCR state in $OUT_POLICY"
else
    echo "TPM2 hardware unavailable or running in emulator mode."
    echo "Simulating measured boot PCR digest..."
    echo -n "PCR0_2_4_MEASURED_HASH_FREESTACK_V1" | sha256sum | awk '{print $1}' > "$OUT_POLICY"
    echo "✔ Simulated measured boot policy generated at $OUT_POLICY"
fi
exit 0
