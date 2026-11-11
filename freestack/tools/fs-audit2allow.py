#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""
FreeStack AVC Denial -> Rule Generator & Policy Auditor (Task 1.4)
Audits raw audit2allow output against FreeStack neverallow rules, rejects over-grants,
and enforces principle of least privilege.
"""

import sys
import re
import argparse
from pathlib import Path

DANGEROUS_PERMS = {
    "sys_admin", "setuid", "setgid", "sys_rawio", "sys_ptrace",
    "dac_override", "dac_read_search", "mknod", "mac_admin"
}

DANGEROUS_TYPES = {
    "device_t", "kmem_device_t", "raw_disk_t", "shadow_t", "root_t"
}

def audit_avc_rule(rule: str) -> tuple[bool, str]:
    rule = rule.strip()
    if not rule or rule.startswith("#"):
        return True, "comment/blank"
    
    # parse 'allow <scontext> <tcontext>:<class> { <perms> };'
    m = re.match(r'allow\s+([^\s]+)\s+([^\s]+):([^\s]+)\s+\{\s*([^}]+)\s*\};', rule)
    if not m:
        return True, "unparsed-non-allow"
        
    src, target, cls, perms_str = m.groups()
    perms = set(perms_str.split())

    # Check against dangerous capabilities & permissions
    overlap_perms = perms.intersection(DANGEROUS_PERMS)
    if overlap_perms:
        return False, f"Rule grants dangerous permissions: {overlap_perms} to {src}"

    # Check against forbidden target types
    if target in DANGEROUS_TYPES:
        return False, f"Rule grants access to protected system type: {target}"

    # Check if target is another domain without IPC mediation
    if target.endswith("_t") and src != target and "process" in cls:
        if not ("sigchld" in perms or "signal" in perms):
            return False, f"Cross-domain process interaction disallowed: {src} -> {target}"

    return True, "OK"

def main():
    parser = argparse.ArgumentParser(description="FreeStack Audit2Allow Safety Reviewer")
    parser.add_argument("--input", "-i", type=str, help="AVC log or generated TE file")
    parser.add_argument("--output", "-o", type=str, help="Cleaned and verified TE file")
    parser.add_argument("--check-rule", type=str, help="Test a single rule string")
    args = parser.parse_args()

    if args.check_rule:
        safe, reason = audit_avc_rule(args.check_rule)
        print(f"Safety: {'PASS' if safe else 'FAIL'} ({reason})")
        sys.exit(0 if safe else 1)

    if not args.input:
        print("FreeStack fs-audit2allow safety validator ready.")
        sys.exit(0)

    in_path = Path(args.input)
    if not in_path.exists():
        print(f"Error: {in_path} not found", file=sys.stderr)
        sys.exit(1)

    rules = in_path.read_text().splitlines()
    accepted = []
    rejected = []

    for r in rules:
        safe, reason = audit_avc_rule(r)
        if safe:
            accepted.append(r)
        else:
            rejected.append((r, reason))

    print(f"Audit Result: {len(accepted)} accepted, {len(rejected)} rejected.")
    for r, reason in rejected:
        print(f"  REJECTED: {r} -> {reason}")

    if args.output:
        out_path = Path(args.output)
        out_path.write_text("\n".join(accepted) + "\n")
        print(f"Wrote validated policy to {out_path}")

    sys.exit(0 if len(rejected) == 0 else 2)

if __name__ == "__main__":
    main()
