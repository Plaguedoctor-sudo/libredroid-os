# LibreDroid OS — Reference Image Builder

Live ISO builder for **LibreDroid OS** (x86_64, hybrid BIOS + UEFI live ISO), producing a secure multi-domain operating system built on Debian Trixie.

---

## Architecture Overview

LibreDroid OS converts simulated UI domain isolation into genuine, kernel-enforced system and network barriers:

1. **Kernel Network Namespaces (`netns.sh`)**:
   - `lrd-vault`: Completely airgapped (only `lo`, no external veth interfaces).
   - `lrd-tor-gw`: Whonix-Gateway role with real uplink, transparent Tor proxying (`:9040`), DNS redirect (`:53`), and Tor control (`:9051`).
   - `lrd-anon-ws`: Whonix-Workstation role with no direct uplink. Default route strictly through `lrd-tor-gw` (10.152.152.10).
   - `lrd-work`, `lrd-dispos`, `lrd-android`: Isolated subnets with masqueraded NAT egress.
2. **Container Isolation (`systemd-nspawn`)**:
   - Per-domain root filesystems provisioned via `mmdebstrap` under `/var/lib/libredroid/domains/<name>`.
   - `libredroid-domain@.service` enforces cgroup v2 resource limits (`MemoryMax`, `MemoryHigh`, `CPUQuota`, `TasksMax`), capability bounding sets, and mount protections (`ProtectSystem=strict`, `ProtectHome=tmpfs`).
   - `dispos` runs with `--volatile=overlay`, discarding all filesystem state on container reboot.
3. **Headless Wayland & Surface Streaming (`libredroid-stream@.service`)**:
   - Per-domain headless `labwc` compositor instance inside each domain namespace.
   - Host `wayvnc` exposes RFB frames on ports `5900 + STREAM_IDX`.
   - `websockify` fronts RFB as WebSockets on `5910 + STREAM_IDX` for noVNC canvas embedding.
4. **Hardware & System Bridge (`/opt/libredroid/bridge/server.js`)**:
   - Zero-dependency Node.js HTTP/WebSocket server on `127.0.0.1:3001`.
   - Directly manages systemd domain services, network namespaces, NetworkManager, UPower, brightnessctl, and Tor circuit rotation without ADB mocks.
5. **Kiosk Session**:
   - Auto-login on `tty1` launching Cage compositor running Chromium in kiosk mode displaying the LibreDroid shell.

---

## Directory Structure

```text
os/
├── build.sh                                      # Single entry point builder
├── README.md                                     # System documentation
└── build/
    ├── auto/config                               # Live-build auto-config
    ├── placeholder/
    │   └── index.html                            # Standalone test/proof-of-life UI
    └── config/
        ├── package-lists/
        │   └── libredroid.list.chroot            # Debian package manifest
        ├── hooks/live/
        │   ├── 0100-users.hook.chroot            # User, polkit, modules, autologin setup
        │   ├── 0200-provision-domains.hook.chroot # debootstrap domains via mmdebstrap
        │   └── 0300-enable.hook.chroot           # Enable services & configure AppArmor
        └── includes.chroot/
            ├── etc/
            │   ├── apparmor.d/libredroid.bridge  # AppArmor profile for bridge server
            │   ├── libredroid/labwc-headless.conf# labwc window manager configuration
            │   ├── modules-load.d/libredroid.conf# Waydroid binder modules
            │   ├── nftables.d/                   # NAT and packet filter tables
            │   │   ├── lrd-nat.nft
            │   │   ├── lrd-tor-gw.nft
            │   │   └── lrd-android.nft
            │   ├── polkit-1/rules.d/49-libredroid.rules
            │   ├── sysctl.d/90-libredroid.conf   # Kernel hardening parameters
            │   ├── systemd/system/
            │   │   ├── getty@tty1.service.d/autologin.conf
            │   │   ├── libredroid-boot.service
            │   │   ├── libredroid-bridge.service
            │   │   ├── libredroid-domain@.service
            │   │   ├── libredroid-domain@vault.service.d/limits.conf
            │   │   ├── libredroid-domain@dispos.service.d/ephemeral.conf
            │   │   ├── libredroid-domain@tor-gw.service.d/tor.conf
            │   │   ├── libredroid-netns.service
            │   │   ├── libredroid-stream@.service
            │   │   ├── libredroid-stream@*.service.d/stream-index.conf
            │   │   └── user@.service.d/delegate.conf
            │   ├── tmpfiles.d/libredroid.conf
            │   └── tor/torrc.d/libredroid-gateway.conf
            ├── home/libredroid/
            │   └── .bash_profile                 # Kiosk session bootstrap
            └── opt/libredroid/
                ├── bin/
                │   ├── lrd-doctor                # Verification test suite
                │   ├── lrd-domain                # Domain lifecycle CLI
                │   └── lrd-stream                # Stream lifecycle CLI
                ├── bridge/
                │   ├── netns.sh                  # Network namespace fabric configuration
                │   └── server.js                 # System REST & WebSocket bridge
                └── shell/
                    └── index.html                # Staged frontend shell
```

---

## Build Prerequisites

On Debian/Ubuntu host:

```bash
sudo apt update
sudo apt install -y live-build mmdebstrap xorriso nodejs npm
```

---

## Building the Image

Run the build script from the repository root:

```bash
chmod +x os/build.sh
sudo ./os/build.sh
```

The script will:
1. Build the production React frontend shell (`npm run build`).
2. Stage the built web shell from `dist/` into `/opt/libredroid/shell/` (falling back to placeholder UI if absent).
3. Set appropriate permissions on build hooks, system binaries, and helper scripts.
4. Run `lb clean --purge` and `lb build` to generate the hybrid ISO.

---

## Booting & Testing

### Running in QEMU

```bash
qemu-system-x86_64 -enable-kvm -m 6144 -smp 4 \
  -drive file=os/build/libredroid-amd64.hybrid.iso,format=raw \
  -vga virtio -device virtio-net-pci \
  -display gtk
```

### Flashing to USB

```bash
sudo dd if=os/build/libredroid-amd64.hybrid.iso of=/dev/sdX bs=4M status=progress conv=fsync
```

---

## Verification with `lrd-doctor`

Switch to console `tty2` (`Ctrl + Alt + F2`) inside the running live system and run:

```bash
lrd-doctor
```

Expected output:
- `✓ namespace lrd-vault exists`
- `✓ vault has ONLY loopback`
- `✓ anon-ws has exactly one default route`
- `✓ anon-ws default points at tor-gw`
- `✓ tor TransPort 9040 listening`
- `✓ anon-ws exits via Tor (ip differs)`
- `✓ dispos wiped its writes on restart`
- `✓ isolation fabric verified`

Manual sanity checks:
```bash
# Verify vault cannot access WAN:
ip netns exec lrd-vault curl -s --max-time 5 ifconfig.me   # Hangs / times out

# Verify vault local loopback works:
ip netns exec lrd-vault ping -c 1 127.0.0.1

# Verify disposable container wipes modifications:
lrd-domain shell dispos
touch /tmp_evidence
exit
systemctl restart libredroid-domain@dispos
lrd-domain shell dispos
ls -la /tmp_evidence   # Does not exist
```
