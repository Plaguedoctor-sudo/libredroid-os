#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later
# FreeStack Capability Attenuation, Lease, Budget & Manifest Tests

setup() {
    export FS_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
    cd "$FS_ROOT"
    export PATH="$FS_ROOT/tools:$PATH"
    export PYTHONPATH="$FS_ROOT:$PYTHONPATH"
    refute() {
        if "$@"; then
            echo "refute failed: command succeeded unexpectedly: $*" >&2
            return 1
        fi
        return 0
    }
}

@test "CapAtten: Monotonic narrowing succeeds for valid subset" {
    run python3 tools/fs-cap-atten.py narrow --parent-caps "infer,storage,translate" --req-caps "infer,storage"
    [ "$status" -eq 0 ]
    [[ "$output" =~ "infer" ]]
    [[ "$output" =~ "storage" ]]
    refute [[ "$output" =~ "translate" ]]
}

@test "CapAtten: Widening capability set is strictly denied with exit 65" {
    run python3 tools/fs-cap-atten.py narrow --parent-caps "infer,storage" --req-caps "infer,storage,net"
    [ "$status" -eq 65 ]
    refute [ "$status" -eq 0 ]
    [[ "$output" =~ "attempted to widen capability set" ]]
}

@test "CapAtten: Agent delegation depth exceeding 2 is strictly denied with exit 65" {
    run python3 tools/fs-cap-atten.py narrow --parent-caps "infer,storage" --req-caps "infer" --depth 2
    [ "$status" -eq 65 ]
    refute [ "$status" -eq 0 ]
    [[ "$output" =~ "Agent delegation depth limit exceeded" ]]
}

@test "CapAtten: Valid declarative app.toml passes static verification" {
    run python3 tools/fs-cap-atten.py validate-manifest tests/fixtures/app.toml
    [ "$status" -eq 0 ]
    [[ "$output" =~ "com.example.translate" ]]
    [[ "$output" =~ '"net_isolated": true' ]]
}

@test "CapAtten: App contradicting net=false with net requirement is rejected" {
    run python3 tools/fs-cap-atten.py validate-manifest tests/fixtures/app_invalid_net.toml
    [ "$status" -eq 65 ]
    refute [ "$status" -eq 0 ]
    [[ "$output" =~ "Contradiction: app specifies effects.net = false" ]]
}

@test "CapAtten: Confirm digest binds exact action parameters deterministically" {
    run python3 tools/fs-cap-atten.py confirm-digest --verb "pay.authorize" --args '{"amount": 50, "merchant": "store"}'
    [ "$status" -eq 0 ]
    [[ "$output" =~ "digest" ]]
    
    # Negative assertion: perturbed args yield different digest
    DIGEST1=$(python3 -c "import json; print(json.loads('''$output''')['digest'])")
    run python3 tools/fs-cap-atten.py confirm-digest --verb "pay.authorize" --args '{"amount": 51, "merchant": "store"}'
    DIGEST2=$(python3 -c "import json; print(json.loads('''$output''')['digest'])")
    [ "$DIGEST1" != "$DIGEST2" ]
    refute [ "$DIGEST1" = "$DIGEST2" ]
}

@test "CapAtten: Budget exhaustion triggers exit code 69" {
    run python3 -c '
from tools.fs_cap_atten import CapabilityToken, AttenuationError, EXIT_UNAVAILABLE
import sys

t = CapabilityToken("test", ["infer"], budget={"kind": "tokens", "limit": 100, "spent": 90})
try:
    t.spend_budget(20)  # 90 + 20 = 110 > 100
    sys.exit(0)
except AttenuationError as e:
    sys.exit(e.code)
'
    [ "$status" -eq 69 ]
    refute [ "$status" -eq 0 ]
}

@test "CapAtten: Lease expiration triggers exit code 69" {
    run python3 -c '
from tools.fs_cap_atten import CapabilityToken, AttenuationError, EXIT_UNAVAILABLE
import sys, time

# Expired 10 seconds ago
t = CapabilityToken("test", ["infer"], lease={"expiresAt": int(time.time()) - 10, "uses": 0, "used": 0})
try:
    t.consume_use()
    sys.exit(0)
except AttenuationError as e:
    sys.exit(e.code)
'
    [ "$status" -eq 69 ]
    refute [ "$status" -eq 0 ]
}

@test "CapAtten: Lease use count exhaustion triggers exit code 69" {
    run python3 -c '
from tools.fs_cap_atten import CapabilityToken, AttenuationError, EXIT_UNAVAILABLE
import sys

# Uses = 1, already used = 1
t = CapabilityToken("test", ["infer"], lease={"expiresAt": 0, "uses": 1, "used": 1})
try:
    t.consume_use()
    sys.exit(0)
except AttenuationError as e:
    sys.exit(e.code)
'
    [ "$status" -eq 69 ]
    refute [ "$status" -eq 0 ]
}
