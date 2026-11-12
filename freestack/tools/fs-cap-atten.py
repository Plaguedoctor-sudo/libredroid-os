#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""FreeStack Capability Attenuation, Lease, Budget, & Manifest Enforcement Engine
Implements ADR 0001, ADR 0003, lease.capnp, agent.capnp, and infer.capnp.
"""

import sys
import os
import json
import time
import hashlib
import argparse
from pathlib import Path

# Python 3.11+ has tomllib built-in, fallback to toml if needed
try:
    import tomllib
except ImportError:
    try:
        import toml as tomllib
    except ImportError:
        tomllib = None

# Stable exit codes
EXIT_OK = 0
EXIT_USAGE = 64
EXIT_DENIED = 65       # Missing capability or widening attempt
EXIT_NOT_FOUND = 66
EXIT_UNAVAILABLE = 69  # Lease expired, uses exhausted, or budget depleted
EXIT_INTERNAL = 70

VALID_CAPS = {
    "net", "netDns", "netRaw", "netModem", "storage", "display", "audio",
    "audioRecord", "camera", "location", "sensors", "power", "keystore",
    "clock", "a11y", "app", "update", "perm", "infer", "agent", "ambient",
    "sync", "continuity", "caption", "translate", "emu"
}

class AttenuationError(Exception):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code

class CapabilityToken:
    def __init__(self, app_id, caps, lease=None, budget=None, depth=0):
        self.app_id = app_id
        self.caps = set(caps)
        self.lease = lease or {"expiresAt": 0, "uses": 0, "used": 0}
        self.budget = budget or {"kind": "tokens", "limit": 0, "spent": 0}
        self.depth = depth

    def to_dict(self):
        return {
            "app_id": self.app_id,
            "caps": sorted(list(self.caps)),
            "lease": self.lease,
            "budget": self.budget,
            "depth": self.depth
        }

    def sign_digest(self, secret=b"fs-capability-secret"):
        h = hashlib.sha256(secret)
        h.update(json.dumps(self.to_dict(), sort_keys=True).encode())
        return h.hexdigest()

    def narrow(self, requested_caps, new_lease=None, new_budget=None):
        """Monotonic narrowing: child capability set must be subset of parent."""
        req_set = set(requested_caps)
        # 1. Monotonicity check: cannot widen
        widened = req_set - self.caps
        if widened:
            raise AttenuationError(
                EXIT_DENIED,
                f"Attenuation violation: attempted to widen capability set with: {sorted(list(widened))}"
            )

        # 2. Lease narrowing check
        child_lease = dict(self.lease)
        if new_lease:
            # Expiry can only become earlier (stricter)
            if self.lease["expiresAt"] > 0:
                if new_lease.get("expiresAt", 0) == 0 or new_lease["expiresAt"] > self.lease["expiresAt"]:
                    raise AttenuationError(EXIT_DENIED, "Lease expiry cannot exceed parent lease expiry")
            if "expiresAt" in new_lease:
                child_lease["expiresAt"] = new_lease["expiresAt"]

            # Uses can only decrease
            if self.lease["uses"] > 0:
                remaining_parent_uses = max(0, self.lease["uses"] - self.lease["used"])
                if new_lease.get("uses", 0) == 0 or new_lease["uses"] > remaining_parent_uses:
                    raise AttenuationError(EXIT_DENIED, "Lease uses cannot exceed parent remaining uses")
            if "uses" in new_lease:
                child_lease["uses"] = new_lease["uses"]
                child_lease["used"] = 0

        # 3. Budget narrowing check
        child_budget = dict(self.budget)
        if new_budget:
            kind = new_budget.get("kind", self.budget["kind"])
            if kind != self.budget["kind"]:
                raise AttenuationError(EXIT_DENIED, f"Cannot alter budget kind {self.budget['kind']} to {kind}")
            parent_rem = max(0, self.budget["limit"] - self.budget["spent"]) if self.budget["limit"] > 0 else 0
            if self.budget["limit"] > 0:
                if new_budget.get("limit", 0) == 0 or new_budget["limit"] > parent_rem:
                    raise AttenuationError(EXIT_DENIED, "Child budget limit cannot exceed parent remaining budget")
            if "limit" in new_budget:
                child_budget["limit"] = new_budget["limit"]
                child_budget["spent"] = 0

        # 4. Agent depth check: max depth is 2
        child_depth = self.depth + 1
        if child_depth > 2:
            raise AttenuationError(EXIT_DENIED, f"Agent delegation depth limit exceeded: {child_depth} > 2")

        return CapabilityToken(self.app_id, req_set, child_lease, child_budget, child_depth)

    def consume_use(self):
        """Verifies and increments lease usage."""
        now = int(time.time())
        if self.lease["expiresAt"] > 0 and now > self.lease["expiresAt"]:
            raise AttenuationError(EXIT_UNAVAILABLE, "Capability lease has expired")
        if self.lease["uses"] > 0 and self.lease["used"] >= self.lease["uses"]:
            raise AttenuationError(EXIT_UNAVAILABLE, "Capability lease use count exhausted")
        self.lease["used"] += 1

    def spend_budget(self, amount):
        """Meters usage against the allocated budget."""
        if self.budget["limit"] > 0:
            if self.budget["spent"] + amount > self.budget["limit"]:
                raise AttenuationError(
                    EXIT_UNAVAILABLE,
                    f"Budget exhausted ({self.budget['kind']}): spent {self.budget['spent'] + amount} > limit {self.budget['limit']}"
                )
            self.budget["spent"] += amount

def compute_confirm_digest(action_verb, args_dict):
    """Computes deterministic digest for human confirmation binding."""
    payload = json.dumps({"verb": action_verb, "args": args_dict}, sort_keys=True).encode()
    return hashlib.sha256(payload).hexdigest()

def validate_app_manifest(toml_path):
    """Statically verifies app.toml declarations and effects."""
    if not os.path.exists(toml_path):
        raise AttenuationError(EXIT_NOT_FOUND, f"Manifest file not found: {toml_path}")
    
    with open(toml_path, "rb") as f:
        data = tomllib.load(f)

    app_id = data.get("id")
    if not app_id:
        raise AttenuationError(EXIT_USAGE, "app.toml missing mandatory 'id'")

    requires = data.get("requires", {})
    effects = data.get("effects", {})

    # Check validity of requested capabilities
    for cap in requires.keys():
        if cap not in VALID_CAPS:
            raise AttenuationError(EXIT_DENIED, f"Unrecognized capability class requested: {cap}")

    # Static verification of net isolation
    if effects.get("net") is False:
        if "net" in requires or "netRaw" in requires:
            raise AttenuationError(
                EXIT_DENIED,
                f"Contradiction: app specifies effects.net = false but requests network capability"
            )

    return {
        "status": "VALID",
        "app_id": app_id,
        "declared_caps": list(requires.keys()),
        "net_isolated": (effects.get("net") is False),
        "effects": effects
    }

def main():
    parser = argparse.ArgumentParser(description="FreeStack Capability Attenuation & Manifest Validator")
    subparsers = parser.add_subparsers(dest="cmd")

    # validate-manifest
    p_val = subparsers.add_parser("validate-manifest")
    p_val.add_argument("manifest_file")

    # narrow
    p_nar = subparsers.add_parser("narrow")
    p_nar.add_argument("--parent-caps", required=True, help="Comma-separated parent capabilities")
    p_nar.add_argument("--req-caps", required=True, help="Comma-separated requested capabilities")
    p_nar.add_argument("--parent-budget", type=int, default=1000)
    p_nar.add_argument("--child-budget", type=int, default=500)
    p_nar.add_argument("--depth", type=int, default=0)

    # confirm-digest
    p_conf = subparsers.add_parser("confirm-digest")
    p_conf.add_argument("--verb", required=True)
    p_conf.add_argument("--args", required=True)

    args = parser.parse_args()

    if args.cmd == "validate-manifest":
        try:
            res = validate_app_manifest(args.manifest_file)
            print(json.dumps(res, indent=2))
            sys.exit(EXIT_OK)
        except AttenuationError as e:
            sys.stderr.write(f"Validation Error: {e}\n")
            sys.exit(e.code)

    elif args.cmd == "narrow":
        try:
            p_caps = [c.strip() for c in args.parent_caps.split(",") if c.strip()]
            r_caps = [c.strip() for c in args.req_caps.split(",") if c.strip()]
            parent_tok = CapabilityToken("parent", p_caps, budget={"kind": "tokens", "limit": args.parent_budget, "spent": 0}, depth=args.depth)
            child_tok = parent_tok.narrow(r_caps, new_budget={"kind": "tokens", "limit": args.child_budget})
            print(json.dumps(child_tok.to_dict(), indent=2))
            sys.exit(EXIT_OK)
        except AttenuationError as e:
            sys.stderr.write(f"Attenuation Error: {e}\n")
            sys.exit(e.code)

    elif args.cmd == "confirm-digest":
        try:
            parsed_args = json.loads(args.args)
            digest = compute_confirm_digest(args.verb, parsed_args)
            print(json.dumps({"verb": args.verb, "digest": digest}, indent=2))
            sys.exit(EXIT_OK)
        except Exception as e:
            sys.stderr.write(f"Error: {e}\n")
            sys.exit(EXIT_USAGE)

    else:
        parser.print_help()
        sys.exit(EXIT_USAGE)

if __name__ == "__main__":
    main()
