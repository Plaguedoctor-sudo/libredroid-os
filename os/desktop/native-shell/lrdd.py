#!/usr/bin/env python3
"""
LibreDroid Sovereign Daemon Python Client (lrdd.py)
Type-safe Python interface communicating with lrdd over UNIX domain socket.
"""

import os
import json
import socket
from typing import Dict, Any, Optional

SOCK_PRIMARY = "/run/libredroid/lrdd.sock"
SOCK_FALLBACK = "/tmp/lrdd.sock"

class LrddClient:
    def __init__(self, socket_path: Optional[str] = None):
        if socket_path:
            self.socket_path = socket_path
        elif os.path.exists(SOCK_PRIMARY):
            self.socket_path = SOCK_PRIMARY
        else:
            self.socket_path = SOCK_FALLBACK

    def call(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Send JSON-RPC method call to lrdd"""
        if not os.path.exists(self.socket_path):
            return {"ok": False, "error": f"lrdd socket not found at {self.socket_path}"}

        payload = json.dumps({"jsonrpc": "2.0", "method": method, "params": params or {}, "id": 1}) + "\n"
        try:
            with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
                s.settimeout(2.0)
                s.connect(self.socket_path)
                s.sendall(payload.encode("utf-8"))
                resp = s.recv(8192)
                if resp:
                    return json.loads(resp.decode("utf-8"))
        except Exception as e:
            return {"ok": False, "error": str(e)}
        return {"ok": False, "error": "Empty response"}

    # High-level typed helpers
    def get_status(self) -> Dict[str, Any]:
        return self.call("system.status")

    def get_power_info(self) -> Dict[str, Any]:
        return self.call("system.power.info")

    def set_brightness(self, level: int) -> Dict[str, Any]:
        return self.call("system.brightness.set", {"level": max(5, min(100, level))})

    def get_brightness(self) -> Dict[str, Any]:
        return self.call("system.brightness.get")

    def set_volume(self, level: int) -> Dict[str, Any]:
        return self.call("system.volume.set", {"level": max(0, min(100, level))})

    def get_network(self) -> Dict[str, Any]:
        return self.call("system.wifi.status")

    def list_domains(self) -> Dict[str, Any]:
        return self.call("domains.list")

    def start_domain(self, domain: str) -> Dict[str, Any]:
        return self.call("domains.start", {"domain": domain})

    def stop_domain(self, domain: str) -> Dict[str, Any]:
        return self.call("domains.stop", {"domain": domain})

    def launch_app(self, package: str) -> Dict[str, Any]:
        return self.call("waydroid.app.launch", {"package": package})

    def power_action(self, action: str) -> Dict[str, Any]:
        return self.call("system.power", {"action": action})

# Global singleton client
default_client = LrddClient()
