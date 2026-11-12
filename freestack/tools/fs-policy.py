#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""FreeStack Policy Loader and Capability Validator
Validates policy/capabilities.toml against Cap'n Proto capability definitions.
"""

import sys
import os
import argparse
from pathlib import Path

try:
    import tomllib
except ImportError:
    try:
        import toml as tomllib
    except ImportError:
        tomllib = None

VALID_CAPS = {
    "net", "netDns", "netRaw", "netModem", "storage", "display", "audio",
    "audioRecord", "camera", "location", "sensors", "power", "keystore",
    "clock", "a11y", "app", "update", "perm", "infer", "agent", "ambient",
    "sync", "continuity", "caption", "translate", "emu"
}

def flatten_section(prefix, obj):
    """Flattens nested TOML tables into dotted strings (e.g. app.com.example.browser)."""
    flat = {}
    for k, v in obj.items():
        sub_key = f"{prefix}.{k}"
        if isinstance(v, dict):
            # If all values in v are lists of strings, it's a leaf mapping of cap -> scopes
            if all(isinstance(val, list) for val in v.values()):
                flat[sub_key] = v
            else:
                flat.update(flatten_section(sub_key, v))
        else:
            flat[sub_key] = v
    return flat

def load_policy(path="policy/capabilities.toml"):
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Policy file not found: {path}")
    if tomllib is None:
        raise RuntimeError("Neither tomllib nor toml python module available")
    with open(p, "rb") as f:
        raw = tomllib.load(f)

    flattened = {}
    if "app" in raw:
        flattened.update(flatten_section("app", raw["app"]))
    if "service" in raw:
        flattened.update(flatten_section("service", raw["service"]))
    for k, v in raw.items():
        if k not in ("app", "service"):
            flattened.update(flatten_section(k, v) if isinstance(v, dict) else {k: v})
    return flattened

def validate_policy(path="policy/capabilities.toml"):
    data = load_policy(path)
    errors = []
    
    for section_key, rules in data.items():
        # Validate format: app.<id> or service.<id>
        if not (section_key.startswith("app.") or section_key.startswith("service.")):
            errors.append(f"Invalid section prefix '{section_key}': must start with 'app.' or 'service.'")
            continue
        
        target_name = section_key.split(".", 1)[1]
        if not target_name:
            errors.append(f"Section '{section_key}' has empty identifier")
            continue

        if not isinstance(rules, dict):
            errors.append(f"Section '{section_key}' must be a mapping of cap -> scope list")
            continue

        for cap_name, scopes in rules.items():
            if cap_name not in VALID_CAPS:
                errors.append(f"Section '{section_key}': unrecognized capability '{cap_name}'")
            if not isinstance(scopes, list):
                errors.append(f"Section '{section_key}', cap '{cap_name}': scopes must be a list of strings")
            else:
                for scope in scopes:
                    if not isinstance(scope, str):
                        errors.append(f"Section '{section_key}', cap '{cap_name}': scope must be string, got {type(scope)}")

    if errors:
        sys.stderr.write(f"Policy validation failed for {path}:\n")
        for err in errors:
            sys.stderr.write(f"  - {err}\n")
        return False
    return True

def main():
    parser = argparse.ArgumentParser(description="FreeStack Policy Validator")
    sub = parser.add_subparsers(dest="cmd")

    p_val = sub.add_parser("validate")
    p_val.add_argument("file", nargs="?", default="policy/capabilities.toml")

    p_chk = sub.add_parser("check")
    p_chk.add_argument("subject", help="e.g. app.com.example.browser or service.fs-resolver")
    p_chk.add_argument("cap", help="Capability name, e.g. netDns")
    p_chk.add_argument("scope", nargs="?", default="*", help="Scope string")
    p_chk.add_argument("--file", default="policy/capabilities.toml")

    args = parser.parse_args()

    if args.cmd == "validate":
        ok = validate_policy(args.file)
        if ok:
            print(f"policy ok ({args.file})")
            sys.exit(0)
        sys.exit(1)

    elif args.cmd == "check":
        try:
            data = load_policy(args.file)
            section = data.get(args.subject, {})
            scopes = section.get(args.cap, [])
            if "*" in scopes or args.scope in scopes:
                print(f"ALLOWED: {args.subject} holds {args.cap} for {args.scope}")
                sys.exit(0)
            else:
                print(f"DENIED: {args.subject} does not hold {args.cap} for {args.scope}")
                sys.exit(65)
        except Exception as e:
            sys.stderr.write(f"Error: {e}\n")
            sys.exit(1)
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
