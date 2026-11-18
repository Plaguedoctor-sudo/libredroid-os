#!/usr/bin/env python3
"""
lrd-waydroid-apk-hook.py — In-Container Per-APK Network Attribution Hook
Spec compliance: LibreDroid System Design v0.1 §8.d & §6

Responsibilities:
1. Parses Android's /data/system/packages.xml in Waydroid container storage.
2. Extracts Linux UID <-> Android package name bindings (e.g. UID 10142 -> org.telegram.messenger).
3. Emits live UID-to-package mapping to /run/libredroid/waydroid-apk-map.json for lrd-egressd.
4. Provides resolution queries for UID packet marks logged by netfilter on waydroid0.
"""

import sys
import os
import json
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path

DEFAULT_PACKAGES_XML = Path("/var/lib/waydroid/data/system/packages.xml")
DEFAULT_OUTPUT_MAP = (
    Path("/run/libredroid/waydroid-apk-map.json")
    if os.access("/run", os.W_OK) or Path("/run/libredroid").is_dir()
    else Path(os.environ.get("XDG_RUNTIME_DIR", "/tmp")) / "libredroid" / "waydroid-apk-map.json"
)

class WaydroidApkAttribution:
    def __init__(self, packages_xml: Path = DEFAULT_PACKAGES_XML, map_file: Path = DEFAULT_OUTPUT_MAP):
        self.packages_xml = Path(packages_xml)
        self.map_file = Path(map_file)
        self.uid_map = {}
        self.package_map = {}

    def parse(self, xml_content: str = None) -> dict:
        """Parses packages.xml content or file and builds UID mapping."""
        self.uid_map.clear()
        self.package_map.clear()

        try:
            if xml_content:
                root = ET.fromstring(xml_content)
            elif self.packages_xml.is_file():
                tree = ET.parse(self.packages_xml)
                root = tree.getroot()
            else:
                return {}
        except Exception as e:
            sys.stderr.write(f"[!] XML parse error for {self.packages_xml}: {e}\n")
            return {}

        # Parse shared-user tags first if present
        shared_users = {}
        for su in root.findall(".//shared-user"):
            s_name = su.get("name")
            s_id = su.get("userId")
            if s_name and s_id:
                try:
                    shared_users[s_name] = int(s_id)
                except ValueError:
                    pass

        # Parse package tags
        for pkg in root.findall(".//package"):
            pkg_name = pkg.get("name")
            user_id = pkg.get("userId")
            shared_id = pkg.get("sharedUserId")

            uid = None
            if user_id:
                try:
                    uid = int(user_id)
                except ValueError:
                    pass
            elif shared_id and shared_id in shared_users:
                uid = shared_users[shared_id]

            if pkg_name and uid is not None:
                entry = {
                    "package": pkg_name,
                    "uid": uid,
                    "code_path": pkg.get("codePath", ""),
                    "version_code": pkg.get("version", "0"),
                    "flags": pkg.get("flags", "")
                }
                self.uid_map[str(uid)] = entry
                self.package_map[pkg_name] = entry

        return self.uid_map

    def save_map(self):
        """Saves UID map atomically to disk for lrd-egressd consumption."""
        self.map_file.parent.mkdir(parents=True, exist_ok=True)
        dump = {
            "version": "1.0",
            "uids": self.uid_map,
            "packages": self.package_map,
            "total_attributed_apks": len(self.package_map)
        }
        tmp = self.map_file.with_suffix(".tmp")
        tmp.write_text(json.dumps(dump, indent=2), encoding="utf-8")
        tmp.replace(self.map_file)

    def resolve_uid(self, uid: int | str) -> dict | None:
        """Resolves a Linux UID into its corresponding Android package."""
        s_uid = str(uid)
        if s_uid in self.uid_map:
            return self.uid_map[s_uid]
        # In Android, App UIDs start at 10000. UID = 100000 * user_id + app_id
        try:
            i_uid = int(uid)
            app_id = i_uid % 100000
            if str(app_id) in self.uid_map:
                return self.uid_map[str(app_id)]
        except ValueError:
            pass
        return None

def main():
    parser = argparse.ArgumentParser(description="LibreDroid Waydroid In-Container APK Attribution Hook")
    parser.add_argument("--packages-xml", default=str(DEFAULT_PACKAGES_XML), help="Path to Waydroid packages.xml")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT_MAP), help="Path to output mapping JSON")
    parser.add_argument("--resolve", type=int, help="Resolve given UID to package name")
    parser.add_argument("--mock-test", action="store_true", help="Run self-test with sample Android package data")
    args = parser.parse_args()

    hook = WaydroidApkAttribution(packages_xml=Path(args.packages_xml), map_file=Path(args.output))

    if args.mock_test:
        sample_xml = """<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<packages>
    <package name="org.telegram.messenger" codePath="/data/app/org.telegram.messenger-1" userId="10142" version="90100" />
    <package name="org.signal.messenger" codePath="/data/app/org.signal.messenger-1" userId="10143" version="61500" />
    <package name="org.fdroid.fdroid" codePath="/data/app/org.fdroid.fdroid-1" userId="10100" version="1019000" />
</packages>
"""
        hook.parse(sample_xml)
        hook.save_map()
        t = hook.resolve_uid(10142)
        assert t and t["package"] == "org.telegram.messenger", f"Failed resolution for 10142: {t}"
        f = hook.resolve_uid(10100)
        assert f and f["package"] == "org.fdroid.fdroid", f"Failed resolution for 10100: {f}"
        print(f"✔ Self-test passed: {len(hook.uid_map)} packages mapped and verified.")
        return 0

    hook.parse()
    hook.save_map()
    print(f"✔ Parsed {len(hook.uid_map)} Android packages from {args.packages_xml} -> {args.output}")

    if args.resolve:
        match = hook.resolve_uid(args.resolve)
        if match:
            print(f"UID {args.resolve} -> {match['package']}")
        else:
            print(f"UID {args.resolve} not found")
            return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
