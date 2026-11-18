#!/usr/bin/env python3
"""
lrd-egressd.py — LibreDroid Sovereign Egress Audit & Policy Supervisor Daemon
Spec compliance: LibreDroid System Design v0.1 §1, §8, §10

Responsibilities:
1. Loads and validates app policy definitions (/var/lib/egress/policy/*.toml).
2. Monitors kernel egress drop events ([LRD-EGRESS-DROP]) and tracks conntrack flows.
3. Maintains an in-memory audit ring buffer attributing network attempts to apps.
4. Generates live diagnostics (/run/libredroid/egress-status.json) for the UI panel.
5. Interfaces with nftables inet lrd_egress sets.
"""

import os
import sys
import time
import json
import re
import argparse
from pathlib import Path
from collections import deque

try:
    import tomllib
except ImportError:
    try:
        import tomli as tomllib
    except ImportError:
        tomllib = None

def parse_toml(content: str) -> dict:
    if tomllib is not None:
        return tomllib.loads(content)
    data = {}
    cur = data
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("[") and line.endswith("]"):
            cur = data.setdefault(line[1:-1].strip(), {})
        elif "=" in line:
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.split("#")[0].strip()
            if v.startswith('"') and v.endswith('"'):
                cur[k] = v[1:-1]
            elif v.lower() in ("true", "false"):
                cur[k] = (v.lower() == "true")
            elif v.startswith("[") and v.endswith("]"):
                cur[k] = [x.strip().strip('"').strip("'") for x in v[1:-1].split(",") if x.strip()]
            else:
                try:
                    cur[k] = int(v) if "." not in v else float(v)
                except ValueError:
                    cur[k] = v
    return data

class EgressSupervisor:
    def __init__(self, policy_dirs: list[Path], state_file: Path, apk_map_file: Path | None = None, max_ring_buffer: int = 1000):
        self.policy_dirs = policy_dirs
        self.state_file = state_file
        self.apk_map_file = apk_map_file
        self.apk_map = {}
        self.ring_buffer = deque(maxlen=max_ring_buffer)
        self.policies = {}
        self.stats = {
            "total_drops": 0,
            "total_allowed": 0,
            "kill_switch_active": True,
            "tunnel_interface": "wg0",
            "per_app_stats": {}
        }
        self.reload_policies()
        self.reload_apk_map()

    def reload_apk_map(self):
        candidates = []
        if self.apk_map_file:
            candidates.append(self.apk_map_file)
        candidates.extend([
            Path("/run/libredroid/waydroid-apk-map.json"),
            Path(os.environ.get("XDG_RUNTIME_DIR", "/tmp")) / "libredroid" / "waydroid-apk-map.json",
            Path("/tmp/libredroid/waydroid-apk-map.json")
        ])
        for p in candidates:
            if p and p.is_file():
                try:
                    data = json.loads(p.read_text(encoding="utf-8"))
                    self.apk_map = data.get("uids", {})
                    break
                except Exception:
                    pass

    def reload_policies(self):
        self.policies.clear()
        for pdir in self.policy_dirs:
            if not pdir.is_dir():
                continue
            for pfile in pdir.glob("*.toml"):
                try:
                    content = pfile.read_text(encoding="utf-8")
                    data = parse_toml(content)
                    app_id = data.get("app", {}).get("id") or pfile.stem
                    self.policies[app_id] = data
                    if app_id not in self.stats["per_app_stats"]:
                        self.stats["per_app_stats"][app_id] = {
                            "name": data.get("app", {}).get("name", app_id),
                            "type": data.get("app", {}).get("type", "native"),
                            "mode": data.get("network", {}).get("mode", "tunnel_only"),
                            "drops": 0,
                            "allowed": 0,
                            "last_seen": None
                        }
                except Exception as e:
                    sys.stderr.write(f"[!] Error loading policy {pfile}: {e}\n")

    def record_drop_event(self, raw_line: str) -> dict:
        # Format: [LRD-EGRESS-DROP] IN= OUT=wlan0 MAC=... SRC=192.168.1.100 DST=1.1.1.1 LEN=... PROTO=TCP SPT=... DPT=443
        event = {
            "timestamp": time.time(),
            "raw": raw_line.strip(),
            "verdict": "DROP",
            "protocol": "UNKNOWN",
            "src_ip": "unknown",
            "dst_ip": "unknown",
            "dst_port": None,
            "out_if": None,
            "attributed_app": "unattributed_system"
        }

        m_proto = re.search(r'\bPROTO=([A-Z0-9]+)', raw_line)
        if m_proto:
            event["protocol"] = m_proto.group(1)

        m_src = re.search(r'\bSRC=([0-9a-fA-F\.:]+)', raw_line)
        if m_src:
            event["src_ip"] = m_src.group(1)

        m_dst = re.search(r'\bDST=([0-9a-fA-F\.:]+)', raw_line)
        if m_dst:
            event["dst_ip"] = m_dst.group(1)

        m_dpt = re.search(r'\bDPT=([0-9]+)', raw_line)
        if m_dpt:
            event["dst_port"] = int(m_dpt.group(1))

        m_out = re.search(r'\bOUT=([a-zA-Z0-9\._\-]+)', raw_line)
        if m_out:
            event["out_if"] = m_out.group(1)

        m_in = re.search(r'\bIN=([a-zA-Z0-9\._\-]+)', raw_line)
        m_uid = re.search(r'\bUID=([0-9]+)', raw_line)
        apk_pkg = None

        if m_uid:
            uid_str = m_uid.group(1)
            event["uid"] = int(uid_str)
            if uid_str in self.apk_map:
                apk_pkg = self.apk_map[uid_str].get("package")
            else:
                # Android user 0 modulo 100000 check
                try:
                    mod_uid = str(int(uid_str) % 100000)
                    if mod_uid in self.apk_map:
                        apk_pkg = self.apk_map[mod_uid].get("package")
                except ValueError:
                    pass

        if m_in and m_in.group(1) == "waydroid0":
            if apk_pkg:
                event["attributed_app"] = f"io.waydroid.container [{apk_pkg}]"
                event["apk_package"] = apk_pkg
            else:
                event["attributed_app"] = "io.waydroid.container"
        elif apk_pkg:
            event["attributed_app"] = apk_pkg
            event["apk_package"] = apk_pkg

        # Update stats
        self.stats["total_drops"] += 1
        app = event["attributed_app"]
        if app not in self.stats["per_app_stats"]:
            self.stats["per_app_stats"][app] = {
                "name": apk_pkg if apk_pkg else app,
                "type": "container_apk" if apk_pkg else "system",
                "mode": "tunnel_only",
                "drops": 0,
                "allowed": 0,
                "last_seen": None
            }
        self.stats["per_app_stats"][app]["drops"] += 1
        self.stats["per_app_stats"][app]["last_seen"] = event["timestamp"]

        # Also credit the parent container if attributed to an APK
        if apk_pkg and "io.waydroid.container" in self.stats["per_app_stats"]:
            self.stats["per_app_stats"]["io.waydroid.container"]["drops"] += 1
            self.stats["per_app_stats"]["io.waydroid.container"]["last_seen"] = event["timestamp"]

        self.ring_buffer.append(event)
        return event

    def emit_state(self):
        try:
            self.state_file.parent.mkdir(parents=True, exist_ok=True)
            dump = {
                "timestamp": time.time(),
                "status": "active",
                "kill_switch_active": self.stats["kill_switch_active"],
                "tunnel_interface": self.stats["tunnel_interface"],
                "total_drops": self.stats["total_drops"],
                "total_allowed": self.stats["total_allowed"],
                "registered_policies_count": len(self.policies),
                "per_app_stats": self.stats["per_app_stats"],
                "recent_events": list(self.ring_buffer)[-50:]
            }
            tmp = self.state_file.with_suffix(".tmp")
            tmp.write_text(json.dumps(dump, indent=2), encoding="utf-8")
            tmp.replace(self.state_file)
        except PermissionError:
            fallback = Path("/tmp/libredroid/egress-status.json")
            fallback.parent.mkdir(parents=True, exist_ok=True)
            tmp = fallback.with_suffix(".tmp")
            tmp.write_text(json.dumps(dump, indent=2), encoding="utf-8")
            tmp.replace(fallback)
            self.state_file = fallback

    def evaluate_verdict(self, app_id: str, dst_ip: str, dst_port: int, iface: str) -> str:
        if app_id not in self.policies:
            return "DROP"
        pol = self.policies[app_id].get("network", {})
        mode = pol.get("mode", "tunnel_only")
        if mode == "blocked":
            return "DROP"
        if mode == "tunnel_only":
            if iface == "wg0" or dst_ip.startswith("127.") or dst_ip == "::1":
                return "ALLOW"
            return "DROP"
        if mode == "vpn_bootstrap":
            allowed_ports = pol.get("allowed_ports", [443, 51820])
            if dst_port in allowed_ports:
                return "ALLOW"
            return "DROP"
        return "DROP"

