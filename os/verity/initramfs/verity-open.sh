#!/bin/busybox sh
# verity-open.sh — open the rootfs through dm-verity, or explain why not.
# Sets ROOTDEV to the verity mapper device on success.
# Returns 0 verified, 1 unverified-but-allowed, 2 refused.

VERITY_POLICY="${VERITY_POLICY:-warn}"
VERITY_KEYS=/etc/lrd/keys/verity.pub.pem
VERITY_FLAG=/run/lrd/verity.json

vlog() { echo "[verity] $*"; echo "[verity] $*" > /dev/kmsg 2>/dev/null; }

verity_record() { # ok, tier, reason
  mkdir -p /run/lrd
  printf '{"verified":%s,"tier":%s,"reason":%s,"slot":%s,"at":%s}\n' \
    "$1" "${2:-0}" "$(printf '%s' "${3:-}" | sed 's/"/\\"/g; s/^/"/; s/$/"/')" \
    "\"${SLOTC:-}\"" "\"$(date -Is)\"" > "$VERITY_FLAG"
}

verity_policy() {
  # cmdline wins, then the conf, then warn
  local p
  p="$(printf '%s' "$CMDLINE" | tr ' ' '\n' | sed -n 's/^lrd\.verity=//p' | head -1)"
  [ -n "$p" ] && { echo "$p"; return; }
  [ -f /etc/lrd/verity.conf ] && { sed -n 's/^policy=//p' /etc/lrd/verity.conf | head -1; return; }
  echo warn
}

