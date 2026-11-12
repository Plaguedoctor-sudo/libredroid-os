# SPDX-License-Identifier: GPL-3.0-or-later
SHELL := /bin/bash
FS    := ./tools/fsbuild/fsbuild.py
TARGET ?= x200-libreboot
PROFILE ?= native
COMPONENT ?=
BL ?= 0

.PHONY: help verify schema schema-docs fsctl-gen fsctl-test rules resolve resolve-offline fetch build stage sbom gate sign sign-dry report pin-audit test-net test-repro clean trust gen-keys verify-hashes

help:
	@grep -E '^[a-z-]+:' Makefile | cut -d: -f1 | sed 's/^/  make /'

verify:      ; @$(FS) manifest verify
schema:      ; @$(FS) schema validate && capnp compile -o- interface/*.capnp >/dev/null && echo "schema ok"
schema-docs: ; @capnp compile -odoc interface/*.capnp
fsctl-gen:   ; @mkdir -p out/capnp && capnp compile -oc++ interface/*.capnp -o out/capnp
fsctl-test:  ; @bats tests/fsctl/
rules:       ; @$(FS) rules check
pin-audit:; @bash tools/pin-audit.sh
resolve:  ; @$(FS) resolve --repair
resolve-offline: ; @$(FS) resolve --offline
fetch:    ; @$(FS) fetch
hash:     ; @$(FS) hash $(COMPONENT)
verify-hashes: ; @$(FS) verify-hashes
build:    ; @$(FS) build $(if $(COMPONENT),--only $(COMPONENT),--all)
stage:    ; @$(FS) stage --target $(TARGET) --profile $(PROFILE) $(if $(filter 1,$(BL)),--allow-blobs,)
sbom:     ; @$(FS) sbom --out dist
gate:     ; @$(FS) gate
gen-keys: ; @bash tools/gen-root-keys.sh
sign:     ; @bash tools/sign-manifest.sh --threshold 3
sign-dry: ; @$(FS) sign --dry-run --threshold 3
trust:    ; @$(FS) manifest verify && $(FS) verify-hashes
report:   ; @$(FS) report --out dist/fsbuild-report.json
test-net: ; @bash tests/net-lockdown.sh
test-repro: ; @bash tests/repro-rebuild.sh
clean:    ; rm -rf .store out dist