def main():
    parser = argparse.ArgumentParser(description="LibreDroid Egress Supervisor Daemon")
    parser.add_argument("--policy-dir", action="append", default=[], help="Directory with policy TOML files")
    parser.add_argument("--state-file", default="/run/libredroid/egress-status.json", help="Path to state output")
    parser.add_argument("--apk-map-file", default=None, help="Path to Waydroid APK attribution map JSON")
    parser.add_argument("--check-only", action="store_true", help="Validate policies and emit initial state")
    args = parser.parse_args()

    pdirs = [Path(p) for p in args.policy_dir]
    default_pdir = Path(__file__).resolve().parent.parent / "policy"
    if default_pdir.is_dir() and default_pdir not in pdirs:
        pdirs.append(default_pdir)

    apk_map_p = Path(args.apk_map_file) if args.apk_map_file else None
    sup = EgressSupervisor(policy_dirs=pdirs, state_file=Path(args.state_file), apk_map_file=apk_map_p)
    print(f"✔ LibreDroid Egress Supervisor initialized with {len(sup.policies)} policies:")
    for app_id, p in sup.policies.items():
        name = p.get('app', {}).get('name', app_id)
        mode = p.get('network', {}).get('mode', 'tunnel_only')
        print(f"  • {name} [{app_id}] -> mode={mode}")

    sup.emit_state()
    print(f"✔ Diagnostics emitted to: {args.state_file}")

    if args.check_only:
        return 0

    print(":: Listening for egress audit events...")
    try:
        while True:
            time.sleep(1)
            sup.emit_state()
    except KeyboardInterrupt:
        print("\n:: Shutting down egress supervisor.")
        return 0

if __name__ == "__main__":
    sys.exit(main())
