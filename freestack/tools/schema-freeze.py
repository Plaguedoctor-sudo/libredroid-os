#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""FreeStack Schema Freeze Enforcer
Ensures no Cap'n Proto ordinals are renumbered, deleted, or shifted.
"""

import sys
import os
import re
from pathlib import Path

ORDINAL_RE = re.compile(r'([A-Za-z0-9_]+)\s*@([0-9]+)\b')

def extract_ordinals(schema_dir="interface"):
    p = Path(schema_dir)
    snapshot = []
    for f in sorted(p.glob("*.capnp")):
        lines = f.read_text().splitlines()
        for idx, line in enumerate(lines, 1):
            # strip comments
            code = line.split('#')[0].strip()
            for match in ORDINAL_RE.finditer(code):
                name, ord_num = match.groups()
                # Exclude file-level IDs like @0xa1b2c...
                if ord_num.isdigit():
                    snapshot.append(f"{f.name}:{name}@{ord_num}")
    return sorted(snapshot)

def cmd_dump(snapshot_path, schema_dir="interface"):
    snaps = extract_ordinals(schema_dir)
    Path(snapshot_path).write_text("\n".join(snaps) + "\n")
    print(f"Recorded {len(snaps)} frozen ordinals to {snapshot_path}")

def cmd_check(snapshot_path, schema_dir="interface"):
    snap_file = Path(snapshot_path)
    if not snap_file.exists():
        sys.stderr.write(f"Snapshot missing: {snapshot_path}\n")
        sys.exit(1)
    expected = set(snap_file.read_text().splitlines())
    current = set(extract_ordinals(schema_dir))

    missing = expected - current
    if missing:
        sys.stderr.write("SCHEMA FREEZE VIOLATION: Previously frozen ordinals removed or modified:\n")
        for m in sorted(list(missing)):
            sys.stderr.write(f"  - {m}\n")
        sys.exit(1)
    print(f"schema freeze check passed ({len(current)} ordinals verified)")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "dump":
        snap = sys.argv[2] if len(sys.argv) > 2 else "interface/ordinals.snapshot"
        cmd_dump(snap)
    elif len(sys.argv) > 1 and sys.argv[1] == "check":
        snap = sys.argv[2] if len(sys.argv) > 2 else "interface/ordinals.snapshot"
        cmd_check(snap)
    else:
        sys.stderr.write("Usage: schema-freeze.py [dump|check] [snapshot_file]\n")
        sys.exit(1)
