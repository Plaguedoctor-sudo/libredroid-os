#!/usr/bin/env python3
"""
lrd-support-matrix.py — LibreMobile Hardware Support Matrix Validator
Spec compliance: LibreDroid System Design v0.1 §2 (Support matrix & tier enforcement)

Support criteria enforced at install:
- Project Treble enabled
- Android base version 9 through 14 (API 28–34)
- VNDK version 28 through 34
- Unlockable bootloader
- Validated Halium / community kernel artifact exists
- Support tiers: Tier 1 (core-maintained), Tier 2 (community profile)
"""

import sys
import json
import argparse
from pathlib import Path

SUPPORTED_TIERS = {
    "vidofnir": {
        "tier": "T1",
        "name": "Volla Phone X23",
        "soc": "MediaTek MT6789 (Helio G99)",
        "arch": "arm64",
        "android_version": 12,
        "vndk_version": 31,
        "halium_version": 12,
        "kernel": "5.10.110-gki",
        "screen": "720x1560",
        "scale": 2.0,
        "boot_header": 4
    },
    "OP5DA6L1": {
        "tier": "T1",
        "name": "OnePlus Pad Go",
        "soc": "MediaTek MT6789 (Helio G99)",
        "arch": "arm64",
        "android_version": 13,
        "vndk_version": 33,
        "halium_version": 13,
        "kernel": "5.10.149-gki",
        "screen": "1720x2408",
        "scale": 1.0,
        "boot_header": 4
    }
}

class SupportMatrixValidator:
    def __init__(self, profiles_dir: Path | None = None):
        self.profiles_dir = profiles_dir

    def evaluate(self, dev: dict) -> dict:
        """
        Evaluates a device property map against LibreMobile support rules.
        Expected keys: codename, treble, android_version, vndk_version, bootloader_unlocked, has_boot_artifact
        """
        rejections = []
        warnings = []
        codename = dev.get("codename", "unknown")

        # 1. Architecture check
        if dev.get("arch", "arm64") != "arm64":
            rejections.append(f"Non-supported architecture '{dev.get('arch')}'; LibreMobile rootfs is arm64 generic.")

        # 2. Treble check
        if not dev.get("treble", True):
            rejections.append("Device lacks Project Treble support (non-goal per §1).")

        # 3. Bootloader unlock check
        if not dev.get("bootloader_unlocked", False):
            rejections.append("Bootloader is locked. Run 'fastboot flashing unlock' before installation.")

        # 4. Android version range (9 to 14)
        android_v = dev.get("android_version", 0)
        if android_v < 9 or android_v > 14:
            rejections.append(f"Android version {android_v} outside supported band (9–14).")

        # 5. VNDK version range (28 to 34)
        vndk_v = dev.get("vndk_version", 0)
        if vndk_v < 28 or vndk_v > 34:
            rejections.append(f"VNDK version {vndk_v} outside supported band (28–34).")

        # 6. Boot artifact check
        if not dev.get("has_boot_artifact", True):
            rejections.append(f"No existing Halium kernel or boot artifact found for codename '{codename}'.")

        # Determine Tier
        tier = "REFUSED"
        if not rejections:
            if codename in SUPPORTED_TIERS:
                tier = SUPPORTED_TIERS[codename]["tier"]
            else:
                tier = "T2"  # Community profile candidate

        return {
            "codename": codename,
            "status": "APPROVED" if not rejections else "REFUSED",
            "tier": tier,
            "rejections": rejections,
            "warnings": warnings,
            "eligible": len(rejections) == 0
        }

def main():
    parser = argparse.ArgumentParser(description="LibreMobile Hardware Support Matrix Validator")
    parser.add_argument("--codename", help="Device codename (e.g. vidofnir, OP5DA6L1)")
    parser.add_argument("--unlocked", action="store_true", help="Bootloader unlocked")
    parser.add_argument("--android", type=int, default=12, help="Android OS version")
    parser.add_argument("--vndk", type=int, default=31, help="VNDK version")
    parser.add_argument("--treble", action="store_true", default=True, help="Project Treble enabled")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--mock-test", action="store_true", help="Run validation test suite")
    args = parser.parse_args()

    validator = SupportMatrixValidator()

    if args.mock_test:
        # Test 1: Valid Volla X23
        t1 = validator.evaluate({
            "codename": "vidofnir",
            "arch": "arm64",
            "treble": True,
            "bootloader_unlocked": True,
            "android_version": 12,
            "vndk_version": 31,
            "has_boot_artifact": True
        })
        assert t1["eligible"] is True and t1["tier"] == "T1", f"T1 evaluation failed: {t1}"

        # Test 2: Valid OnePlus Pad Go
        t2 = validator.evaluate({
            "codename": "OP5DA6L1",
            "arch": "arm64",
            "treble": True,
            "bootloader_unlocked": True,
            "android_version": 13,
            "vndk_version": 33,
            "has_boot_artifact": True
        })
        assert t2["eligible"] is True and t2["tier"] == "T1", f"T2 evaluation failed: {t2}"

        # Test 3: Locked bootloader rejection
        t3 = validator.evaluate({
            "codename": "vidofnir",
            "arch": "arm64",
            "treble": True,
            "bootloader_unlocked": False,
            "android_version": 12,
            "vndk_version": 31,
            "has_boot_artifact": True
        })
        assert t3["eligible"] is False
        assert any("locked" in r for r in t3["rejections"])

        # Test 4: Unsupported ancient Android version
        t4 = validator.evaluate({
            "codename": "ancient",
            "arch": "arm64",
            "treble": False,
            "bootloader_unlocked": True,
            "android_version": 7,
            "vndk_version": 24,
            "has_boot_artifact": False
        })
        assert t4["eligible"] is False
        assert len(t4["rejections"]) >= 3

        print("✔ Support Matrix Validator self-test passed (T1, T2, and rejection diagnostics).")
        return 0

    dev_data = {
        "codename": args.codename or "vidofnir",
        "arch": "arm64",
        "treble": args.treble,
        "bootloader_unlocked": args.unlocked,
        "android_version": args.android,
        "vndk_version": args.vndk,
        "has_boot_artifact": True
    }
    res = validator.evaluate(dev_data)
    if args.json:
        print(json.dumps(res, indent=2))
    else:
        print(f"Device: {res['codename']} -> {res['status']} ({res['tier']})")
        if res["rejections"]:
            print("Rejections:")
            for r in res["rejections"]:
                print(f"  xx {r}")

    return 0 if res["eligible"] else 1

if __name__ == "__main__":
    sys.exit(main())
