#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""
FreeStack Sovereign Permission & Consent Broker (Task 10.7)
Enforces Non-Negotiable R4 (No Telemetry) & R5 (Default Deny Egress).
Brokers hardware capability requests (camera, mic, net, storage) between sandboxed apps and kernel.
"""

import sys
import os
import json
import argparse
from typing import Dict, Any

POLICY_STORE = os.environ.get("FREESTACK_PERMISSIONS_STORE") or (
    "/etc/freestack/permissions.json" if os.access("/etc", os.W_OK)
    else os.path.expanduser("~/.config/freestack/permissions.json")
)

PERMISSIONS_MAP = {
    "camera": "Access device video capture hardware (MIPI-CSI2 / V4L2)",
    "microphone": "Access audio capture device (PipeWire source / ALSA record)",
    "network": "Access outbound network egress beyond localhost",
    "location": "Access physical GPS / GNSS / Cellular positioning",
    "storage": "Access persistent user storage directory outside sandbox",
    "keystore": "Request cryptographic key derivation or signing operation"
}

def load_policies() -> Dict[str, Any]:
    if os.path.exists(POLICY_STORE):
        try:
            with open(POLICY_STORE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_policies(policies: Dict[str, Any]):
    os.makedirs(os.path.dirname(os.path.abspath(POLICY_STORE)), exist_ok=True)
    with open(POLICY_STORE, "w") as f:
        json.dump(policies, f, indent=2)

def prompt_consent(app_id: str, permission: str) -> bool:
    desc = PERMISSIONS_MAP.get(permission, "Unknown system capability")
    print(f"\n=======================================================")
    print(f"🔒 FreeStack Sovereign Security Consent Request")
    print(f"=======================================================")
    print(f"Application : {app_id}")
    print(f"Permission  : {permission.upper()}")
    print(f"Capability  : {desc}")
    print(f"Policy Rule : Default-Deny (Non-negotiable R5)")
    print(f"-------------------------------------------------------")
    print("Options: [a] Always Allow | [o] Allow Once | [d] Deny (Default)")
    
    # If running headless or non-interactive, default to DENY
    if not sys.stdin.isatty():
        print("Non-interactive session detected: Automatically DENIED.")
        return False
        
    choice = input("Enter decision [a/o/D]: ").strip().lower()
    if choice == "a":
        pol = load_policies()
        app_pol = pol.setdefault(app_id, {})
        app_pol[permission] = "ALLOW"
        save_policies(pol)
        print("Granted: Stored permanent ALLOW policy.")
        return True
    elif choice == "o":
        print("Granted: Allowed for current execution session only.")
        return True
    else:
        print("Denied: Access blocked.")
        return False

def check_permission(app_id: str, permission: str) -> bool:
    pol = load_policies()
    decision = pol.get(app_id, {}).get(permission)
    if decision == "ALLOW":
        return True
    elif decision == "DENY":
        return False
    # If unprompted, prompt user
    return prompt_consent(app_id, permission)

def main():
    parser = argparse.ArgumentParser(description="FreeStack Permission Broker (Task 10.7)")
    parser.add_argument("--app", required=True, help="Sandboxed application identifier")
    parser.add_argument("--perm", required=True, choices=list(PERMISSIONS_MAP.keys()), help="Requested permission")
    parser.add_argument("--revoke", action="store_true", help="Revoke stored permission")
    parser.add_argument("--auto-grant", action="store_true", help="Non-interactive auto-grant for testing")
    args = parser.parse_args()

    if args.auto_grant:
        pol = load_policies()
        app_pol = pol.setdefault(args.app, {})
        app_pol[args.perm] = "ALLOW"
        save_policies(pol)
        print(f"Granted {args.perm} to {args.app}.")
        sys.exit(0)

    if args.revoke:
        pol = load_policies()
        if args.app in pol and args.perm in pol[args.app]:
            del pol[args.app][args.perm]
            save_policies(pol)
            print(f"Revoked {args.perm} for {args.app}.")
        sys.exit(0)

    allowed = check_permission(args.app, args.perm)
    sys.exit(0 if allowed else 1)

if __name__ == "__main__":
    main()
