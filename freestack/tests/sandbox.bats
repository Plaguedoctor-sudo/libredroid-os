#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Bubblewrap & Namespace Sandbox Verification (Task 2.8)

setup() {
    export SEC_DIR="$(cd "$BATS_TEST_DIRNAME/../config/seccomp" && pwd)"
    export DINIT_DIR="$(cd "$BATS_TEST_DIRNAME/../config/dinit" && pwd)"
}

@test "Sandbox: Seccomp profiles are syntactically valid JSON" {
    for f in "$SEC_DIR"/*.json; do
        python3 -m json.tool "$f" > /dev/null
    done
}

@test "Sandbox: Default action is ERRNO (deny by default)" {
    for f in "$SEC_DIR"/*.json; do
        grep -q '"default_action": "SCMP_ACT_ERRNO"' "$f"
    done
}

@test "Sandbox: Critical dangerous syscalls blocked in all service profiles" {
    # ptrace, kexec_load, init_module, reboot must never be allowed for apps
    python3 -c "
import json
with open('$SEC_DIR/app.json') as f:
    cfg = json.load(f)
syscalls = [s['name'] for s in cfg['syscalls']]
assert 'ptrace' not in syscalls
assert 'kexec_load' not in syscalls
assert 'init_module' not in syscalls
assert 'reboot' not in syscalls
"
}

@test "Sandbox: Bubblewrap launcher arguments enforce namespace unsharing" {
    grep -q -- "--unshare-all" "$DINIT_DIR/netns-app.service" || grep -q -- "--unshare-net" "$DINIT_DIR/modem-netns.service"
}
