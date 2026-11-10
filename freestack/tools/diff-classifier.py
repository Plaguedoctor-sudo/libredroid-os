#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""
FreeStack Reproducible Build Diff Classifier (Task 7.7)
Classifies binary differences between independent builds into P1-P4 taxonomy:
  P1: Harmless container/packaging metadata (file ordering, tar/cpio header padding)
  P2: Timestamps, dates, and build epoch leakage (SOURCE_DATE_EPOCH, __DATE__, __TIME__)
  P3: Build environment paths, umask, user/group IDs (-fdebug-prefix-map, filesystem layout)
  P4: Compiler non-determinism, unstable AST/hash iteration, uninitialized padding, ASLR seeds
"""

import sys
import os
import re
import json
import argparse
from typing import Dict, List, Any, Tuple

# Severity levels according to FreeStack Reproducibility Standard
TAXONOMY = {
    "P1": {
        "name": "Metadata / Packaging",
        "description": "Archive member order, tar padding, or file mode quirks. Zero impact on binary execution.",
        "remediation": "Enforce deterministic sorting in packaging scripts, use tar --sort=name --mtime, or disorderfs."
    },
    "P2": {
        "name": "Timestamp / Epoch Leak",
        "description": "Embedded build timestamps, __DATE__, __TIME__, or missing SOURCE_DATE_EPOCH normalization.",
        "remediation": "Export SOURCE_DATE_EPOCH, inject -Werror=date-time, or strip-nondeterminism."
    },
    "P3": {
        "name": "Path / Environment Leak",
        "description": "Embedded source directory path, compiler flags, username, hostname, or umask differences.",
        "remediation": "Apply -ffile-prefix-map / -fdebug-prefix-map, standardize umask (0022), sanitize build env."
    },
    "P4": {
        "name": "Non-Deterministic Codegen / Bytecode",
        "description": "Unstable symbol order, hash-map iteration in compiler frontends, memory address leaks in LTO, or random salts.",
        "remediation": "Pin compiler flags (-frandom-seed, -fno-guess-branch-probability), audit compiler AST walkers."
    }
}

PATTERNS = [
    # P2: Timestamps
    (r"(timestamp|date|time|build_time|built_at|SOURCE_DATE_EPOCH|GMT|UTC|20[2-3][0-9]-[0-1][0-9]-[0-3][0-9])", "P2", "Embedded date/time string or timestamp field"),
    (r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+20\d{2}\b", "P2", "__DATE__ macro expansion detected"),

    # P3: Paths & Host environment
    (r"(/home/|/build/|/tmp/|/root/|/usr/src/|/var/tmp/|builder-[a-z0-9_-]+)", "P3", "Build directory or absolute filesystem path leaked into binary"),
    (r"(umask|mode\s+0[0-7]{3}|uid\s+\d+|gid\s+\d+|user\s+[a-zA-Z0-9_-]+)", "P3", "Filesystem permission, umask, or user/group ownership discrepancy"),
    (r"hostname|nodename|domainname", "P3", "Build host hostname leakage"),

    # P1: Archive & Container metadata
    (r"(tar\s+header|file\s+list\s+order|zip\s+central\s+directory|ar\s+header)", "P1", "Container packaging or member ordering divergence"),
    (r"\.tar|\.cpio|\.ar|\.zip", "P1", "Archive format structural variation"),

    # P4: Codegen / compiler
    (r"(\.text|\.rodata|\.data|\.dynsym|\.symtab|\.debug_info|\.rela\.text)", "P4", "ELF section content or symbol table divergence"),
    (r"(DWARF|debug_abbrev|debug_str|debug_line|relocation)", "P4", "Debug symbol non-determinism or unstable compiler AST output")
]

def classify_diff_text(diff_text: str, filename: str = "") -> Tuple[str, str, str]:
    """Matches text against classification rules and returns (severity, category, rationale)."""
    for regex, level, explanation in PATTERNS:
        if re.search(regex, diff_text, re.IGNORECASE):
            return level, TAXONOMY[level]["name"], f"{explanation}: matched '{regex}'"
    
    # Default fallback
    if filename.endswith((".a", ".so", ".o", ".rom", "bin")):
        return "P4", TAXONOMY["P4"]["name"], "Direct binary executable/library mismatch without recognizable text signature (assumed codegen/LTO discrepancy)"
    return "P1", TAXONOMY["P1"]["name"], "Generic structural metadata discrepancy"

def analyze_diffoscope_json(diff_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Analyzes a Diffoscope JSON object or list of diffs."""
    findings = []
    
    def walk(node: Dict[str, Any], path: str = ""):
        src = node.get("source1", "") or node.get("source", path)
        curr_path = f"{path} -> {src}" if path else src
        
        # Check comments / unified_diff
        comments = node.get("comments", [])
        unified_diff = node.get("unified_diff", "")
        
        combined_text = "\n".join(comments) + "\n" + (unified_diff if isinstance(unified_diff, str) else "")
        if combined_text.strip():
            level, name, rationale = classify_diff_text(combined_text, curr_path)
            findings.append({
                "target": curr_path,
                "classification": level,
                "category": name,
                "rationale": rationale,
                "remediation": TAXONOMY[level]["remediation"],
                "snippet": combined_text[:300].strip()
            })
            
        for detail in node.get("details", []):
            walk(detail, curr_path)
            
    if isinstance(diff_data, dict):
        walk(diff_data)
    elif isinstance(diff_data, list):
        for item in diff_data:
            if isinstance(item, dict):
                walk(item)
    return findings

