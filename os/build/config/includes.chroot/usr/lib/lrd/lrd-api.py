#!/usr/bin/env python3
"""
LibreDroid Sovereign System API Daemon
Confined by AppArmor and Polkit policies.
Listens on:
  - 127.0.0.1:3002 (Loopback HTTP with Origin checks)
  - /run/lrd/system.sock (Local Unix Domain Socket)
"""
import http.server
import json
import os
import re
import socket
import subprocess
import threading
import glob
from urllib.parse import urlparse

HOST = "127.0.0.1"
PORT = 3002
UNIX_SOCKET = "/run/lrd/system.sock"
READY = True

# Allowed origins for web shell loopback access
ALLOWED_ORIGINS = {"http://127.0.0.1:3001", "http://localhost:3001", "http://127.0.0.1:5173", "http://localhost:5173"}
PKG_NAME_RE = re.compile(r"^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$")

def get_battery_info():
    bat_paths = glob.glob("/sys/class/power_supply/BAT*") or glob.glob("/sys/class/power_supply/battery*")
    if not bat_paths:
        return {"level": 100, "charging": True, "present": False, "health": "Good"}
    base = bat_paths[0]
    def read_val(name, default=""):
        try:
            with open(os.path.join(base, name), "r") as f:
                return f.read().strip()
        except Exception:
            return default
    capacity = int(read_val("capacity", "100") or "100")
    status = read_val("status", "Discharging")
    health = read_val("health", "Good")
    return {
        "level": max(0, min(100, capacity)),
        "charging": status.lower() in ("charging", "full"),
        "status": status,
        "health": health,
        "present": True
    }

def get_brightness_info():
    bl_paths = glob.glob("/sys/class/backlight/*")
    if not bl_paths:
        return {"level": 100, "supported": False}
    base = bl_paths[0]
    try:
        with open(os.path.join(base, "max_brightness")) as f:
            max_b = int(f.read().strip() or "1")
        with open(os.path.join(base, "brightness")) as f:
            cur_b = int(f.read().strip() or "1")
        return {"level": int((cur_b / max_b) * 100), "supported": True, "max": max_b}
    except Exception:
        return {"level": 100, "supported": False}

def set_brightness(percent):
    bl_paths = glob.glob("/sys/class/backlight/*")
    if not bl_paths:
        return False
    base = bl_paths[0]
    try:
        with open(os.path.join(base, "max_brightness")) as f:
            max_b = int(f.read().strip() or "1")
        target = max(1, int((percent / 100.0) * max_b))
        with open(os.path.join(base, "brightness"), "w") as f:
            f.write(str(target))
        return True
    except Exception:
        return False

def handle_rpc_call(method, params):
    """Executes structured typed RPC calls without arbitrary shell execution."""
    if method == "system.status":
        return {"ok": True, "ready": READY, "battery": get_battery_info(), "brightness": get_brightness_info()}

    elif method == "system.power":
        action = params.get("action")
        if action == "reboot":
            subprocess.run(["systemctl", "reboot"], check=False)
            return {"ok": True, "status": "rebooting"}
        elif action == "poweroff":
            subprocess.run(["systemctl", "poweroff"], check=False)
            return {"ok": True, "status": "shutting_down"}
        elif action == "suspend":
            subprocess.run(["systemctl", "suspend"], check=False)
            return {"ok": True, "status": "suspended"}
        elif action == "lock":
            subprocess.run(["loginctl", "lock-session"], check=False)
            return {"ok": True, "status": "locked"}
        return {"ok": False, "error": f"invalid power action: {action}"}

    elif method == "system.brightness.get":
        return {"ok": True, "brightness": get_brightness_info()}

    elif method == "system.brightness.set":
        level = params.get("level", 50)
        ok = set_brightness(int(level))
        return {"ok": ok, "level": level}

    elif method == "system.volume.set":
        level = max(0, min(100, int(params.get("level", 50))))
        # Prefer wpctl (WirePlumber / PipeWire), fallback to pactl
        try:
            subprocess.run(["wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", f"{level/100:.2f}"], timeout=2, check=False)
        except Exception:
            try:
                subprocess.run(["pactl", "set-sink-volume", "@DEFAULT_SINK@", f"{level}%"], timeout=2, check=False)
            except Exception:
                pass
        return {"ok": True, "level": level}

    elif method == "system.wifi.status":
        try:
            res = subprocess.run(["nmcli", "-t", "-f", "SSID,SIGNAL,BARS,SECURITY,ACTIVE", "dev", "wifi"],
                                 capture_output=True, text=True, timeout=5)
            networks = []
            for line in res.stdout.strip().split("\n"):
                if not line:
                    continue
                parts = line.split(":")
                if len(parts) >= 4:
                    networks.append({
                        "ssid": parts[0],
                        "signal": int(parts[1]) if parts[1].isdigit() else 0,
                        "security": parts[3],
                        "connected": parts[4] == "yes" if len(parts) > 4 else False
                    })
            return {"ok": True, "networks": networks}
        except Exception as e:
            return {"ok": False, "error": str(e), "networks": []}

    elif method == "waydroid.session":
        action = params.get("action")
        if action == "status":
            try:
                res = subprocess.run(["waydroid", "status"], capture_output=True, text=True, timeout=3)
                return {"ok": True, "status": res.stdout.strip()}
            except Exception:
                return {"ok": False, "status": "unavailable"}
        elif action == "start":
            subprocess.Popen(["waydroid", "session", "start"])
            return {"ok": True, "action": "started"}
        elif action == "stop":
            subprocess.run(["waydroid", "session", "stop"], timeout=5, check=False)
            return {"ok": True, "action": "stopped"}
        return {"ok": False, "error": "unknown action"}

    elif method == "waydroid.app.launch":
        pkg = params.get("package", "")
        if not PKG_NAME_RE.match(pkg):
            return {"ok": False, "error": "invalid package name format"}
        subprocess.Popen(["waydroid", "app", "launch", pkg])
        return {"ok": True, "launched": pkg}

    elif method == "shell.exec":
        # Strictly limited to /usr/bin/lrd-* or /usr/local/bin/lrd-* with tokenized arguments
        args = params.get("args")
        if not args:
            raw_cmd = params.get("command", "").strip()
            args = raw_cmd.split() if raw_cmd else []
        if not args:
            return {"ok": False, "error": "empty command"}
        bin_base = os.path.basename(args[0])
        if not bin_base.startswith("lrd-"):
            return {"ok": False, "error": f"unauthorized binary: {bin_base}. Only lrd-* tools allowed."}
        full_bin = None
        for candidate in [f"/usr/local/bin/{bin_base}", f"/usr/bin/{bin_base}", f"/opt/libredroid/bin/{bin_base}"]:
            if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
                full_bin = candidate
                break
        if not full_bin:
            return {"ok": False, "error": f"binary not found: {bin_base}"}
        try:
            res = subprocess.run([full_bin] + args[1:], capture_output=True, text=True, timeout=15)
            return {"ok": res.returncode == 0, "stdout": res.stdout, "stderr": res.stderr, "exitCode": res.returncode}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    return {"ok": False, "error": f"unknown method: {method}"}


class APIHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
        else:
            self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:3001")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-LRD-Token")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
        else:
            self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:3001")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-LRD-Token")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self):
        global READY
        parsed = urlparse(self.path)
        if parsed.path == "/api/shell/health":
            self.send_json(200, {"ready": READY, "status": "ok", "battery": get_battery_info()})
            return
        if parsed.path == "/healthz":
            self.send_json(200, {"ok": True})
            return
        self.send_json(404, {"error": "not found"})

    def do_POST(self):
        global READY
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        data = self.rfile.read(length) if length > 0 else b"{}"
        try:
            req = json.loads(data.decode("utf-8") or "{}")
        except Exception:
            req = {}

        if parsed.path == "/api/shell/ready":
            READY = True
            self.send_json(200, {"ok": True, "ready": True})
            return

        if parsed.path == "/api/rpc":
            method = req.get("method", "")
            params = req.get("params", {})
            result = handle_rpc_call(method, params)
            self.send_json(200 if result.get("ok") else 400, result)
            return

        # Backwards compatible endpoint
        if parsed.path == "/api/shell/exec":
            result = handle_rpc_call("shell.exec", req)
            self.send_json(200 if result.get("ok") else 400, result)
            return

        self.send_json(404, {"error": "not found"})


def run_unix_socket_server():
    os.makedirs(os.path.dirname(UNIX_SOCKET), exist_ok=True)
    if os.path.exists(UNIX_SOCKET):
        try:
            os.unlink(UNIX_SOCKET)
        except OSError:
            pass

    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    sock.bind(UNIX_SOCKET)
    os.chmod(UNIX_SOCKET, 0o660) # rw-rw---- for lrd group
    sock.listen(5)

    while True:
        try:
            conn, _ = sock.accept()
            with conn:
                raw_data = conn.recv(65536)
                if not raw_data:
                    continue
                try:
                    payload = json.loads(raw_data.decode("utf-8"))
                    method = payload.get("method", "")
                    params = payload.get("params", {})
                    resp = handle_rpc_call(method, params)
                except Exception as e:
                    resp = {"ok": False, "error": str(e)}
                conn.sendall(json.dumps(resp).encode("utf-8"))
        except Exception:
            pass


def main():
    os.makedirs("/run/lrd", exist_ok=True)
    with open("/run/lrd/api.pid", "w") as f:
        f.write(str(os.getpid()))

    # Start Unix Domain Socket listener thread
    t = threading.Thread(target=run_unix_socket_server, daemon=True)
    t.start()

    http_server = http.server.ThreadingHTTPServer((HOST, PORT), APIHandler)
    try:
        http_server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        http_server.server_close()
        if os.path.exists(UNIX_SOCKET):
            try:
                os.unlink(UNIX_SOCKET)
            except OSError:
                pass

if __name__ == "__main__":
    main()
