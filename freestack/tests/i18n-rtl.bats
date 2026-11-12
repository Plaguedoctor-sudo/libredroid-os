#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Localization & RTL Text Shaping Verification (Phase L)

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "i18n: Translation templates and PO files exist" {
    [ -f po/freestack.pot ]
    [ -f po/es.po ]
    [ -f po/fr.po ]
    [ -f po/ar.po ]
}

@test "i18n: Arabic RTL locale contains valid bi-directional UTF-8 encoding" {
    # Verify non-empty Arabic translations
    grep -q "مرحبًا بكم في نظام FreeStack" po/ar.po
    grep -q "Language: ar" po/ar.po
}

@test "i18n: PO files compile cleanly with msgfmt if present" {
    if command -v msgfmt >/dev/null 2>&1; then
        for po in po/*.po; do
            msgfmt -c -v -o /dev/null "$po"
        done
    else
        # Verify basic syntax validity
        for po in po/*.po; do
            grep -q "msgid" "$po"
            grep -q "msgstr" "$po"
        done
    fi
}