def compare_raw_files(file_a: str, file_b: str) -> Dict[str, Any]:
    """Compares two files directly if diffoscope is not installed."""
    if not os.path.exists(file_a) or not os.path.exists(file_b):
        return {"error": f"File not found: {file_a} or {file_b}"}
        
    size_a = os.path.getsize(file_a)
    size_b = os.path.getsize(file_b)
    
    with open(file_a, "rb") as fa, open(file_b, "rb") as fb:
        bytes_a = fa.read()
        bytes_b = fb.read()
        
    if bytes_a == bytes_b:
        return {"status": "IDENTICAL", "classification": "NONE"}
        
    # Analyze string differences in binary
    str_a = set(re.findall(rb"[\x20-\x7e]{4,}", bytes_a))
    str_b = set(re.findall(rb"[\x20-\x7e]{4,}", bytes_b))
    
    only_a = [s.decode("latin1") for s in list(str_a - str_b)[:20]]
    only_b = [s.decode("latin1") for s in list(str_b - str_a)[:20]]
    diff_sample = "\n".join(only_a + only_b)
    
    level, name, rationale = classify_diff_text(diff_sample, file_a)
    
    return {
        "status": "DIVERGENT",
        "file_a": file_a,
        "file_b": file_b,
        "size_a": size_a,
        "size_b": size_b,
        "classification": level,
        "category": name,
        "rationale": rationale,
        "remediation": TAXONOMY[level]["remediation"],
        "sample_diff_strings": only_a[:5] + only_b[:5]
    }

def main():
    parser = argparse.ArgumentParser(description="FreeStack Reproducible Build Diff Classifier (Task 7.7)")
    parser.add_argument("--diffoscope-json", help="Path to diffoscope JSON output file")
    parser.add_argument("--file-a", help="First binary file to compare")
    parser.add_argument("--file-b", help="Second binary file to compare")
    parser.add_argument("--out", help="Output path for classification JSON report")
    args = parser.parse_args()

    results = []

    if args.diffoscope_json:
        if not os.path.exists(args.diffoscope_json):
            print(f"Error: {args.diffoscope_json} not found", file=sys.stderr)
            sys.exit(1)
        with open(args.diffoscope_json, "r") as f:
            data = json.load(f)
        findings = analyze_diffoscope_json(data)
        results.extend(findings)
    elif args.file_a and args.file_b:
        res = compare_raw_files(args.file_a, args.file_b)
        if res.get("status") == "IDENTICAL":
            print(f"✔ Files are bit-for-bit identical ({args.file_a} == {args.file_b}).")
            sys.exit(0)
        results.append(res)
    else:
        parser.print_help()
        sys.exit(1)

    # Summarize findings
    counts = {"P1": 0, "P2": 0, "P3": 0, "P4": 0}
    for r in results:
        cls = r.get("classification")
        if cls in counts:
            counts[cls] += 1

    report = {
        "summary": counts,
        "total_discrepancies": len(results),
        "verdict": "FAIL" if len(results) > 0 else "PASS",
        "findings": results
    }

    print("=== FreeStack Reproducibility Diff Classification Report ===")
    print(f"Total Discrepancies: {len(results)}")
    for p in ["P1", "P2", "P3", "P4"]:
        print(f"  {p} ({TAXONOMY[p]['name']}): {counts[p]}")
        
    for idx, f in enumerate(results, 1):
        print(f"\n[{idx}] {f.get('target', f.get('file_a', 'discrepancy'))}")
        print(f"    Class: {f.get('classification')} — {f.get('category')}")
        print(f"    Reason: {f.get('rationale')}")
        print(f"    Fix:    {f.get('remediation')}")

    if args.out:
        with open(args.out, "w") as out_f:
            json.dump(report, out_f, indent=2)
        print(f"\nWritten classification report to {args.out}")

    sys.exit(0 if len(results) == 0 else 2)

if __name__ == "__main__":
    main()
