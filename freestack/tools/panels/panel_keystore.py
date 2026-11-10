#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""
FreeStack Settings Panel: Hardware Keystore & HSM (Subsystem keystore)
"""

import json
import os

class PanelKeystore:
    SUBSYSTEM_ID = "keystore"
    TITLE = "Hardware Keystore & HSM"
    DAEMON = "tpm2-tss"

    def __init__(self, config_dir=None):
        if config_dir is None:
            config_dir = os.environ.get("FS_SETTINGS_DIR", "/tmp/freestack_settings" if not os.access("/etc", os.W_OK) else "/etc/freestack/settings")
        self.config_file = os.path.join(config_dir, f"{self.SUBSYSTEM_ID}.json")
        self.state = {
        "tpm2_present": True,
        "pcr_quote": "sha256:0,2,4 verified",
        "fido2_devices": 1,
        "keyslots_used": 3
}

    def load(self):
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, "r") as f:
                    self.state.update(json.load(f))
            except Exception:
                pass
        return self.state

    def save(self):
        os.makedirs(os.path.dirname(os.path.abspath(self.config_file)), exist_ok=True)
        with open(self.config_file, "w") as f:
            json.dump(self.state, f, indent=2)
        return True

    def get_status(self):
        return {
            "id": self.SUBSYSTEM_ID,
            "title": self.TITLE,
            "daemon": self.DAEMON,
            "state": self.load()
        }

    def set_value(self, key, value):
        self.load()
        if key in self.state:
            if isinstance(self.state[key], bool):
                self.state[key] = str(value).lower() in ("true", "1", "yes")
            elif isinstance(self.state[key], int):
                self.state[key] = int(value)
            elif isinstance(self.state[key], float):
                self.state[key] = float(value)
            else:
                self.state[key] = value
            self.save()
            return True
        return False
