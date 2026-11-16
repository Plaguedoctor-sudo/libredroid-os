#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# lrd-waydroid-domain.sh — First-party Waydroid domain definition and launcher
# LibreDroid OS — Waydroid container lifecycle management with cgroup, Wayland, GPU, netns
set -euo pipefail

readonly LRD_TAG="lrd-waydroid-domain"
readonly LOG_FILE="/run/libredroid/waydroid-domain.json"
readonly WAYLAND_SOCKET="/run/user/1000/wayland-waydroid"
readonly DRM_NODE="/dev/dri/renderD128"
readonly CGROUP_SLICE="lrd-waydroid.slice"
readonly WORK_NETNS="lrd-work"

log() {
    local level="$1" msg="$2"
    logger -t "${LRD_TAG}" "${level}: ${msg}"
    local ts
    ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    printf '{"ts":"%s","level":"%s","msg":"%s"}\n' "$ts" "$level" "$msg" >> "${LOG_FILE}"
}

ensure_runtime_dir() {
    mkdir -p "$(dirname "${LOG_FILE}")"
    touch "${LOG_FILE}"
}

setup_cgroup_slice() {
    log INFO "Creating cgroup slice: ${CGROUP_SLICE}"
    # Create via systemd-run to ensure the slice exists under systemd hierarchy
    if ! systemctl is-active --quiet "${CGROUP_SLICE}" 2>/dev/null; then
        systemctl start "${CGROUP_SLICE}" || {
            log WARN "Could not start ${CGROUP_SLICE} via systemctl, using cgcreate fallback"
            cgcreate -g memory,cpu:"${CGROUP_SLICE}" 2>/dev/null || true
        }
    fi
    log INFO "cgroup slice ${CGROUP_SLICE} ready"
}

setup_wayland_socket() {
    log INFO "Setting up virtio-wayland socket at ${WAYLAND_SOCKET}"
    # Ensure XDG_RUNTIME_DIR for uid 1000 exists
    local runtime_dir
    runtime_dir="$(dirname "${WAYLAND_SOCKET}")"
    if [[ ! -d "${runtime_dir}" ]]; then
        install -d -m 0700 -o 1000 -g 1000 "${runtime_dir}"
    fi
    # Remove stale socket
    [[ -S "${WAYLAND_SOCKET}" ]] && rm -f "${WAYLAND_SOCKET}"
    # Waydroid uses WAYLAND_DISPLAY env; set symlink to compositor socket if it exists
    local compositor_socket="${runtime_dir}/wayland-0"
    if [[ -S "${compositor_socket}" ]]; then
        ln -sf "${compositor_socket}" "${WAYLAND_SOCKET}"
        log INFO "Symlinked ${WAYLAND_SOCKET} → ${compositor_socket}"
    else
        log WARN "No compositor socket found at ${compositor_socket}; Waydroid UI may not display"
    fi
    # Export for child processes
    export WAYLAND_DISPLAY="${WAYLAND_SOCKET}"
}

setup_gpu_passthrough() {
    log INFO "Configuring GPU passthrough"
    local gpu_script
    gpu_script="$(dirname "$(realpath "$0")")/lrd-waydroid-gpu.sh"
    if [[ -x "${gpu_script}" ]]; then
        bash "${gpu_script}" || log WARN "GPU passthrough config encountered errors"
    else
        log WARN "lrd-waydroid-gpu.sh not found; skipping GPU passthrough"
    fi
    # Pass DRM render node into container environment
    if [[ -c "${DRM_NODE}" ]]; then
        export MESA_VK_WSI_PRESENT_MODE=immediate
        log INFO "DRM render node ${DRM_NODE} available"
    fi
}

