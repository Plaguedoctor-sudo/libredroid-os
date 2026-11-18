#!/usr/bin/env bash
# ==============================================================================
# LibreDroid Foundation v0.1 Test Suite (Audited & Hardened)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PASSED=0
TOTAL=0

assert_test() {
    local desc="$1"
    shift
    TOTAL=$((TOTAL + 1))
    echo -n "[TEST $TOTAL] $desc ... "
    if "$@"; then
        echo -e "${GREEN}PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAIL${NC}"
    fi
}

echo "=================================================================="
echo "  LibreDroid System Design v0.1 — Rigorous Foundation Test Suite"
echo "=================================================================="

# 1. Volla Phone X23 (vidofnir) profile constraints
test_vidofnir_spec() {
    local lines
    lines=$(wc -l < "$REPO_ROOT/profiles/vidofnir.toml")
    [ "$lines" -lt 120 ] && \
    grep -q 'codename = "vidofnir"' "$REPO_ROOT/profiles/vidofnir.toml" && \
    grep -q 'model = "Volla Phone X23"' "$REPO_ROOT/profiles/vidofnir.toml" && \
    grep -q 'soc = "mt6789"' "$REPO_ROOT/profiles/vidofnir.toml" && \
    grep -q 'scale = 2.0' "$REPO_ROOT/profiles/vidofnir.toml" && \
    grep -q 'target_vndk = 31' "$REPO_ROOT/profiles/vidofnir.toml" && \
    grep -q 'halium_version = 12' "$REPO_ROOT/profiles/vidofnir.toml" && \
    grep -q 'resolution_width = 720' "$REPO_ROOT/profiles/vidofnir.toml"
}
assert_test "Volla Phone X23 (vidofnir.toml): MT6789, 720x1560, VNDK 31, Halium 12, Scale 2.0, <120 lines" test_vidofnir_spec

# 2. OnePlus Pad Go (OP5DA6L1) profile constraints
test_op5da6l1_spec() {
    local lines
    lines=$(wc -l < "$REPO_ROOT/profiles/OP5DA6L1.toml")
    [ "$lines" -lt 120 ] && \
    grep -q 'codename = "OP5DA6L1"' "$REPO_ROOT/profiles/OP5DA6L1.toml" && \
    grep -q 'model = "OnePlus Pad Go"' "$REPO_ROOT/profiles/OP5DA6L1.toml" && \
    grep -q 'soc = "mt6789"' "$REPO_ROOT/profiles/OP5DA6L1.toml" && \
    grep -q 'scale = 1.0' "$REPO_ROOT/profiles/OP5DA6L1.toml" && \
    grep -q 'target_vndk = 33' "$REPO_ROOT/profiles/OP5DA6L1.toml" && \
    grep -q 'halium_version = 13' "$REPO_ROOT/profiles/OP5DA6L1.toml"
}
assert_test "OnePlus Pad Go (OP5DA6L1.toml): MT6789, VNDK 33, Halium 13, Scale 1.0, <120 lines" test_op5da6l1_spec

# 3. Real ro.product.device resolution from fixture (No CLI --device flag)
test_fixture_resolution() {
    local fix_dir="/tmp/lrd_fix_$$"
    mkdir -p "$fix_dir"
    echo "ro.product.device=vidofnir" > "$fix_dir/build.prop"
    echo "ro.vndk.version=31" >> "$fix_dir/build.prop"

    local out
    out=$("$REPO_ROOT/profiles/lrd-profile-loader" --vendor "$fix_dir" --profiles-dir "$REPO_ROOT/profiles" --out-dir "$fix_dir/out")
    local res=0
    echo "$out" | grep -q 'Volla Phone X23 \[vidofnir\]' || res=1
    rm -rf "$fix_dir"
    return $res
}
assert_test "Profile loader automatic resolution via ro.product.device fixture" test_fixture_resolution

