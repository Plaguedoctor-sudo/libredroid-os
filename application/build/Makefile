# Sovereign Application Platform — Kernel & A/B dm-verity Build Harness

SHELL := /bin/bash

.PHONY: all kernel-x86_64 kernel-arm64 rootfs-x86_64 rootfs-arm64 verify clean

all: kernel-x86_64 kernel-arm64 rootfs-x86_64 rootfs-arm64 verify

kernel-x86_64:
	@echo "==> Building x86_64 Hardened Kernel Artifacts..."
	@bash kernel/build-kernel.sh x86_64

kernel-arm64:
	@echo "==> Building ARM64 Hardened Kernel Artifacts..."
	@bash kernel/build-kernel.sh arm64

rootfs-x86_64:
	@echo "==> Building x86_64 A/B dm-verity Rootfs..."
	@bash rootfs/build-ab-rootfs.sh x86_64

rootfs-arm64:
	@echo "==> Building ARM64 A/B dm-verity Rootfs..."
	@bash rootfs/build-ab-rootfs.sh arm64

verify:
	@echo "==> Verifying Cryptographic A/B dm-verity Integrity & Tamper Gates..."
	@bash rootfs/verify-ab-slots.sh x86_64
	@bash rootfs/verify-ab-slots.sh arm64

clean:
	@echo "==> Cleaning build outputs..."
	rm -rf out/
