#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Mirror Diversity & Fetch-Back Verification (Task 8.6)

setup() {
    export DOCS_DIR="$(cd "$BATS_TEST_DIRNAME/../docs" && pwd)"
}

@test "Mirrors: Policy document exists and defines 3 distinct transports" {
    [ -f "$DOCS_DIR/MIRRORS.md" ]
    grep -q "Rsync mirrors" "$DOCS_DIR/MIRRORS.md"
    grep -q "Tor v3 Hidden Service" "$DOCS_DIR/MIRRORS.md"
    grep -q "IPFS" "$DOCS_DIR/MIRRORS.md"
}

@test "Mirrors: Threshold signing and transparency log verification documented" {
    grep -q "cosign verify-blob" "$DOCS_DIR/MIRRORS.md"
    grep -q "rekor-cli get" "$DOCS_DIR/MIRRORS.md"
}
