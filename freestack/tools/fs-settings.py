#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""
FreeStack Subsystem Settings Manager (Task 10.9)
Controls and monitors the 12 sovereign operating system subsystems.
"""

import sys
import os
import json
import argparse
import importlib

PANELS_DIR = os.path.join(os.path.dirname(__file__), "panels")

def discover_panels():
    panels = {}
    if not os.path.isdir(PANELS_DIR):
        return panels
    
    sys.path.insert(0, os.path.dirname(__file__))
    for f in sorted(os.listdir(PANELS_DIR)):
        if f.startswith("panel_") and f.endswith(".py"):
            mod_name = f"panels.{f[:-3]}"
            try:
                mod = importlib.import_module(mod_name)
                for attr_name in dir(mod):
                    if attr_name.startswith("Panel") and attr_name != "Panel":
                        cls = getattr(mod, attr_name)
                        if hasattr(cls, "SUBSYSTEM_ID"):
                            panels[cls.SUBSYSTEM_ID] = cls()
            except Exception as e:
                print(f"[!] Warning: failed to load {mod_name}: {e}", file=sys.stderr)
    return panels

def main():
    parser = argparse.ArgumentParser(description="FreeStack Sovereign Settings Manager (Task 10.9)")
    parser.add_argument("--list", action="store_true", help="List all 12 configurable subsystems")
    parser.add_argument("--panel", type=str, help="Subsystem panel ID (e.g., network, keystore, accessibility)")
    parser.add_argument("--get", action="store_true", help="Get status and properties of specified panel")
    parser.add_argument("--set", type=str, metavar="KEY=VALUE", help="Set a specific parameter on the panel")
    parser.add_argument("--export-all", action="store_true", help="Export status of all 12 subsystems as JSON")
    parser.add_argument("--interactive", action="store_true", help="Run interactive terminal UI")
    args = parser.parse_args()

    panels = discover_panels()

    if args.list:
        print("=== FreeStack 12 Subsystem Panels ===")
        for sid, p in panels.items():
            print(f" • {sid:<15} : {p.TITLE} (daemon: {p.DAEMON})")
        return

    if args.export_all:
        out = {sid: p.get_status() for sid, p in panels.items()}
        print(json.dumps(out, indent=2))
        return

    if args.panel:
        sid = args.panel.lower()
        if sid not in panels:
            print(f"Error: unknown subsystem panel '{sid}'. Use --list to see available panels.", file=sys.stderr)
            sys.exit(1)
        panel = panels[sid]

        if args.set:
            if "=" not in args.set:
                print("Error: --set must be in KEY=VALUE format.", file=sys.stderr)
                sys.exit(1)
            k, v = args.set.split("=", 1)
            if panel.set_value(k, v):
                print(f"✔ Successfully updated {sid}.{k} = {v}")
            else:
                print(f"Error: key '{k}' not found on subsystem '{sid}'.", file=sys.stderr)
                sys.exit(1)

        if args.get or not args.set:
            print(json.dumps(panel.get_status(), indent=2))
        return

    if args.interactive:
        print("=== FreeStack Sovereign Settings Shell ===")
        sids = list(panels.keys())
        for idx, sid in enumerate(sids, 1):
            print(f"  [{idx}] {panels[sid].TITLE} ({sid})")
        print("  [0] Exit")
        try:
            choice = input("Select panel to inspect [0-12]: ").strip()
            if choice == "0" or not choice:
                return
            idx = int(choice)
            if 1 <= idx <= len(sids):
                selected = sids[idx - 1]
                print(json.dumps(panels[selected].get_status(), indent=2))
        except (ValueError, EOFError, KeyboardInterrupt):
            pass
        return

    parser.print_help()

if __name__ == "__main__":
    main()