setup_netns_routing() {
    log INFO "Routing Waydroid through work domain netns: ${WORK_NETNS}"
    # Verify work netns exists
    if ! ip netns list 2>/dev/null | grep -q "^${WORK_NETNS}"; then
        log WARN "Network namespace '${WORK_NETNS}' not found; Waydroid will use default netns"
        return 0
    fi
    # Waydroid container's network interface (usually lxcbr0 or waydroid0)
    local waydroid_iface="waydroid0"
    if ip link show "${waydroid_iface}" &>/dev/null; then
        ip link set "${waydroid_iface}" netns "${WORK_NETNS}" 2>/dev/null || \
            log WARN "Could not move ${waydroid_iface} to netns ${WORK_NETNS}"
        log INFO "${waydroid_iface} moved to netns ${WORK_NETNS}"
    else
        log INFO "waydroid0 not yet up; netns routing will apply after container start"
    fi
}

cmd_start() {
    log INFO "Starting Waydroid domain"
    ensure_runtime_dir
    setup_cgroup_slice
    setup_wayland_socket
    setup_gpu_passthrough

    log INFO "Launching waydroid-container.service"
    systemctl start waydroid-container.service || {
        log ERROR "Failed to start waydroid-container.service"
        exit 1
    }

    setup_netns_routing

    # Start Waydroid session within the cgroup slice
    systemd-run \
        --slice="${CGROUP_SLICE}" \
        --unit="waydroid-session" \
        --property="MemoryMax=4G" \
        --property="CPUQuota=400%" \
        --setenv="WAYLAND_DISPLAY=${WAYLAND_SOCKET}" \
        --setenv="XDG_RUNTIME_DIR=/run/user/1000" \
        waydroid session start &>/dev/null &

    log INFO "Waydroid domain started"
    write_status "running"
}

cmd_stop() {
    log INFO "Stopping Waydroid domain"
    waydroid session stop 2>/dev/null || true
    systemctl stop waydroid-container.service 2>/dev/null || true
    systemctl stop waydroid-session.service 2>/dev/null || true
    # Clean up socket
    [[ -L "${WAYLAND_SOCKET}" || -S "${WAYLAND_SOCKET}" ]] && rm -f "${WAYLAND_SOCKET}"
    write_status "stopped"
    log INFO "Waydroid domain stopped"
}

cmd_status() {
    local container_active session_active
    container_active=$(systemctl is-active waydroid-container.service 2>/dev/null || true)
    [[ -z "$container_active" ]] && container_active="inactive"
    session_active=$(waydroid status 2>/dev/null | grep -c "RUNNING" || true)
    session_active=$(echo "$session_active" | head -n1 | tr -d ' \t\r\n')
    [[ -z "$session_active" ]] && session_active="0"
    local ts
    ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    printf '{"ts":"%s","container":"%s","session_running":%s,"socket":"%s","drm_node":"%s"}\n' \
        "$ts" "$container_active" \
        "$([[ "$session_active" -gt 0 ]] 2>/dev/null && echo true || echo false)" \
        "$([[ -S "${WAYLAND_SOCKET}" || -L "${WAYLAND_SOCKET}" ]] && echo "${WAYLAND_SOCKET}" || echo "")" \
        "$([[ -c "${DRM_NODE}" ]] && echo "${DRM_NODE}" || echo "")"
}

cmd_reset() {
    log INFO "Resetting Waydroid domain"
    cmd_stop
    sleep 2
    waydroid init --force 2>/dev/null || log WARN "waydroid init failed; manual intervention may be needed"
    log INFO "Reset complete; run 'start' to bring up domain"
    write_status "reset"
}

write_status() {
    local state="$1"
    local ts
    ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    printf '{"ts":"%s","state":"%s"}\n' "$ts" "$state" >> "${LOG_FILE}"
}

usage() {
    echo "Usage: $0 {start|stop|status|reset}"
    exit 1
}

main() {
    [[ $# -lt 1 ]] && usage
    case "$1" in
        start)  cmd_start  ;;
        stop)   cmd_stop   ;;
        status) cmd_status ;;
        reset)  cmd_reset  ;;
        *)      usage      ;;
    esac
}

main "$@"