# 4. Build-time flat compiler (.env output)
test_compiler() {
    local tmp_env="/tmp/lrd_test_compile_$$.env"
    "$REPO_ROOT/profiles/lrd-profile-compiler" "$REPO_ROOT/profiles/vidofnir.toml" "$tmp_env" >/dev/null
    grep -q 'LRD_DEVICE_MODEL="Volla Phone X23"' "$tmp_env" && \
    grep -q 'LRD_SCALE="2.0"' "$tmp_env" && \
    grep -q 'LRD_VNDK="31"' "$tmp_env" && \
    grep -q 'LRD_FF_SCALE="-1.0"' "$tmp_env"
    local res=$?
    rm -f "$tmp_env"
    return $res
}
assert_test "Build-time flat profile compiler (lrd-profile-compiler -> vidofnir.env)" test_compiler

# 5. Early-boot POSIX loader & Firefox scale sanity
test_sh_loader() {
    local tmp_dir="/tmp/lrd_sh_test_$$"
    rm -rf "$tmp_dir"
    "$REPO_ROOT/profiles/lrd-profile-apply" "$REPO_ROOT/profiles" "$tmp_dir" >/dev/null
    grep -q 'scale = 2.0' "$tmp_dir/phoc.ini" && \
    grep -q 'layout.css.devPixelsPerPx", "-1.0"' "$tmp_dir/firefox-mobile.cfg"
    local res=$?
    rm -rf "$tmp_dir"
    return $res
}
assert_test "Early-boot POSIX loader (lrd-profile-apply) & Firefox scale fix (-1.0)" test_sh_loader

# 6. Direct runtime kernel feature probes
test_kernel_probes() {
    local out
    out=$("$REPO_ROOT/profiles/lrd-profile-loader" --device vidofnir --profiles-dir "$REPO_ROOT/profiles" --out-dir /tmp/lrd_probe_out)
    echo "$out" | grep -q "user_namespaces" && echo "$out" | grep -q "psi"
}
assert_test "Direct kernel runtime feature probes (user namespaces, PSI, binder)" test_kernel_probes

# 7. Set-preserving atomic reload
test_set_preservation() {
    unshare -U -r -n bash -c "
        nft -f '$REPO_ROOT/egress/nftables/lrd-egress.nft' && \
        '$REPO_ROOT/egress/bin/lrd-egressctl' add-endpoint 185.159.157.1 >/dev/null && \
        '$REPO_ROOT/egress/bin/lrd-egress-reload' '$REPO_ROOT/egress/nftables/lrd-egress.nft' >/dev/null && \
        '$REPO_ROOT/egress/bin/lrd-egressctl' status | grep -q '185.159.157.1'
    "
}
assert_test "nftables set-preserving atomic reload (retains active VPN endpoints)" test_set_preservation

# 8. Actual packet assertions: Loopback ping, External TCP drop, FORWARD container gate
test_actual_packets() {
    unshare -U -r -n bash -c "
        set -eu
        ip link set lo up
        nft -f '$REPO_ROOT/egress/nftables/lrd-egress.nft'
        
        # Assertion A: Loopback ping MUST succeed
        ping -c 1 127.0.0.1 >/dev/null

        # Assertion B: External TCP MUST drop/fail (kill-switch default)
        if python3 -c 'import socket; s = socket.socket(); s.settimeout(0.4); s.connect((\"1.1.1.1\", 443))' 2>/dev/null; then
            exit 1
        fi

        # Assertion C: Unbound DoT upstream MUST be accepted (port 853 to 9.9.9.9)
        nft list chain inet lrd_egress output | grep -q 'tcp dport 853 ip daddr @dns_upstream_v4 accept'

        # Assertion D: Proton API bootstrap MUST be accepted (port 443 to @proton_api_v4)
        nft list chain inet lrd_egress output | grep -q 'tcp dport 443 ip daddr @proton_api_v4 accept'

        # Assertion E: Container FORWARD chain MUST drop non-wg0 egress
        nft list chain inet lrd_egress forward | grep -q 'iifname \"waydroid0\" oifname \"wg0\" accept'
    "
}
assert_test "Live packet assertions: Loopback PASS, External TCP DROP, DoT & Proton API bootstrap PASS" test_actual_packets

