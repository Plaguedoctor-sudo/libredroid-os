#!/usr/bin/env bash
# Called from lrd-adapt-validate. Verity is a load-bearing security claim, so it
# must appear in adapt.json and therefore in the readiness panel.
set -uo pipefail
STATE=/run/lrd/verity.state
mkdir -p /run/lrd
slot="$(sed -n 's/.*androidboot.slot_suffix=_\([ab]\).*/\1/p' /proc/cmdline)"
dev="/dev/mapper/lrdroot-${slot:-a}"

active=no; tier=0; signed=no; reason=""
[ -e "$dev" ] && active=yes
if [ -r /run/lrd/verity.json ]; then
  tier="$(jq -r '.tier // 0' /run/lrd/verity.json 2>/dev/null || echo 0)"
  reason="$(jq -r '.reason // ""' /run/lrd/verity.json 2>/dev/null || echo '')"
fi
meta="/store/verity/lrd-verity_${slot:-a}.json"
[ -f "$meta.sig" ] && signed=yes

# kernel-side enforcement is the only thing that makes verity tamper-proof
kern=no
[ -r /sys/module/dm_verity/parameters/require_signatures ] && \
  kern="$(cat /sys/module/dm_verity/parameters/require_signatures)"
bootloader=unknown
[ -r /proc/cmdline ] && grep -q 'androidboot.verifiedbootstate=green' /proc/cmdline && bootloader=locked

jq -nc --argjson active "$([ "$active" = yes ] && echo true || echo false)" \
  --argjson tier "$tier" --argjson signed "$([ "$signed" = yes ] && echo true || echo false)" \
  --argjson kernel "$([ "$kern" = Y ] && echo true || echo false)" \
  --arg boot "$bootloader" --arg reason "$reason" --arg slot "${slot:-a}" \
  '{ok: ($active and $tier >= 2), active:$active, tier:$tier, signedMetadata:$signed,
    kernelEnforced:$kernel, bootloader:$boot, slot:$slot, reason:$reason,
    strength: (if $kernel and $boot=="locked" then "full-chain"
               elif $active and $tier>=2 then "initramfs-verified"
               elif $active then "pinned-only"
               else "unverified" end)}' > "$STATE"
[ "$active" = yes ] || logger -t lrd-verity "rootfs is NOT verity-protected"
exit 0
