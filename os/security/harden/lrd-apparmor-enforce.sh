#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
# lrd-apparmor-enforce.sh — Flip LibreDroid AppArmor profiles complain→enforce
# Integrates with lrd-harden.service via ExecStartPost drop-in.

set -euo pipefail

readonly TAG="lrd-apparmor"
readonly PROFILE_DIR="/etc/apparmor.d/libredroid"
readonly DROP_IN_DIR="/etc/systemd/system/lrd-harden.service.d"
readonly DROP_IN_FILE="${DROP_IN_DIR}/90-apparmor-enforce.conf"

log()  { logger -t "${TAG}" -- "$*"; }
info() { log "INFO  $*"; }
warn() { log "WARN  $*"; }
die()  { log "ERROR $*"; exit 1; }

# ---------------------------------------------------------------------------
# Profile content generators
# ---------------------------------------------------------------------------
write_profile_lrdd() {
    cat > "${PROFILE_DIR}/lrdd" <<'PROFILE'
# SPDX-License-Identifier: GPL-3.0-or-later
# AppArmor profile for lrdd (LibreDroid display/session daemon)
abi <abi/4.0>,
include <tunables/global>

profile lrdd /usr/libexec/libredroid/lrdd {
  include <abstractions/base>
  include <abstractions/dbus-session-strict>
  include <abstractions/wayland>
  include <abstractions/fonts>
  include <abstractions/X>

  # Own runtime directory
  owner /run/libredroid/** rw,
  owner /run/libredroid/  rw,

  # Read config
  /etc/libredroid/** r,
  owner /var/lib/libredroid/** rw,

  # Notify IPC socket
  /run/libredroid/notify.sock rw,
  /run/libredroid/bridge.sock r,

  # Wayland compositor
  /run/user/[0-9]*/wayland-* rw,

  # Journals / logging
  /run/systemd/journal/socket w,

  # D-Bus
  dbus (send, receive) bus=session,

  # Device nodes needed for display
  /dev/dri/** rw,
  /sys/class/drm/** r,

  # Deny network completely
  deny network,

  # Deny raw capability escalation
  deny capability sys_admin,
  deny capability sys_rawio,
  deny capability sys_ptrace,
}
PROFILE
}

write_profile_lrd_dnsd() {
    cat > "${PROFILE_DIR}/lrd-dnsd" <<'PROFILE'
# SPDX-License-Identifier: GPL-3.0-or-later
# AppArmor profile for lrd-dnsd (privacy DNS resolver daemon)
abi <abi/4.0>,
include <tunables/global>

profile lrd-dnsd /usr/libexec/libredroid/lrd-dnsd {
  include <abstractions/base>
  include <abstractions/nameservice>

  # DNS over HTTPS / TLS outbound
  network inet  stream,
  network inet6 stream,
  network inet  dgram,
  network inet6 dgram,

  # Cache and config
  /var/cache/libredroid/dns/** rw,
  /etc/libredroid/dns.conf r,
  /etc/libredroid/dnsd/** r,

  # Unix socket for local clients
  /run/libredroid/dns.sock rw,

  owner /run/libredroid/ r,

  # Logging
  /run/systemd/journal/socket w,

  # Deny all file writes outside allowed paths
  deny /etc/** w,
  deny /usr/** w,
  deny /bin/** w,

  deny capability net_admin,
  deny capability sys_admin,
}
PROFILE
}

write_profile_lrd_poisoner() {
    cat > "${PROFILE_DIR}/lrd-poisoner" <<'PROFILE'
# SPDX-License-Identifier: GPL-3.0-or-later
# AppArmor profile for lrd-poisoner (network traffic anonymiser / tor wrapper)
abi <abi/4.0>,
include <tunables/global>

profile lrd-poisoner /usr/libexec/libredroid/lrd-poisoner {
  include <abstractions/base>

  # Tor control and SOCKS ports (loopback only)
  network inet  stream,
  network inet6 stream,

  # Tor data dir
  /var/lib/libredroid/tor/** rw,
  /etc/libredroid/torrc r,
  /etc/libredroid/poisoner/** r,

  /run/libredroid/tor-control.sock rw,
  /run/libredroid/socks.sock rw,
  owner /run/libredroid/ r,

  # ptrace is explicitly denied — cannot inspect other processes
  deny ptrace,
  deny capability sys_ptrace,
  deny capability net_admin,
  deny capability sys_admin,

  /run/systemd/journal/socket w,
}
PROFILE
}

write_profile_lrd_bridge() {
    cat > "${PROFILE_DIR}/lrd-bridge" <<'PROFILE'
# SPDX-License-Identifier: GPL-3.0-or-later
# AppArmor profile for lrd-bridge (IPC bridge between shell and OS services)
abi <abi/4.0>,
include <tunables/global>

profile lrd-bridge /usr/libexec/libredroid/lrd-bridge {
  include <abstractions/base>
  include <abstractions/dbus-session-strict>

  # Bridge sockets
  /run/libredroid/bridge.sock rw,
  /run/libredroid/bridge-tokens.json rw,
  owner /run/libredroid/ rw,

  # May exec whitelisted helpers only
  /usr/libexec/libredroid/lrd-bridge-auth Cx -> lrd-bridge-auth,
  /usr/libexec/libredroid/* r,

  # Config and tokens
  /etc/libredroid/bridge/** r,

  # D-Bus calls to session services
  dbus (send) bus=session peer=(label=lrdd),

  # Logging
  /run/systemd/journal/socket w,

  # cgroup v2 stats (read-only)
  /sys/fs/cgroup/lrd.slice/** r,

  deny network,
  deny capability sys_admin,
  deny capability sys_ptrace,
  deny ptrace,

  profile lrd-bridge-auth /usr/libexec/libredroid/lrd-bridge-auth {
    include <abstractions/base>
    /run/libredroid/bridge-tokens.json r,
    /run/systemd/journal/socket w,
    deny network,
  }
}
PROFILE
}

write_profile_lrd_telephonyd() {
    cat > "${PROFILE_DIR}/lrd-telephonyd" <<'PROFILE'
# SPDX-License-Identifier: GPL-3.0-or-later
# AppArmor profile for lrd-telephonyd (modem / telephony daemon)
abi <abi/4.0>,
include <tunables/global>

profile lrd-telephonyd /usr/libexec/libredroid/lrd-telephonyd {
  include <abstractions/base>
  include <abstractions/dbus-system>

  # ModemManager D-Bus
  dbus (send) bus=system interface="org.freedesktop.ModemManager1*",

  # Serial/AT command devices
  /dev/ttyUSB[0-9]* rw,
  /dev/ttyACM[0-9]* rw,
  /dev/modem rw,

  # State and config
  /run/libredroid/telephony.sock rw,
  /var/lib/libredroid/telephony/** rw,
  /etc/libredroid/telephony/** r,
  owner /run/libredroid/ r,

  # Outbound networking for VoIP only on explicit allow
  network inet  stream,

  /run/systemd/journal/socket w,

  deny capability sys_admin,
  deny capability sys_rawio,
  deny ptrace,
}
PROFILE
}

write_profile_lrd_sensord() {
    cat > "${PROFILE_DIR}/lrd-sensord" <<'PROFILE'
# SPDX-License-Identifier: GPL-3.0-or-later
# AppArmor profile for lrd-sensord (hardware sensor aggregator)
abi <abi/4.0>,
include <tunables/global>

profile lrd-sensord /usr/libexec/libredroid/lrd-sensord {
  include <abstractions/base>

  # IIO subsystem and input devices
  /sys/bus/iio/devices/** r,
  /dev/input/event[0-9]* r,
  /sys/class/input/** r,

  # Sensor data socket
  /run/libredroid/sensors.sock rw,
  owner /run/libredroid/ r,

  # Config
  /etc/libredroid/sensors/** r,

  /run/systemd/journal/socket w,

  deny network,
  deny capability sys_admin,
  deny capability sys_rawio,
  deny ptrace,
}
PROFILE
}

# ---------------------------------------------------------------------------
# Ensure profiles directory and write all profiles
# ---------------------------------------------------------------------------
create_profiles() {
    info "Creating profile directory: ${PROFILE_DIR}"
    mkdir -p "${PROFILE_DIR}"

    write_profile_lrdd
    write_profile_lrd_dnsd
    write_profile_lrd_poisoner
    write_profile_lrd_bridge
    write_profile_lrd_telephonyd
    write_profile_lrd_sensord

    info "All profiles written to ${PROFILE_DIR}"
}

# ---------------------------------------------------------------------------
# Enforce each profile
# ---------------------------------------------------------------------------
enforce_profiles() {
    local ok=0 fail=0 profile name

    shopt -s nullglob
    for profile in "${PROFILE_DIR}"/*; do
        [[ -f "${profile}" ]] || continue
        name="$(basename "${profile}")"
        if aa-enforce "${profile}" 2>&1 | logger -t "${TAG}"; then
            info "Enforced: ${name}"
            (( ok++ )) || true
        else
            warn "Failed to enforce: ${name}"
            (( fail++ )) || true
        fi
    done
    shopt -u nullglob

    info "Enforcement complete — OK: ${ok}, FAILED: ${fail}"
    if (( fail > 0 )); then
        die "${fail} profile(s) could not be enforced"
    fi
}

# ---------------------------------------------------------------------------
# Install drop-in for lrd-harden.service
# ---------------------------------------------------------------------------
install_dropin() {
    mkdir -p "${DROP_IN_DIR}"
    cat > "${DROP_IN_FILE}" <<DROPIN
# Auto-generated by lrd-apparmor-enforce.sh — do not edit manually
[Service]
ExecStartPost=/usr/libexec/libredroid/lrd-apparmor-enforce.sh --enforce-only
DROPIN
    info "Drop-in installed at ${DROP_IN_FILE}"
    systemctl daemon-reload 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    if [[ "${EUID}" -ne 0 ]]; then
        die "Must run as root"
    fi

    local enforce_only=false
    for arg in "$@"; do
        case "${arg}" in
            --enforce-only) enforce_only=true ;;
            --help|-h)
                echo "Usage: $0 [--enforce-only]"
                echo "  --enforce-only  Skip profile creation and drop-in; only run aa-enforce"
                exit 0 ;;
            *) die "Unknown argument: ${arg}" ;;
        esac
    done

    if [[ "${enforce_only}" == false ]]; then
        create_profiles
        install_dropin
    fi

    enforce_profiles
    info "lrd-apparmor-enforce complete"
}

main "$@"