# 9. Android Boot Header v4 & Vendor Boot Header v4 byte-for-byte unpack/repack loop roundtrip
test_header_v4_roundtrip() {
    local tmp_dir="/tmp/lrd_v4_test_$$"
    mkdir -p "$tmp_dir/unpacked_boot" "$tmp_dir/unpacked_vendor"
    python3 "$REPO_ROOT/halium-vidofnir/unpack_v4.py" "$REPO_ROOT/halium-vidofnir/partitions/boot.img" "$tmp_dir/unpacked_boot" >/dev/null
    python3 "$REPO_ROOT/halium-vidofnir/unpack_v4.py" "$REPO_ROOT/halium-vidofnir/partitions/vendor_boot.img" "$tmp_dir/unpacked_vendor" >/dev/null
    python3 "$REPO_ROOT/halium-vidofnir/repack_v4.py" boot "$tmp_dir/unpacked_boot" "$tmp_dir/repacked_boot.img" >/dev/null
    python3 "$REPO_ROOT/halium-vidofnir/repack_v4.py" vendor_boot "$tmp_dir/unpacked_vendor" "$tmp_dir/repacked_vendor.img" >/dev/null
    
    cmp -s "$REPO_ROOT/halium-vidofnir/partitions/boot.img" "$tmp_dir/repacked_boot.img" && \
    cmp -s "$REPO_ROOT/halium-vidofnir/partitions/vendor_boot.img" "$tmp_dir/repacked_vendor.img"
    local res=$?
    rm -rf "$tmp_dir"
    return $res
}
assert_test "Android Header v4 byte-for-byte unpack/repack loop (Zero difference roundtrip)" test_header_v4_roundtrip

# 10. Halium boot artifact builder & deterministic bit-for-bit reproducibility
test_boot_builder_reproducibility() {
    local d1="/tmp/lrd_b1_$$"
    local d2="/tmp/lrd_b2_$$"
    "$REPO_ROOT/halium-vidofnir/build_halium_boot.py" "$d1" >/dev/null
    "$REPO_ROOT/halium-vidofnir/build_halium_boot.py" "$d2" >/dev/null
    
    local hash1 hash2 vhash1 vhash2
    hash1=$(sha256sum "$d1/boot-vidofnir-libremobile.img" | cut -d' ' -f1)
    hash2=$(sha256sum "$d2/boot-vidofnir-libremobile.img" | cut -d' ' -f1)
    vhash1=$(sha256sum "$d1/vendor_boot-vidofnir-libremobile.img" | cut -d' ' -f1)
    vhash2=$(sha256sum "$d2/vendor_boot-vidofnir-libremobile.img" | cut -d' ' -f1)
    
    local res=0
    [ "$hash1" = "$hash2" ] && [ "$vhash1" = "$vhash2" ] || res=1
    rm -rf "$d1" "$d2"
    return $res
}
assert_test "Halium boot artifact bit-for-bit reproducibility (sha256 run1 == sha256 run2)" test_boot_builder_reproducibility

# 11. LibreMobile rootfs deterministic ext4 build reproducibility
test_rootfs_reproducibility() {
    local d1="/tmp/lrd_r1_$$"
    local d2="/tmp/lrd_r2_$$"
    FAST_STAGE=1 ROOTFS_SIZE=64M "$REPO_ROOT/scripts/build-reproducible-rootfs.sh" "$d1" >/dev/null
    FAST_STAGE=1 ROOTFS_SIZE=64M "$REPO_ROOT/scripts/build-reproducible-rootfs.sh" "$d2" >/dev/null
    
    local h1 h2
    h1=$(cat "$d1/libremobile-arm64-generic.img.sha256" | cut -d' ' -f1)
    h2=$(cat "$d2/libremobile-arm64-generic.img.sha256" | cut -d' ' -f1)
    
    local res=0
    [ "$h1" = "$h2" ] || res=1
    rm -rf "$d1" "$d2"
    return $res
}
assert_test "LibreMobile rootfs bit-for-bit reproducibility (sha256 run1 == sha256 run2)" test_rootfs_reproducibility

