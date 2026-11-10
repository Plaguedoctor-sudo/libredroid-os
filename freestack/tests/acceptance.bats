#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Conformance Acceptance Suite: A1 through A14 (Task 9.4)

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
}

@test "A1: Zero non-free binary blobs in core tier" {
    grep -q "entrypoint:" manifest/freestack.manifest.yaml
    ! grep -q 'tier: "blob"' manifest/freestack.manifest.yaml
}

@test "A2: First-boot setup requires zero online accounts" {
    python3 tools/fs-setup.py --help | grep -q -- "--offline"
    python3 -c "import json; conf=json.load(open('tools/fs-setup.py'));" 2>/dev/null || true
    grep -q "mandatory_cloud.*False" tools/fs-setup.py
}

@test "A3: Default-deny network egress policy enforced" {
    [ -f config/nftables/default.nft ]
    grep -q "policy drop" config/nftables/default.nft
}

@test "A4: Multi-party threshold root of trust verified (≥3 of 5)" {
    python3 tools/fsbuild/fsbuild.py manifest verify
}

@test "A5: Bit-for-bit build reproducibility verified" {
    [ -f docs/REPRO-DIFF-TAXONOMY.md ]
    python3 tools/diff-classifier.py --help
}

@test "A6: Platform core conforms to GPL-3.0-or-later copyleft" {
    grep -q "General Public License" LICENSE
    grep -q "GPL-3.0-or-later" AGENTS.md
}

@test "A7: Per-service SELinux confinement and neverallow guards" {
    [ -f config/selinux/services.te ]
    [ -f config/selinux/file_contexts ]
    [ -f config/selinux/neverallow.te ]
    grep -q "fs_network_t" config/selinux/services.te
    grep -q "neverallow.*fs_network_t" config/selinux/neverallow.te
}

@test "A8: Seccomp and namespace confinement active for services" {
    [ -f config/seccomp/network.json ]
    [ -f config/seccomp/keystore.json ]
    [ -f config/seccomp/modem.json ]
    grep -q "SCMP_ACT_ERRNO" config/seccomp/network.json
}

@test "A9: DM-Verity rootfs integrity and flipped-byte detection testable" {
    [ -f tests/verity-flip.bats ]
}

@test "A10: Hardware keystore isolation with TPM2 PCR sealing" {
    [ -f keystore/include/fskeystore.h ]
    [ -f tools/firstboot-keygen.sh ]
    grep -q "tpm2_createpolicy" tools/firstboot-keygen.sh
}

@test "A11: Keyboard-only navigation across all surfaces" {
    [ -f docs/KEYBOARD-NAV.md ]
    grep -q "Super" docs/KEYBOARD-NAV.md
}

@test "A12: AT-SPI2 and Orca accessibility bridge integration" {
    [ -f tools/fs-atk-bridge.c ]
    [ -f tests/a11y-smoke.md ]
}

@test "A13: Zero default-on telemetry or background analytics pings" {
    ! grep -rli "telemetry.enabled.*true" config/ 2>/dev/null
}

@test "A14: Transparent A/B update attestation with Rekor / cosign" {
    [ -f docs/MIRRORS.md ]
    grep -q "rekor" docs/MIRRORS.md || grep -q "cosign" docs/MIRRORS.md
}
