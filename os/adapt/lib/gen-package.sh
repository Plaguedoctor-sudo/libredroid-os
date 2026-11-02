#!/usr/bin/env bash
# Generate lrd-adapt-<vendor>-<codename> from a probe + extracted overlay.
set -Eeuo pipefail
OUT="${1:?out}"; TPL="${2:?templates}"
J="$OUT/device.json"; OV="$OUT/rootfs-overlay"
[ -f "$J" ] || { echo "no device.json"; exit 1; }

vendor=$(jq -r '.device.vendor' "$J" | tr 'A-Z' 'a-z' | tr -cd 'a-z0-9')
codename=$(jq -r '.device.codename' "$J" | tr 'A-Z' 'a-z' | tr -cd 'a-z0-9')
level=$(jq -r '.supportLevel' "$J")
pkg="lrd-adapt-${vendor}-${codename}"
P="$OUT/$pkg"
rm -rf "$P"; mkdir -p "$P"/DEBIAN "$P"/etc/lrd "$P"/usr/lib/lrd

# --- identity ---
jq '{
  vendor:.device.vendor, codename:.device.codename, model:.device.model,
  soc:.device.soc, platform:.device.platform, hardware:.device.hardware,
  kernel:.device.kernel, abis:.device.abis, slot:.device.slot,
  dynamicPartitions:.device.dynamicPartitions, supportLevel:.supportLevel,
  score:.score, generatedAt:.probedAt
}' "$J" > "$P/etc/lrd/device.json"

# --- display backend decision: DRM preferred, hwc2 when DRM is absent ---
drm_nodes=$(jq -r '.display.drmNodes' "$J")
hwc=$(jq -r '.hal.hwcomposer' "$J")
if [ "${drm_nodes:-0}" -gt 0 ]; then backend=drm; else backend=hwc2; fi
[ -z "$hwc" ] && [ "$backend" = hwc2 ] && backend=fbdev
sed -e "s|@BACKEND@|$backend|g" \
    -e "s|@DRMNODES@|$drm_nodes|g" \
    -e "s|@HWCOMPOSER@|$hwc|g" "$TPL/display.conf.in" > "$P/etc/lrd/display.conf"
[ -f "$TPL/display.variants" ] && cp -a "$TPL/display.variants" "$P/etc/lrd/display.variants"

# --- gen-package.sh — replay only what a HAL could plausibly read ---
if [ -f "$OUT/device.props.raw" ]; then
  grep -E '^\[(ro|persist|vendor|dalvik)\.' "$OUT/device.props.raw" \
    | sed -E 's/^\[([^]]+)\]: \[(.*)\]$/\1=\2/' \
    | grep -vE '^(ro\.boot\.|ro\.serialno|ro\.product\.cpu\.abi2)' \
    > "$P/etc/lrd/device.props"
  # our own values must win over anything copied from the running device
  grep -vE '^(ro\.hardware\.)' "$P/etc/lrd/device.props" > "$P/etc/lrd/device.props.t" && \
    mv "$P/etc/lrd/device.props.t" "$P/etc/lrd/device.props"
  echo ":: device.props: $(grep -c . "$P/etc/lrd/device.props") properties"
fi

# --- hybris properties ---
sed -e "s|@GRALLOC@|$(jq -r '.hal.gralloc' "$J")|g" \
    -e "s|@EGL@|$(jq -r '.hal.egl' "$J")|g" \
    -e "s|@EGL_PLATFORM@|$(case "$(jq -r '.device.soc' "$J")" in *Mali*|*mali*|*MT*) echo 'mali';; *Snapdragon*|*SM*|*SDM*|*MSM*) echo 'adreno';; *) echo 'default';; esac)|g" \
    -e "s|@AUDIO@|$(jq -r '.hal.audio' "$J")|g" \
    -e "s|@RIL@|$(jq -r '.hal.ril' "$J")|g" \
    -e "s|@SENSORS@|$(jq -r '.hal.sensors' "$J")|g" \
    "$TPL/hybris.conf.in" > "$P/etc/lrd/hybris.conf"

# --- cmdline: the flags that make a vendor kernel tolerable to glibc userspace ---
{
  echo "androidboot.selinux=permissive"
  echo "androidboot.hardware=$(jq -r '.device.hardware' "$J")"
  echo "androidboot.slot_suffix=$(jq -r '.device.slot' "$J")"
  echo "console=tty0"
  echo "lrd.root=LABEL=LRDROOT"
  echo "lrd.adapt=$pkg"
  echo "lrd.level=$level"
  echo "vt.global_cursor_default=0"
} > "$P/etc/lrd/cmdline"

# --- udev: give the shell stable names and stop systemd fighting Android nodes ---
sed -e "s|@CODENAME@|$codename|g" "$TPL/70-lrd-hw.rules.in" > "$P/etc/lrd/70-lrd-hw.rules"

# --- kernel fragment for the rebuild ---
cat > "$P/etc/lrd/kernel.fragment" <<'EOF'
# lrd-adapt kernel requirements. Apply to the vendor defconfig.
CONFIG_NFT_REDIRECT=y
CONFIG_NF_TABLES=y
CONFIG_SECURITY_LANDLOCK=y
CONFIG_CGROUPS=y
CONFIG_CGROUP_BPF=y
CONFIG_MEMCG=y
CONFIG_CGROUP_SCHED=y
CONFIG_USER_NS=y
CONFIG_OVERLAY_FS=y
CONFIG_FUSE_FS=y
CONFIG_BRIDGE=y
CONFIG_VETH=y
CONFIG_ANDROID_BINDER_IPC=y
CONFIG_ANDROID_BINDERFS=y
EOF

# --- copy the overlay payload ---
if [ -d "$OV" ]; then
  cp -a "$OV/." "$P/"
fi

# --- control ---
VER="1.0.$(date +%Y%m%d)"
sed -e "s|@PKG@|$pkg|g" -e "s|@VER@|$VER|g" \
    -e "s|@ARCH@|$(jq -r '.device.abis' "$J" | cut -d, -f1 | sed 's/arm64-v8a/arm64/;s/armeabi-v7a/armhf/;s/x86_64/amd64/')|g" \
    -e "s|@MODEL@|$(jq -r '.device.model' "$J")|g" \
    -e "s|@LEVEL@|$level|g" "$TPL/control.in" > "$P/DEBIAN/control"

sed -e "s|@LEVEL@|$level|g" "$TPL/postinst.in" > "$P/DEBIAN/postinst"
chmod 755 "$P/DEBIAN/postinst"

echo ":: $pkg  level=$level  backend=$backend  $(du -sh "$P" | cut -f1)"
echo "$P"
