#!/usr/bin/env bats
# SPDX-License-Identifier: GPL-3.0-or-later
# Every hardening option in the fragment must be present in the built config.

CFG="${CFG:-/proc/config.gz}"
if [[ ! -e "$CFG" ]]; then
  if [[ -f ".config" ]]; then
    CFG=".config"
  elif [[ -f "/boot/config-$(uname -r)" ]]; then
    CFG="/boot/config-$(uname -r)"
  fi
fi

getcfg() {
  if [[ "$CFG" == *.gz ]]; then zgrep -E "^$1=" "$CFG" | head -1
  else grep -E "^$1=" "$CFG" | head -1; fi
}

@test "K1: config is readable" { run getcfg CONFIG_SECURITY; [ -n "$output" ]; }

@test "K2: KASLR enabled" { run getcfg CONFIG_RANDOMIZE_BASE; [[ "$output" == *"=y" ]]; }

@test "K3: stack protector strong" { run getcfg CONFIG_STACKPROTECTOR_STRONG; [[ "$output" == *"=y" ]]; }

@test "K4: Landlock enabled" { run getcfg CONFIG_SECURITY_LANDLOCK; [[ "$output" == *"=y" ]]; }

@test "K5: seccomp filter enabled" { run getcfg CONFIG_SECCOMP_FILTER; [[ "$output" == *"=y" ]]; }

@test "K6: init_on_alloc enabled" { run getcfg CONFIG_INIT_ON_ALLOC_DEFAULT_ON; [[ "$output" == *"=y" ]]; }

@test "K7: usercopy hardened" { run getcfg CONFIG_HARDENED_USERCOPY; [[ "$output" == *"=y" ]]; }

@test "K8: module sig force" { run getcfg CONFIG_MODULE_SIG_FORCE; [[ "$output" == *"=y" ]]; }

@test "K9: IOMMU strict" { run getcfg CONFIG_IOMMU_DEFAULT_DMA_STRICT; [[ "$output" == *"=y" ]]; }

@test "K10: legacy pty disabled" { run getcfg CONFIG_LEGACY_PTYS; [ -z "$output" ] || [[ "$output" == *"=n" ]]; }

@test "K11: unprivileged BPF off by default" { run getcfg CONFIG_BPF_UNPRIV_DEFAULT_OFF; [[ "$output" == *"=y" ]]; }

@test "K12: fragment fully applied" {
  missing=0
  while read -r line; do
    [[ "$line" =~ ^CONFIG_ ]] || continue
    key="${line%%=*}"
    run getcfg "$key"
    [[ -n "$output" ]] || { echo "missing $key"; missing=$((missing+1)); }
  done < config/kernel/fragment-x86_64.config
  [ "$missing" -eq 0 ]
}

@test "K13: no in-kernel driver outside the allowlist" {
  run bash tools/audit-kernel-config.sh
  [ "$status" -eq 0 ]
}
