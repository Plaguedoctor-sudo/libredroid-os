#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# Sole source of artifact names. Source this; never hand-type a name.
lrd_version() { cat "$(git rev-parse --show-toplevel)/VERSION"; }
lrd_iso()     { printf 'libredroid-%s-%s.iso\n' "${1:-x86_64}" "$(lrd_version)"; }
lrd_img()     { printf 'libredroid-%s-%s.img\n' "$1" "$(lrd_version)"; }