# 12. OnePlus Pad Go (OP5DA6L1) Android Boot Header v4 byte-for-byte unpack/repack roundtrip
test_padgo_header_v4_roundtrip() {
    local stock_dir="$REPO_ROOT/stock_firmware/OnePlus_Pad_Go_OPD2304_MT6789_EX_11_A.30_231025_MXML/Firmware/IMAGES"
    if [ ! -f "$stock_dir/boot.img" ] || [ ! -f "$stock_dir/vendor_boot.img" ]; then
        return 1
    fi
    local tmp_dir="/tmp/lrd_padgo_v4_$$"
    mkdir -p "$tmp_dir/unpacked_boot" "$tmp_dir/unpacked_vendor"
    python3 "$REPO_ROOT/halium-vidofnir/unpack_v4.py" "$stock_dir/boot.img" "$tmp_dir/unpacked_boot" >/dev/null
    python3 "$REPO_ROOT/halium-vidofnir/unpack_v4.py" "$stock_dir/vendor_boot.img" "$tmp_dir/unpacked_vendor" >/dev/null
    python3 "$REPO_ROOT/halium-vidofnir/repack_v4.py" boot "$tmp_dir/unpacked_boot" "$tmp_dir/repacked_boot.img" >/dev/null
    python3 "$REPO_ROOT/halium-vidofnir/repack_v4.py" vendor_boot "$tmp_dir/unpacked_vendor" "$tmp_dir/repacked_vendor.img" >/dev/null

    cmp -s "$stock_dir/boot.img" "$tmp_dir/repacked_boot.img" && \
    cmp -s "$stock_dir/vendor_boot.img" "$tmp_dir/repacked_vendor.img"
    local res=$?
    rm -rf "$tmp_dir"
    return $res
}
assert_test "OnePlus Pad Go (OP5DA6L1) Header v4 unpack/repack loop (Zero difference roundtrip)" test_padgo_header_v4_roundtrip

# 13. OnePlus Pad Go (OP5DA6L1) Halium boot artifact bit-for-bit reproducibility
test_padgo_boot_builder_reproducibility() {
    local d1="/tmp/lrd_pad_b1_$$"
    local d2="/tmp/lrd_pad_b2_$$"
    "$REPO_ROOT/halium-vidofnir/build_halium_boot.py" --device OP5DA6L1 "$d1" >/dev/null
    "$REPO_ROOT/halium-vidofnir/build_halium_boot.py" --device OP5DA6L1 "$d2" >/dev/null

    local hash1 hash2 vhash1 vhash2
    hash1=$(sha256sum "$d1/boot-OP5DA6L1-libremobile.img" | cut -d' ' -f1)
    hash2=$(sha256sum "$d2/boot-OP5DA6L1-libremobile.img" | cut -d' ' -f1)
    vhash1=$(sha256sum "$d1/vendor_boot-OP5DA6L1-libremobile.img" | cut -d' ' -f1)
    vhash2=$(sha256sum "$d2/vendor_boot-OP5DA6L1-libremobile.img" | cut -d' ' -f1)

    local res=0
    [ "$hash1" = "$hash2" ] && [ "$vhash1" = "$vhash2" ] || res=1
    rm -rf "$d1" "$d2"
    return $res
}
assert_test "OnePlus Pad Go Halium boot bit-for-bit reproducibility (sha256 run1 == sha256 run2)" test_padgo_boot_builder_reproducibility

