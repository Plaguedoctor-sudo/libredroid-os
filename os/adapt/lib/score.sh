#!/usr/bin/env bash
# Score a probe. Prints "<level> <score> <n-blockers>" and the blocker list on stderr.
# full | partial | boot-only | unsupported
set -uo pipefail
J_FILE="${1:?probe json}"
if [ -f "$J_FILE" ]; then
  J="$(cat "$J_FILE")"
else
  J="$J_FILE"
fi
g() { jq -r "$1 // empty" <<<"$J"; }

score=0; blockers=(); notes=()

need() { # points, path, label
  local pts="$1" val="$2" label="$3"
  if [ -n "$val" ] && [ "$val" != "null" ] && [ "$val" != "no" ] && [ "$val" != "0" ]; then
    score=$((score+pts))
  else
    blockers+=("$label")
  fi
}

# display is the gate — without it nothing else matters
disp=0
[ "$(g .display.drmNodes)" -gt 0 ] 2>/dev/null && disp=1
[ -n "$(g .display.fb)" ] && disp=1
[ -n "$(g .hal.hwcomposer)" ] && disp=1
if [ "$disp" = 0 ]; then echo "unsupported 0 ${#blockers[@]}"; echo "no display path (no DRM node, no fb, no hwcomposer)" >&2; exit 2; fi
score=$((score+30))

need 15 "$(g .hal.gralloc)"            "gralloc blob"
need 15 "$(g .hal.egl)"                "EGL blob"
need 10 "$(g .io.touchDevices)"        "touchscreen"
need 8  "$(g .io.wifiIfaces)"          "wifi"
need 5  "$(g .payload.vendorModules)"  "kernel modules"
need 5  "$(g .payload.vendorFirmware)" "firmware"
need 6  "$(g .hal.audio)"              "audio HAL"
need 4  "$(g .io.modemNodes)"          "modem nodes"
need 2  "$(g .hal.ril)"                "RIL blob"

# kernel tier: the isolation claims depend on these
k_pts=0
[ "$(g .kernel.nft_redirect)" = yes ] && k_pts=$((k_pts+4)) || notes+=("NFT_REDIRECT absent — Tor is app-level only")
[ "$(g .kernel.landlock)" = yes ]     && k_pts=$((k_pts+2)) || notes+=("LANDLOCK absent")
[ "$(g .kernel.cgroup2)" = yes ]      && k_pts=$((k_pts+2)) || notes+=("cgroup v2 absent — no resource limits")
[ "$(g .kernel.userns)" = yes ]       && k_pts=$((k_pts+1)) || notes+=("USER_NS absent")
score=$((score+k_pts))

[ "$(g .device.bootloaderLocked)" = "1" ] && blockers+=("bootloader locked") || true

level=unsupported
[ "$score" -ge 85 ] && level=full
[ "$score" -ge 60 ] && [ "$level" = unsupported ] && level=partial
[ "$score" -ge 35 ] && [ "$level" = unsupported ] && level=boot-only

printf '%s %d %d\n' "$level" "$score" "${#blockers[@]}"
for b in "${blockers[@]:-}"; do [ -n "$b" ] && echo "blocker: $b" >&2; done
for n in "${notes[@]:-}"; do [ -n "$n" ] && echo "note: $n" >&2; done
exit 0
