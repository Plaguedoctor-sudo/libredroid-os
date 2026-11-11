#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -eu

cd "$SRC/freestack/fuzz" || exit 1
make all
for b in manifest_parser_fuzz_bin keystore_ipc_fuzz_bin verity_metadata_fuzz_bin; do
    if [ -f "$b" ]; then
        cp "$b" "$OUT/"
    fi
done