verity_open() {
  local img="$1" slot="$2"
  local policy; policy="$(verity_policy)"
  vlog "policy=$policy image=$img slot=$slot"

  [ "$policy" = off ] && { verity_record false 0 "policy=off"; vlog "disabled"; return 1; }

  # metadata: per-slot first, then any (a single-slot layout)
  local meta=""
  for c in "/lrdstore/verity/lrd-verity_${slot}.json" \
           "/lrdstore/verity/lrd-verity_a.json" \
           "/lrdstore/verity/lrd-verity_b.json"; do
    [ -f "$c" ] && { meta="$c"; break; }
  done

  if [ -z "$meta" ]; then
    vlog "no verity metadata"
    [ "$policy" = strict ] && { verity_record false 0 "no metadata"; return 2; }
    verity_record false 0 "no metadata"
    return 1
  fi

  local roothash hash_offset data_blocks
  roothash="$(sed -n 's/.*"rootHash":"\([^"]*\)".*/\1/p' "$meta" | head -1)"
  hash_offset="$(sed -n 's/.*"hashOffset":\([0-9]*\).*/\1/p' "$meta" | head -1)"
  data_blocks="$(sed -n 's/.*"dataBlocks":\([0-9]*\).*/\1/p' "$meta" | head -1)"
  [ -n "$roothash" ] && [ -n "$hash_offset" ] || {
    vlog "metadata unparseable"
    verity_record false 0 "metadata unparseable"
    return 1
  }

  # ---------- Tier 1: the kernel verifies the PKCS#7 signature itself ----------
  local tier=0
  if [ -f "${meta}.p7s" ] && [ -r /sys/module/dm_verity/parameters/require_signatures ]; then
    local req; req="$(cat /sys/module/dm_verity/parameters/require_signatures 2>/dev/null)"
    if [ "$req" = Y ] || [ "$req" = y ]; then
      vlog "tier 1: kernel signature enforcement is on"
      tier=1
    fi
  fi

  # ---------- Tier 2: verify the metadata signature in userspace ----------
  local sig_ok=no
  if [ -f "${meta}.sig" ] && [ -f "$VERITY_KEYS" ] && [ -x /usr/bin/openssl ]; then
    if openssl dgst -sha256 -verify "$VERITY_KEYS" -signature "${meta}.sig" "$meta" >/dev/null 2>&1; then
      sig_ok=yes
      [ "$tier" = 0 ] && tier=2
    else
      vlog "SIGNATURE INVALID"
    fi
  fi

  # ---------- Tier 3: pinned hash ----------
  local pinned=no
  if [ "$sig_ok" = no ] && [ -f /etc/lrd/verity.pinned ]; then
    if grep -q "$roothash" /etc/lrd/verity.pinned 2>/dev/null; then
      pinned=yes
      [ "$tier" = 0 ] && tier=3
    fi
  fi

  if [ "$sig_ok" = no ] && [ "$pinned" = no ]; then
    if [ "$policy" = strict ]; then
      vlog "unverified and policy=strict"
      verity_record false 0 "signature invalid and no pinned hash"
      return 2
    fi
    vlog "unverified — booting flagged"
    verity_record false 0 "signature invalid and no pinned hash"
    return 1
  fi

  # ---------- open ----------
  local mapper="lrdroot-${slot}"
  local p7s=""
  [ "$sig_ok" = yes ] && [ "$tier" = 1 ] && [ -f "${meta}.p7s" ] && p7s="${meta}.p7s"

  veritysetup open "$img" "$mapper" "$roothash" \
      --hash-offset="$hash_offset" \
      --data-blocks="$data_blocks" \
      --data-block-size=4096 --hash-block-size=4096 \
      --fec-roots=2 \
      --panic-on-corruption \
      ${p7s:+--root-hash-signature="$p7s"} \
      2>&1 | tail -2

  if [ ! -e "/dev/mapper/$mapper" ]; then
    vlog "veritysetup open FAILED"
    [ "$policy" = strict ] && { verity_record false "$tier" "open failed"; return 2; }
    verity_record false "$tier" "open failed"
    return 1
  fi

  ROOTDEV="/dev/mapper/$mapper"
  vlog "opened $ROOTDEV via tier $tier"
  verity_record true "$tier" "$([ "$tier" = 1 ] && echo kernel-verified || { [ "$tier" = 2 ] && echo initramfs-verified || echo pinned-hash; })"
  return 0
}

crypt_then_verity_open() {
  local img="$1" slot="$2"
  local meta=""
  for c in "/lrdstore/verity/lrd-verity_${slot}.json" \
           "/lrdstore/verity/lrd-verity_a.json" \
           "/lrdstore/verity/lrd-verity_b.json"; do
    [ -f "$c" ] && { meta="$c"; break; }
  done
  [ -f "$meta" ] || { vlog "no metadata"; return 1; }

  # signature first: never unlock with a root hash we do not trust
  local sig_ok=no
  if [ -f "$meta.sig" ] && [ -f "$VERITY_KEYS" ] && [ -x /bin/openssl ]; then
    openssl dgst -sha256 -verify "$VERITY_KEYS" -signature "$meta.sig" "$meta" >/dev/null 2>&1 && sig_ok=yes
  fi
  local roothash hash_offset data_blocks layout
  roothash="$(sed -n 's/.*"rootHash":"\([^"]*\)".*/\1/p' "$meta" | head -1)"
  hash_offset="$(sed -n 's/.*"hashOffset":\([0-9]*\).*/\1/p' "$meta" | head -1)"
  data_blocks="$(sed -n 's/.*"dataBlocks":\([0-9]*\).*/\1/p' "$meta" | head -1)"
  layout="$(sed -n 's/.*"layout":"\([^"]*\)".*/\1/p' "$meta" | head -1)"

  # ---- unlock if this is a LUKS layout ----
  local base="$img"
  if [ "$layout" = "luks2+verity-inside" ]; then
    if ! cryptsetup isLuks --header "$img" 2>/dev/null; then
      vlog "metadata says luks but the image is not LUKS"
      return 1
    fi
    # passphrase: file, then cmdline, then a prompt on the console
    local pf=""
    for c in "/lrdstore/luks_${slot}.key" "/lrdstore/luks.key" "/lrdstore/keys/luks_${slot}.key"; do
      [ -f "$c" ] && { pf="$c"; break; }
    done
    vlog "unlocking LUKS2"
    if [ -n "$pf" ]; then
      cryptsetup luksOpen "$img" "lrdcrypt-${slot}" --key-file "$pf" --header "$img" || {
        vlog "unlock failed with the key file"; return 1; }
    else
      echo
      echo "  LibreDroid: enter the disk passphrase for slot $slot"
      cryptsetup luksOpen "$img" "lrdcrypt-${slot}" --header "$img" || { vlog "unlock failed"; return 1; }
    fi
    base="/dev/mapper/lrdcrypt-${slot}"
  fi

  # ---- verity on top of the plaintext ----
  if [ "$sig_ok" = yes ] || grep -q "$roothash" /etc/lrd/verity.pinned 2>/dev/null; then
    local mapper="lrdroot-${slot}"
    veritysetup open "$base" "$mapper" "$roothash" \
      --hash-offset="$hash_offset" --data-blocks="$data_blocks" \
      --data-block-size=4096 --hash-block-size=4096 \
      --fec-roots=2 --panic-on-corruption 2>&1 | tail -2
    if [ -e "/dev/mapper/$mapper" ]; then
      ROOTDEV="/dev/mapper/$mapper"
      vlog "verified and mounted via $ROOTDEV"
      verity_record true 2 "$([ "$layout" = "luks2+verity-inside" ] && echo luks+verity || echo verity-only)"
      return 0
    fi
    vlog "veritysetup open failed"
  else
    vlog "metadata unsigned and hash not pinned"
  fi
  # policy
  local p; p="$(verity_policy)"
  [ "$p" = strict ] && return 2
  ROOTDEV="$base"
  verity_record false 0 "unverified"
  return 1
}
