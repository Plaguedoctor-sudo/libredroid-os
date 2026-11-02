#!/data/data/com.termux/files/usr/bin/bash
# Safeguards that keep the install alive on a hostile (battery-optimising) ROM.
set -uo pipefail
say(){ printf '\033[1;36m::\033[0m %s\n' "$*"; }

say "wake lock"
termux-wake-lock 2>/dev/null && echo "  held" || echo "  !! Termux:API app required"

say "battery optimisation exemption"
# opens the system dialog; user taps Allow once
am start -a android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS \
  -d package:com.termux >/dev/null 2>&1 && echo "  dialog opened" || true

say "notifications channel (needed for the watchdog alert)"
termux-notification --id lrd --title "LibreDroid" --content "watchdog armed" --priority low 2>/dev/null || true

say "log dir"
mkdir -p "$HOME/.lrd/log"
# keep logs bounded even without logrotate
cat > "$HOME/.lrd/bin/lrd-logtrim.sh" <<'EOF'
#!/data/data/com.termux/files/usr/bin/bash
L="$HOME/.lrd/log"; mkdir -p "$L"
for f in "$L"/*.log; do
  [ -f "$f" ] || continue
  [ "$(stat -c %s "$f" 2>/dev/null || echo 0)" -gt 2000000 ] && { tail -n 2000 "$f" > "$f.t"; mv "$f.t" "$f"; }
done
find "$L" -name '*.log.*' -mtime +14 -delete 2>/dev/null || true
EOF
chmod 755 "$HOME/.lrd/bin/lrd-logtrim.sh"

say "OEM killer mitigation: also whitelist in the vendor battery UI if present"
for p in com.coloros.safecenter com.oplus.battery com.miui.powerkeeper; do
  pm list packages 2>/dev/null | grep -q "$p" && echo "  found $p — add Termux to its whitelist manually"
done

say "safeguards applied"