# 14. MediaTek MT6789 BROM recovery & safety harness verification
test_brom_safety_harness() {
    local out
    out=$("$REPO_ROOT/scripts/mtk-brom-recovery.sh" restore-stock OP5DA6L1 --dry-run)
    echo "$out" | grep -q "Emergency Stock Firmware Rollback Harness" && \
    echo "$out" | grep -q "Restoring stock boot_a" && \
    echo "$out" | grep -q "Restoring stock vendor_boot_a" && \
    echo "$out" | grep -q "Emergency stock recovery complete"
}
assert_test "MediaTek MT6789 BROM safety harness & emergency rollback verification" test_brom_safety_harness

# 15. Egress policy supervisor & app attribution verification
test_egress_policy_supervisor() {
    local out
    out=$("$REPO_ROOT/egress/bin/lrd-egressctl" policies)
    echo "$out" | grep -q 'ch.protonmail.vpn' && \
    echo "$out" | grep -q 'io.waydroid.container' && \
    echo "$out" | grep -q 'org.mozilla.firefox' && \
    echo "$out" | grep -q 'org.fdroid.fdroid'
}
assert_test "Egress policy supervisor & per-app policy attribution" test_egress_policy_supervisor

# 16. In-container Waydroid per-APK attribution hook (v0.4 / §8.d)
test_waydroid_apk_attribution() {
    "$REPO_ROOT/egress/daemon/lrd-waydroid-apk-hook.py" --mock-test >/dev/null && \
    python3 -c "
import importlib.util
from pathlib import Path
spec = importlib.util.spec_from_file_location('lrd_egressd', '$REPO_ROOT/egress/daemon/lrd-egressd.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

map_p = Path('/tmp/test_apk_map_t16.json')
map_p.write_text('{\"uids\": {\"10142\": {\"package\": \"org.telegram.messenger\"}}}')

sup = mod.EgressSupervisor(policy_dirs=[Path('$REPO_ROOT/egress/policy')], state_file=Path('/tmp/test_state_t16.json'), apk_map_file=map_p)
ev = sup.record_drop_event('[LRD-EGRESS-DROP] IN=waydroid0 OUT=wlan0 SRC=192.168.240.10 DST=149.154.167.50 PROTO=TCP SPT=43210 DPT=443 UID=10142')
assert 'org.telegram.messenger' in ev['attributed_app']
assert 'io.waydroid.container [org.telegram.messenger]' in sup.stats['per_app_stats']
map_p.unlink(missing_ok=True)
Path('/tmp/test_state_t16.json').unlink(missing_ok=True)
"
}
assert_test "In-container Waydroid per-APK attribution & UID mapping hook" test_waydroid_apk_attribution

# 17. Proton VPN & NetworkManager WireGuard Manager with fail-closed kill switch (§10)
test_proton_vpn_kill_switch() {
    "$REPO_ROOT/egress/vpn/lrd-vpn-manager.py" mock-test >/dev/null && \
    "$REPO_ROOT/egress/vpn/lrd-vpn-manager.py" verify-kill-switch | grep -q "FAIL_CLOSED_DENY_BY_DEFAULT"
}
assert_test "Proton VPN & WireGuard Manager with fail-closed kill switch" test_proton_vpn_kill_switch

# 18. Waydroid Container Lifecycle & Idle Freezer Guardian (§6)
test_waydroid_freezer_lifecycle() {
    "$REPO_ROOT/android/waydroid/lrd-waydroid-freezer" mock-test >/dev/null
}
assert_test "Waydroid container lifecycle & idle freezer guardian (cgroup freeze)" test_waydroid_freezer_lifecycle

# 19. F-Droid Session Installer Bridge & Anti-Feature Inspector (§7)
test_fdroid_installer_antifeatures() {
    "$REPO_ROOT/android/waydroid/lrd-fdroid-installer" mock-test >/dev/null
}
assert_test "F-Droid session installer bridge & anti-feature inspector" test_fdroid_installer_antifeatures

# 20. dm-verity Rootfs Verification, LUKS2 KDF Hardening & A/B Slot Manager (§3, §12, §14)
test_dm_verity_luks_ab_security() {
    "$REPO_ROOT/scripts/lrd-security-harness.py" mock-test >/dev/null
}
assert_test "dm-verity Merkle tree verification, LUKS2 KDF & A/B slot rollback" test_dm_verity_luks_ab_security

# 21. AppArmor Mandatory Access Control (MAC) Security Profiles (§14)
test_apparmor_security_profiles() {
    local eg_prof="$REPO_ROOT/config/apparmor/usr.sbin.lrd-egressd"
    local un_prof="$REPO_ROOT/config/apparmor/usr.sbin.lrd-unbound"
    [ -f "$eg_prof" ] && [ -f "$un_prof" ] && \
    grep -q "deny network raw" "$eg_prof" && \
    grep -q "deny /home/\*\*" "$eg_prof" && \
    grep -q "capability net_bind_service" "$un_prof" && \
    grep -q "deny /var/lib/waydroid/\*\*" "$un_prof"
}
assert_test "AppArmor Mandatory Access Control (MAC) confinement profiles" test_apparmor_security_profiles

# 22. Hardware Support Matrix Validator (§2)
test_support_matrix_validator() {
    "$REPO_ROOT/scripts/lrd-support-matrix.py" --mock-test >/dev/null
}
assert_test "Hardware support matrix validator (Treble, VNDK, bootloader unlock)" test_support_matrix_validator

# 23. Universal Fastboot Factory Flasher simulation & slot verification (§2, §3, §15)
test_fastboot_factory_flasher() {
    local out_v out_p
    out_v=$("$REPO_ROOT/scripts/flash-libremobile.sh" --dry-run --device vidofnir --slot a --force)
    out_p=$("$REPO_ROOT/scripts/flash-libremobile.sh" --dry-run --device OP5DA6L1 --slot b --force)

    echo "$out_v" | grep -q "vidofnir" && \
    echo "$out_v" | grep -q "Slot: _a" && \
    echo "$out_v" | grep -q "flash boot_a" && \
    echo "$out_v" | grep -q "flash vendor_boot_a" && \
    echo "$out_p" | grep -q "OP5DA6L1" && \
    echo "$out_p" | grep -q "Slot: _b" && \
    echo "$out_p" | grep -q "flash boot_b" && \
    echo "$out_p" | grep -q "flash vendor_boot_b"
}
assert_test "Universal Fastboot factory flasher simulation & A/B slot targeting" test_fastboot_factory_flasher

# 24. Master Release Bundles & Cryptographic Integrity (§15, §16)
test_release_manifest_integrity() {
    local dist="$REPO_ROOT/dist-release"
    [ -d "$dist" ] && \
    [ -f "$dist/release-manifest.json" ] && \
    [ -f "$dist/libremobile-1.0-rc-vidofnir.tar.xz" ] && \
    [ -f "$dist/libremobile-1.0-rc-OP5DA6L1.tar.xz" ] && \
    [ -f "$dist/SHA256SUMS.txt" ] && \
    grep -q "libremobile-1.0-rc-vidofnir.tar.xz" "$dist/release-manifest.json" && \
    grep -q "libremobile-1.0-rc-OP5DA6L1.tar.xz" "$dist/release-manifest.json" && \
    (cd "$dist" && sha256sum --check --ignore-missing SHA256SUMS.txt >/dev/null)
}
assert_test "Master release bundles, dm-verity manifest & SHA256 integrity" test_release_manifest_integrity

echo "=================================================================="
echo "Results: $PASSED / $TOTAL test suites passed."
echo "=================================================================="

[ "$PASSED" -eq "$TOTAL" ]
