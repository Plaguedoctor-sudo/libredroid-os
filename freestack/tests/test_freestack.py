# SPDX-License-Identifier: GPL-3.0-or-later
"""
FreeStack Python Test Suite (Task 9.3)
Unit and integration tests for FreeStack manifest, tools, panels, and security models.
"""

import os
import sys
import subprocess
import pytest
from pathlib import Path

ROOT = Path(__file__).parent.parent

def test_manifest_schema():
    res = subprocess.run([sys.executable, str(ROOT / "tools/fsbuild/fsbuild.py"), "schema", "validate"],
                         capture_output=True, text=True, cwd=str(ROOT))
    assert res.returncode == 0
    assert "schema ok" in res.stdout

def test_manifest_rules():
    res = subprocess.run([sys.executable, str(ROOT / "tools/fsbuild/fsbuild.py"), "rules", "check"],
                         capture_output=True, text=True, cwd=str(ROOT))
    assert res.returncode == 0
    assert "rules ok" in res.stdout

def test_manifest_signatures():
    res = subprocess.run([sys.executable, str(ROOT / "tools/fsbuild/fsbuild.py"), "manifest", "verify"],
                         capture_output=True, text=True, cwd=str(ROOT))
    assert res.returncode == 0
    assert "verified 3/3" in res.stdout

def test_fs_settings_panels():
    res = subprocess.run([sys.executable, str(ROOT / "tools/fs-settings.py"), "--list"],
                         capture_output=True, text=True, cwd=str(ROOT))
    assert res.returncode == 0
    assert "12 Subsystem Panels" in res.stdout
    assert "accessibility" in res.stdout
    assert "selinux" in res.stdout
    assert "keystore" in res.stdout

def test_fs_permissions_broker():
    # Test auto-grant
    res = subprocess.run([sys.executable, str(ROOT / "tools/fs-permissions.py"),
                          "--app", "org.freestack.SampleApp",
                          "--perm", "camera", "--auto-grant"],
                         capture_output=True, text=True, cwd=str(ROOT))
    assert res.returncode == 0
    assert "Granted camera" in res.stdout

    # Now verify it passes
    res2 = subprocess.run([sys.executable, str(ROOT / "tools/fs-permissions.py"),
                           "--app", "org.freestack.SampleApp",
                           "--perm", "camera"],
                          capture_output=True, text=True, cwd=str(ROOT))
    assert res2.returncode == 0

def test_fs_setup_dry_run():
    res = subprocess.run([sys.executable, str(ROOT / "tools/fs-setup.py"), "--test"],
                         capture_output=True, text=True, cwd=str(ROOT))
    assert res.returncode == 0
    assert "Setup Completed Successfully" in res.stdout

def test_selinux_audit2allow_validator():
    res = subprocess.run([sys.executable, str(ROOT / "tools/fs-audit2allow.py"),
                          "--check-rule", "allow fs_network_t fs_app_t:process { ptrace };"],
                         capture_output=True, text=True, cwd=str(ROOT))
    assert res.returncode == 1
    assert "FAIL" in res.stdout
