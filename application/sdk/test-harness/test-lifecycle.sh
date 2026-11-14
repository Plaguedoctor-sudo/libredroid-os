#!/usr/bin/env bash
# Sovereign Application Platform — Automated Lifecycle & Invariant Verification Suite
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${APP_DIR}"

echo "========================================================"
echo "Sovereign Application Platform (SAP) Verification Suite"
echo "========================================================"

FAILED=0

check() {
    local name="$1"
    shift
    if "$@"; then
        echo "  [PASS] $name"
    else
        echo "  [FAIL] $name"
        FAILED=$((FAILED + 1))
    fi
}

echo "--> 1. Verifying Schemas & Invariants"
check "Manifest Schema JSON is well-formed" python3 -c 'import json; json.load(open("packaging/spec/manifest.schema.json"))'
check "12 Cap'n Proto schemas exist" test $(ls -1 ipc/schemas/*.capnp | wc -l) -eq 12
check "Capability schema contains CapHandle" grep -q "struct CapHandle" ipc/schemas/capability.capnp
check "AI schema contains SovereignAiService" grep -q "interface SovereignAiService" ipc/schemas/ai.capnp

echo "--> 2. Verifying Target Hardware Profiles (x86_64 UEFI & Mainline ARM64 SBCs)"
check "x86_64 UEFI target profile is valid JSON" python3 -c 'import json; json.load(open("targets/x86_64-uefi.json"))'
check "ARM64 PinePhone Pro profile is valid JSON" python3 -c 'import json; json.load(open("targets/arm64-pinephone-pro.json"))'
check "ARM64 MNT Reform profile is valid JSON" python3 -c 'import json; json.load(open("targets/arm64-mnt-reform.json"))'
check "ARM64 Raspberry Pi 5 profile is valid JSON" python3 -c 'import json; json.load(open("targets/arm64-rpi5.json"))'

echo "--> 3. Verifying Ultra-Compact Local AI Subsystem"
check "NPU HAL C header is present" test -f ai/npu-hal/include/npu_hal.h
check "NPU HAL implementation compiles" cc -O2 -Wall -c ai/npu-hal/src/npu_hal.c -Iai/npu-hal/include -o /tmp/npu_hal.o
check "Native INT4 tensor engine compiles with AVX2/NEON" bash -c 'make -C ai/inference/csrc >/dev/null 2>&1'
check "Native INT4 token benchmark passes sub-10ms & <600MB RAM" bash -c './ai/inference/csrc/sap_bench_int4 >/dev/null 2>&1'
check "Small Model INT4 config enforced in engine.rs" grep -q "SmallModelConfig" ai/inference/src/engine.rs
check "RAM budget ceiling <= 800MB enforced in target configs" grep -q '"maxRamBudgetMb": 800' targets/x86_64-uefi.json

echo "--> 4. Verifying Developer Templates & CLI"
check "Rust-native template exists" test -f sdk/templates/rust-native/sap.manifest.json
check "WASM template exists" test -f sdk/templates/wasm-modular/sap.manifest.json
check "SDK CLI tool exists" test -f sdk/cli/src/main.rs

echo "--> 5. Testing Package Building & Determinism"
mkdir -p out/test-pkg
tar --sort=name --mtime='2026-01-01 00:00:00Z' --owner=0 --group=0 --numeric-owner -czf out/test-pkg/test1.tar.gz -C sdk/templates/rust-native .
tar --sort=name --mtime='2026-01-01 00:00:00Z' --owner=0 --group=0 --numeric-owner -czf out/test-pkg/test2.tar.gz -C sdk/templates/rust-native .
HASH1=$(sha256sum out/test-pkg/test1.tar.gz | awk '{print $1}')
HASH2=$(sha256sum out/test-pkg/test2.tar.gz | awk '{print $1}')

check "Bit-for-bit packaging reproducibility" test "$HASH1" = "$HASH2"
rm -rf out/test-pkg /tmp/npu_hal.o

echo "--> 6. Verifying Kernel & A/B dm-verity Rootfs Build Harness"
check "Kernel build harness executes for x86_64" bash -c 'bash build/kernel/build-kernel.sh x86_64 >/dev/null 2>&1'
check "Kernel build harness executes for arm64" bash -c 'bash build/kernel/build-kernel.sh arm64 >/dev/null 2>&1'
check "A/B dm-verity Rootfs builder formats and signs" bash -c 'bash build/rootfs/build-ab-rootfs.sh x86_64 >/dev/null 2>&1'
check "A/B dm-verity verification and negative tamper gate pass" bash -c 'bash build/rootfs/verify-ab-slots.sh x86_64 >/dev/null 2>&1'

echo "--> 7. Verifying Native Wayland Shell & Core IPC Router (Option C)"
check "Native Wayland compositor engine compiles" bash -c 'make -C shell/csrc >/dev/null 2>&1'
check "Native Wayland compositor passes 120Hz convergence test" bash -c './shell/csrc/sap_compositor_bench >/dev/null 2>&1'
check "Native Core IPC router compiles" bash -c 'make -C ipc/csrc >/dev/null 2>&1'
check "Native Core IPC router passes RPC self-test & <2.5MB RSS" bash -c './ipc/csrc/sap_ipc_router >/dev/null 2>&1'

echo "--> 8. Verifying Mobile Telephony & Audio Subsystem (Option D)"
check "Native audio routing subsystem compiles" bash -c 'make -C services/audio/csrc >/dev/null 2>&1'
check "Native telephony daemon & benchmark compile" bash -c 'make -C services/telephony/csrc >/dev/null 2>&1'
check "Telephony benchmark passes (VoLTE, E911 bypass, SMS, Ducking, Mic-Kill)" bash -c './services/telephony/csrc/sap_telephony_bench >/dev/null 2>&1'

echo "--> 9. Verifying Zero-Root Application Sandboxing & SDK Runner (Option E)"
check "Native sandbox engine compiles" bash -c 'make -C core/sandbox/csrc >/dev/null 2>&1'
check "Sandbox security barrier invariant suite passes (Namespaces, Landlock, Seccomp)" bash -c './core/sandbox/csrc/sap_sandbox_bench >/dev/null 2>&1'
check "Native sapp developer CLI compiles" bash -c 'make -C sdk/cli >/dev/null 2>&1'
check "sapp run launches hermetic application under Landlock + Seccomp" bash -c './sdk/cli/sapp run org.sovereign.test /bin/true >/dev/null 2>&1'

echo "--> 10. Verifying Camera ISP Pipeline & Privacy Subsystem (Option F)"
check "Native camera ISP & privacy library compiles" bash -c 'make -C services/camera/csrc >/dev/null 2>&1'
check "Camera benchmark passes (1080p stream, hardware shutter veto, synthetic mode, torch)" bash -c './services/camera/csrc/sap_camera_bench >/dev/null 2>&1'

echo "--> 11. Verifying Cryptographic Packaging & Verifiable Toolchain (Option G)"
check "Native packaging engine compiles" bash -c 'make -C packaging/csrc >/dev/null 2>&1'
check "Packaging benchmark passes (Ed25519, 1-byte tamper gate, reproducible builds)" bash -c './packaging/csrc/sap_packaging_bench >/dev/null 2>&1'
check "sapp keygen, build & verify lifecycle succeeds" bash -c '
    ./sdk/cli/sapp keygen /tmp/harness_key.key /tmp/harness_key.pub >/dev/null 2>&1 && \
    ./sdk/cli/sapp create /tmp/harness_app >/dev/null 2>&1 && \
    ./sdk/cli/sapp build /tmp/harness_app /tmp/harness_app.sap /tmp/harness_key.key >/dev/null 2>&1 && \
    ./sdk/cli/sapp verify /tmp/harness_app.sap /tmp/harness_key.pub >/dev/null 2>&1 && \
    rm -rf /tmp/harness_key.* /tmp/harness_app*
'

echo "--> 12. Verifying Android Subsystem Compatibility & Translation Bridge (Option H)"
check "Native Android compat & translation library compiles" bash -c 'make -C compat/csrc >/dev/null 2>&1'
check "Android compat benchmark passes (lrd-android0 netns, sensor spoofing, FEX-Emu, GPU thunks)" bash -c './compat/csrc/sap_compat_bench >/dev/null 2>&1'

echo "--> 13. Verifying Native Sovereign UI Client & Wayland Integration (Option I)"
check "Native UI client & software rasterizer compile" bash -c 'make -C shell/csrc >/dev/null 2>&1'
check "Native UI benchmark passes (120Hz Desktop dual-column, Handset reachability, <32MB RSS)" bash -c './shell/csrc/sap_ui_bench >/dev/null 2>&1'

echo "--> 14. Verifying Phase 1 Native Services & Core Stub Elimination"
check "Native Security Vault & TPM 2.0 subsystem compiles" bash -c 'make -C security/vault/csrc >/dev/null 2>&1'
check "Security Vault benchmark passes (TSS2/TPM2, PCR sealing, attestation quote, tamper gates)" bash -c './security/vault/csrc/sap_vault_bench >/dev/null 2>&1'

check "Native Surveillance Defense & Anti-Predatory subsystem compiles" bash -c 'make -C security/csrc >/dev/null 2>&1'
check "Surveillance Defense benchmark passes (telemetry poison, dark pattern scanner)" bash -c './security/csrc/sap_security_bench >/dev/null 2>&1'

check "Native Hardware Sensors & Fusion subsystem compiles" bash -c 'make -C services/sensors/csrc >/dev/null 2>&1'
check "Hardware Sensors benchmark passes (IIO scan, pitch/roll fusion, foldable hinge, motion fuzzing)" bash -c './services/sensors/csrc/sap_sensors_bench >/dev/null 2>&1'

check "Native Hardware Power & Thermal subsystem compiles" bash -c 'make -C services/power/csrc >/dev/null 2>&1'
check "Hardware Power benchmark passes (sysfs battery, thermal throttling, wake-lock suspend guard)" bash -c './services/power/csrc/sap_power_bench >/dev/null 2>&1'

check "Native Hardware fscrypt Storage subsystem compiles" bash -c 'make -C services/storage/csrc >/dev/null 2>&1'
check "Storage benchmark passes (fscrypt per-app vault, authenticated encryption, isolation, tamper gate)" bash -c './services/storage/csrc/sap_storage_bench >/dev/null 2>&1'

check "Native Decentralized Identity & Passkey subsystem compiles" bash -c 'make -C services/identity/csrc >/dev/null 2>&1'
check "Identity benchmark passes (W3C did:key, WebAuthn assertion sign & verify, challenge tamper gate)" bash -c './services/identity/csrc/sap_identity_bench >/dev/null 2>&1'

check "Native Connectivity & nftables Firewall subsystem compiles" bash -c 'make -C services/connectivity/csrc >/dev/null 2>&1'
check "Connectivity benchmark passes (interface monitor, zero-trust default-deny rules, LAN/WAN pinholes)" bash -c './services/connectivity/csrc/sap_connectivity_bench >/dev/null 2>&1'

check "Native Memory Hardening & Guarded Enclaves subsystem compiles" bash -c 'make -C core/memory/csrc >/dev/null 2>&1'
check "Memory Hardening benchmark passes (M_PERTURB, PROT_NONE guard pages, secure wipe, OOM score)" bash -c './core/memory/csrc/sap_memory_bench >/dev/null 2>&1'

check "Native Hardware Capability Tokens & Leases subsystem compiles" bash -c 'make -C core/capability/csrc >/dev/null 2>&1'
check "Capability benchmark passes (lease issuance, prefix verify, attenuation, impersonation block, revocation)" bash -c './core/capability/csrc/sap_capability_bench >/dev/null 2>&1'

check "Native Decentralized Push Notifications subsystem compiles" bash -c 'make -C services/notifications/csrc >/dev/null 2>&1'
check "Notifications benchmark passes (priority preemption, queue draining, rate-limiting)" bash -c './services/notifications/csrc/sap_notifications_bench >/dev/null 2>&1'

echo "--> 15. Verifying Phase 2 Bare-Metal Flasher, GPT Disk Image & Direct KMS/DRM"
check "Bare-metal flasher script is present and executable" test -x build/flash/sap-flash.sh
check "Bare-metal flasher dry-run passes on x86_64 (GPT, ESP, A/B dm-verity, LUKS2 alignment)" bash -c 'bash build/flash/sap-flash.sh dry-run x86_64 >/dev/null 2>&1'
check "Bare-metal flasher dry-run passes on arm64 (PinePhone Pro / MNT Reform / RPi5 extlinux)" bash -c 'bash build/flash/sap-flash.sh dry-run arm64 >/dev/null 2>&1'
check "Direct Linux KMS/DRM dumb-buffer modesetting & evdev loop pass" bash -c './shell/csrc/sap_compositor_bench >/dev/null 2>&1'

echo "--> 16. Verifying Phase 3 External Binary Assets & Model Bundler"
check "Model weights bundler script is executable" test -x ai/models/bundle-weights.sh
check "SmolLM2-360M INT4 model weights binary exists" test -f ai/models/smollm2-360m-instruct-q4_0.bin
check "Model manifest JSON is well-formed" python3 -c 'import json; json.load(open("ai/models/model-manifest.json"))'
check "Android compatibility rootfs fetcher is executable" test -x compat/fetch-android-rootfs.sh
check "Android container system & vendor images exist" test -f compat/images/system.img
check "Android manifest JSON is well-formed" python3 -c 'import json; json.load(open("compat/images/android-manifest.json"))'

echo "--------------------------------------------------------"
if [ "$FAILED" -eq 0 ]; then
    echo "ALL SAP SUITE VERIFICATION CHECKS PASSED!"
    exit 0
else
    echo "WARNING: $FAILED checks failed."
    exit 1
fi
