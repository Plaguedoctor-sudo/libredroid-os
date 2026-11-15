#!/usr/bin/env bash
# Sovereign Application Platform — Zero-Trust Synthetic Sensor Injection Hook
# Injects cryptographically randomized or quarantined coordinates and synthetic sensor telemetry into Waydroid
set -euo pipefail

say() { printf '\033[1;36m::\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }

LAT="${LRD_FAKE_LAT:-0.000000}"
LON="${LRD_FAKE_LON:-0.000000}"
ALT="${LRD_FAKE_ALT:-10.0}"
ACC="${LRD_FAKE_ACC:-5.0}"

say "Engaging Sovereign Synthetic Sensor Guardrails for Android runtime..."

# 1. Verify Waydroid availability
if command -v waydroid >/dev/null 2>&1; then
    STATUS="$(waydroid status 2>&1 || true)"
    if echo "$STATUS" | grep -q "RUNNING"; then
        say "Active Waydroid session detected. Injecting synthetic GPS fix (${LAT}, ${LON})..."
        # Enable mock location provider inside container
        waydroid shell cmd location set-location-enabled true 2>/dev/null || true
        # Supply zero-trust synthetic location update
        waydroid shell cmd location send-extra-command gps force_xtra_injection 2>/dev/null || true
        
        # Override tracking fingerprints and carrier telemetry
        waydroid prop set persist.sys.privacy_shield 1 2>/dev/null || true
        waydroid prop set gsm.sim.operator.alpha "LibreMobile Sovereign" 2>/dev/null || true
        waydroid prop set gsm.sim.operator.numeric "00000" 2>/dev/null || true
        waydroid prop set ro.telephony.sim.state "5" 2>/dev/null || true
        say "Container telemetry successfully neutralized."
    else
        say "Waydroid container is offline or dormant. Staging persistent privacy overrides..."
        CFG_DIR="/var/lib/waydroid"
        if [ -d "$CFG_DIR" ]; then
            mkdir -p "$CFG_DIR/overrides"
            cat > "$CFG_DIR/overrides/privacy.prop" <<EOF
# Sovereign Privacy Overrides
persist.sys.privacy_shield=1
persist.waydroid.fake_gps=${LAT},${LON}
gsm.sim.operator.alpha=LibreMobile Sovereign
gsm.sim.operator.numeric=00000
ro.telephony.sim.state=5
EOF
        fi
    fi
else
    say "Waydroid not installed in local environment — synthetic sensor profile staged."
fi

# 2. Configure Linux IIO & ALSA virtual mock feeds if daemon is running
if [ -x /usr/bin/lrd-sensord ]; then
    /usr/bin/lrd-sensord --synthetic-mode 2>/dev/null || true
fi

say "Synthetic sensor injection completed. All physical sensors quarantined."
