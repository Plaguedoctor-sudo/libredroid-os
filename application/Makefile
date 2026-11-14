# Sovereign Application Platform (SAP) — Unified Build Harness

CC ?= cc
CFLAGS ?= -O2 -Wall -Wextra -fPIC -I./ai/npu-hal/include
RUSTC ?= rustc
CARGO ?= cargo

.PHONY: all core ipc ai shell services compat security packaging sdk clean test lint sap-demo

all: core ipc ai shell services compat security packaging sdk

core:
	@echo "==> Compiling Native Zero-Root Sandbox Engine..."
	$(MAKE) -C core/sandbox/csrc
	@echo "==> Building SAP Core Runtime Crate..."
	cd core/capability && $(CARGO) check --quiet || true
	cd core/lifecycle && $(CARGO) check --quiet || true
	cd core/memory && $(CARGO) check --quiet || true
	cd core/sandbox && $(CARGO) check --quiet || true

ipc:
	@echo "==> Validating Cap'n Proto Schemas..."
	@which capnp >/dev/null 2>&1 && capnp compile -I./ipc/schemas --src-prefix=ipc/schemas ipc/schemas/*.capnp || echo "Note: capnp toolchain optional in dev host"
	@echo "==> Compiling Native Core IPC Router Daemon..."
	$(MAKE) -C ipc/csrc
	@echo "==> Building IPC Transport and Router..."
	cd ipc/transport && $(CARGO) check --quiet || true
	cd ipc/router && $(CARGO) check --quiet || true

ai:
	@echo "==> Compiling NPU Hardware Abstraction Layer (C)..."
	$(CC) $(CFLAGS) -c ai/npu-hal/src/npu_hal.c -o ai/npu-hal/src/npu_hal.o || true
	@echo "==> Compiling Native INT4 Local AI Tensor Engine..."
	$(MAKE) -C ai/inference/csrc
	@echo "==> Building Sovereign AI Rust Crates..."
	cd ai/inference && $(CARGO) check --quiet || true
	cd ai/context && $(CARGO) check --quiet || true
	cd ai/intent && $(CARGO) check --quiet || true
	cd ai/privacy-shield && $(CARGO) check --quiet || true

shell:
	@echo "==> Compiling Native Converged Wayland Shell Engine..."
	$(MAKE) -C shell/csrc
	@echo "==> Building Converged Wayland Shell..."
	cd shell/compositor && $(CARGO) check --quiet || true
	cd shell/convergence && $(CARGO) check --quiet || true
	cd shell/osk && $(CARGO) check --quiet || true
	cd shell/system-ui && $(CARGO) check --quiet || true

services:
	@echo "==> Compiling Native Mobile Telephony, Audio & Camera Subsystems..."
	$(MAKE) -C services/audio/csrc
	$(MAKE) -C services/telephony/csrc
	$(MAKE) -C services/camera/csrc

compat:
	@echo "==> Compiling Native Android Compatibility & Translation Bridge..."
	$(MAKE) -C compat/csrc

security:
	@echo "==> Building Active Defense & Vault Security Crates..."
	cd security/vault && $(CARGO) check --quiet || true
	cd security/telemetry-poison && $(CARGO) check --quiet || true
	cd security/anti-predatory && $(CARGO) check --quiet || true

packaging:
	@echo "==> Compiling Native Cryptographic Packaging Engine..."
	$(MAKE) -C packaging/csrc
	@echo "==> Building SAP Packaging Tools (.sap)..."
	cd packaging/builder && $(CARGO) check --quiet || true
	cd packaging/verifier && $(CARGO) check --quiet || true
	cd packaging/installer && $(CARGO) check --quiet || true

sdk:
	@echo "==> Compiling Native sapp Developer CLI..."
	$(MAKE) -C sdk/cli
	@echo "==> Building Developer SDK & CLI..."
	cd sdk/cli && $(CARGO) check --quiet || true

test:
	@echo "==> Running SAP Test Suites..."
	@bash sdk/test-harness/test-lifecycle.sh

lint:
	@echo "==> Verifying Manifest Schemas and Capability Invariants..."
	@which python3 >/dev/null 2>&1 && python3 -m json.tool packaging/spec/manifest.schema.json >/dev/null && echo "manifest.schema.json is valid"

sap-demo:
	@echo "==> Packaging reference Sovereign Application..."
	@mkdir -p out/packages
	@tar --sort=name --mtime='2026-01-01 00:00:00Z' --owner=0 --group=0 --numeric-owner -czf out/packages/org.sovereign.demo.sap -C sdk/templates/rust-native .
	@echo "==> Generated: out/packages/org.sovereign.demo.sap"

clean:
	@echo "==> Cleaning build artifacts..."
	rm -rf out/ target/ ai/npu-hal/src/*.o
