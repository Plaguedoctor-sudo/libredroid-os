#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""
FreeStack Multi-Party Independent Builder Attestation Generator (Task 7.6)
Generates and verifies cryptographic build attestations across independent organizations.
"""

import sys
import os
import json
import hashlib
import time
import argparse
from pathlib import Path

def compute_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def collect_tree_hashes(root_dir: str) -> dict:
    results = {}
    p = Path(root_dir)
    for f in sorted(p.rglob("*")):
        if f.is_file():
            rel = str(f.relative_to(p))
            results[rel] = compute_sha256(str(f))
    return results

def create_attestation(builder_id: str, org: str, root_dir: str, target: str) -> dict:
    tree = collect_tree_hashes(root_dir)
    combined = hashlib.sha256()
    for rel_path in sorted(tree.keys()):
        combined.update(f"{rel_path}:{tree[rel_path]}\n".encode("utf-8"))
    
    root_hash = combined.hexdigest()
    
    attestation = {
        "schema_version": "1.0.0",
        "type": "https://freestack.org/attestation/reproducible-build/v1",
        "builder": {
            "id": builder_id,
            "organization": org,
            "timestamp": int(time.time()),
            "uname": os.uname().sysname + " " + os.uname().machine,
        },
        "subject": {
            "target": target,
            "root_tree_hash": root_hash,
            "artifact_count": len(tree),
            "artifacts": tree
        }
    }
    return attestation

def verify_attestations(attestations: list) -> bool:
    if len(attestations) < 2:
        print("Error: Minimum of 2 independent builder attestations required for consensus.")
        return False
        
    reference = attestations[0]["subject"]["root_tree_hash"]
    mismatches = 0
    
    print(f"Verifying {len(attestations)} independent builder attestations against reference hash: {reference}")
    for idx, att in enumerate(attestations):
        b = att["builder"]
        th = att["subject"]["root_tree_hash"]
        if th != reference:
            print(f"❌ Builder #{idx+1} ({b['id']} @ {b['organization']}) DIVERGED: {th}")
            mismatches += 1
        else:
            print(f"✔ Builder #{idx+1} ({b['id']} @ {b['organization']}) MATCHED (Bit-for-Bit)")
            
    if mismatches > 0:
        print(f"\nConsensus FAILED: {mismatches} builder(s) produced divergent output.")
        return False
        
    print("\nConsensus PASSED: Multi-party independent reproducibility verified.")
    return True

def main():
    parser = argparse.ArgumentParser(description="FreeStack Independent Builder Attestation Generator (Task 7.6)")
    sub = parser.add_subparsers(dest="cmd", required=True)
    
    gen = sub.add_parser("create")
    gen.add_argument("--builder-id", required=True, help="Unique ID for builder node")
    gen.add_argument("--org", required=True, help="Independent organization name")
    gen.add_argument("--dir", required=True, help="Path to staged build output")
    gen.add_argument("--target", default="x200-libreboot", help="Target architecture")
    gen.add_argument("--out", required=True, help="Output attestation JSON path")
    
    ver = sub.add_parser("verify")
    ver.add_argument("attestation_files", nargs="+", help="JSON attestation files to compare")
    
    args = parser.parse_args()
    
    if args.cmd == "create":
        att = create_attestation(args.builder_id, args.org, args.dir, args.target)
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        with open(args.out, "w") as f:
            json.dump(att, f, indent=2)
        print(f"Attestation generated: {args.out} (Tree Root: {att['subject']['root_tree_hash']})")
    elif args.cmd == "verify":
        loaded = []
        for f in args.attestation_files:
            with open(f, "r") as fp:
                loaded.append(json.load(fp))
        ok = verify_attestations(loaded)
        sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
