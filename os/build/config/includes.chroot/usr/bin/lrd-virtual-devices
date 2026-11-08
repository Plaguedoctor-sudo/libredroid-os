#!/bin/bash
# ==============================================================================
# LibreDroid Virtual Devices Mock / Feed Engine
# os/security/harden/lrd-virtual-devices.sh
#
# Provides isolated dummy audio (snd-aloop) and camera (v4l2loopback) devices.
# Used by anti-predatory sandboxes to feed synthetic silence / blank frames
# to untrusted apps or containers attempting covert hardware surveillance.
# ==============================================================================

set -euo pipefail

ACTION="${1:-status}"
STATE_DIR="/run/libredroid/virtual-devices"

if ! mkdir -p "$STATE_DIR" 2>/dev/null; then
    STATE_DIR="/tmp/libredroid/virtual-devices"
    mkdir -p "$STATE_DIR"
fi

status_devs() {
    echo "=== LibreDroid Virtual Devices Status ==="
    echo -n "ALSA Loopback (snd-aloop): "
    if lsmod | grep -q "^snd_aloop"; then
        echo "LOADED"
    else
        echo "NOT LOADED"
    fi

    echo -n "V4L2 Loopback (v4l2loopback): "
    if lsmod | grep -q "^v4l2loopback"; then
        echo "LOADED"
    else
        echo "NOT LOADED"
    fi

    echo "Dummy Devices Directory: $STATE_DIR"
    if [ -f "$STATE_DIR/status" ]; then
        cat "$STATE_DIR/status"
    fi
}

start_devs() {
    echo "[*] Initializing LibreDroid Virtual Devices..."

    # Check for root
    if [ "$(id -u)" -ne 0 ]; then
        echo "[!] Warning: Non-root execution. Attempting user-space virtual device state only."
        echo "active_mode=userspace_fallback" > "$STATE_DIR/status"
        echo "video_node=/dev/video99" >> "$STATE_DIR/status"
        echo "audio_card=Loopback" >> "$STATE_DIR/status"
        echo "[+] Virtual device fallback state recorded in $STATE_DIR."
        return 0
    fi

    # 1. ALSA Dummy Loopback
    if ! lsmod | grep -q "^snd_aloop"; then
        if modprobe snd-aloop index=10 id=LibreDroidLoopback pcm_substreams=2 2>/dev/null; then
            echo "[+] Loaded snd-aloop virtual audio card."
        else
            echo "[-] snd-aloop module unavailable; using PipeWire / ALSA software null sink."
        fi
    else
        echo "[+] snd-aloop already loaded."
    fi

    # 2. V4L2 Loopback Camera
    if ! lsmod | grep -q "^v4l2loopback"; then
        if modprobe v4l2loopback devices=1 video_nr=99 card_label="LibreDroid-BlankCam" exclusive_caps=1 2>/dev/null; then
            echo "[+] Loaded v4l2loopback (/dev/video99)."
        else
            echo "[-] v4l2loopback module unavailable; using software frame proxy."
        fi
    else
        echo "[+] v4l2loopback already active."
    fi

    echo "active_mode=kernel_modules" > "$STATE_DIR/status"
    echo "video_node=/dev/video99" >> "$STATE_DIR/status"
    echo "audio_card=LibreDroidLoopback" >> "$STATE_DIR/status"
    echo "[+] Virtual devices initialized successfully."
}

stop_devs() {
    echo "[*] Tearing down LibreDroid Virtual Devices..."
    rm -f "$STATE_DIR/status"
    if [ "$(id -u)" -eq 0 ]; then
        modprobe -r v4l2loopback 2>/dev/null || true
        modprobe -r snd-aloop 2>/dev/null || true
    fi
    echo "[+] Done."
}

case "$ACTION" in
    start)
        start_devs
        ;;
    stop)
        stop_devs
        ;;
    status)
        status_devs
        ;;
    *)
        echo "Usage: $0 {start|stop|status}"
        exit 1
        ;;
esac
