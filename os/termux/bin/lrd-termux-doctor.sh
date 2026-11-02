#!/data/data/com.termux/files/usr/bin/bash
# lrd-termux-doctor — verify the I1 install. Exit 0 = healthy. --quiet, --json.
. "$HOME/.lrd/etc/lrd.env" 2>/dev/null || true
QUIET=0; JSON=0
for a in "$@"; do case "$a" in --quiet) QUIET=1;; --json) JSON=1;; esac; done

PASS=0; FAIL=0; WARN=0; R=""
ok(){ PASS=$((PASS+1)); R+="ok   $1\n"; [ $QUIET -eq 0 ] && printf '  \033[32mok\033[0m   %s\n' "$1"; }
no(){ FAIL=$((FAIL+1)); R+="FAIL $1\n"; [ $QUIET -eq 0 ] && printf '  \033[31mFAIL\033[0m %s\n' "$1"; }
wn(){ WARN=$((WARN+1)); R+="warn $1\n"; [ $QUIET -eq 0 ] && printf '  \033[33mwarn\033[0m %s\n' "$1"; }

[ $QUIET -eq 0 ] && echo "LibreDroid I1 doctor — $(date -Is)"

# 1 loopback-only bind
if curl -fsS --max-time 4 "http://127.0.0.1:${LRD_PORT}/healthz" >/dev/null 2>&1; then ok "server on 127.0.0.1:$LRD_PORT"
else no "server not answering on 127.0.0.1:$LRD_PORT"; fi

# 2 no LAN exposure
ip=$(ip route get 1 2>/dev/null | awk '{print $7; exit}')
if [ -n "$ip" ] && curl -fsS --max-time 4 "http://$ip:${LRD_PORT}/healthz" >/dev/null 2>&1; then
  wn "reachable on LAN ($ip) — expected only if LRD_BIND=0.0.0.0"
else ok "not reachable on LAN"; fi

# 3 services
for s in lrd tor watchdog; do
  st=$(sv status "$s" 2>/dev/null | head -1)
  case "$st" in run:*) ok "service $s running";; *) no "service $s not running ($st)";; esac
done

# 4 install capability
mode=$(curl -fsS http://127.0.0.1:${LRD_PORT}/api/host/caps 2>/dev/null | jq -r .installMode 2>/dev/null)
case "$mode" in
  root|session) ok "APK install mode: $mode (silent)";;
  ui) wn "APK install mode: ui (one confirmation tap per install)";;
  off|"") no "APK install unavailable";;
esac

# 5 pm/am read path
if pm list packages -3 >/dev/null 2>&1; then n=$(pm list packages -3 | wc -l); ok "pm read path ($n user apps)"; else no "pm read path"; fi

# 6 icons parsed from real APKs
ic=$(ls "$LRD_STATE/icons" 2>/dev/null | wc -l)
[ "$ic" -gt 0 ] && ok "icon cache populated ($ic)" || wn "no icons cached yet — open the launcher once"

# 7 tor is actually tor
if sv status tor 2>/dev/null | grep -q '^run:'; then
  if command -v torsocks >/dev/null 2>&1; then
    if torsocks curl -fsS --max-time 20 https://check.torproject.org/api/ip 2>/dev/null | grep -q '"IsTor":true'; then
      ok "tor exit verified via SOCKS"
    else wn "tor up but exit not verified"; fi
  else wn "tor up (torsocks not installed)"; fi
  dns=$(dig +short +timeout=5 @127.0.0.1 -p 5353 example.com 2>/dev/null | head -1)
  [ -n "$dns" ] && ok "tor DNS resolver answers" || wn "tor DNS resolver silent"
else no "tor not running"; fi

# 8 fail-closed check: can the shell reach the net without tor?
direct=$(curl -fsS --max-time 8 https://api.ipify.org 2>/dev/null || true)
torip=$(torsocks curl -fsS --max-time 20 https://api.ipify.org 2>/dev/null || true)
if [ -n "$direct" ] && [ -n "$torip" ]; then
  [ "$direct" = "$torip" ] && wn "direct IP == tor IP (coincidence or leak)" || ok "tor IP differs from direct ($torip != $direct)"
fi

# 9 wake lock
if termux-wake-lock 2>/dev/null; then ok "termux-api reachable (wake lock)"; else wn "Termux:API app missing"; fi

# 10 backup freshness
last=$(ls -1t "$LRD_SHARED/backups"/state-*.tar.zst 2>/dev/null | head -1)
if [ -n "$last" ]; then
  age=$(( ( $(date +%s) - $(stat -c %Y "$last") ) / 3600 ))
  [ "$age" -lt 48 ] && ok "backup fresh (${age}h)" || wn "backup stale (${age}h)"
else no "no backup on /sdcard yet — run lrd-backup.sh"; fi

# 11 free space
free=$(df -Pk "$HOME" | awk 'NR==2{print $4}')
[ "$free" -gt 500000 ] && ok "free space $((free/1024)) MB" || wn "low space $((free/1024)) MB"

# 12 vault
[ -f "$LRD_VAULT_IMG" ] && ok "vault image present" || wn "vault not initialised"

# 13 domains
for d in work dispos; do
  [ -d "$LRD_DOMAINS/$d" ] && ok "domain $d present" || wn "domain $d missing"
done

# 14 live hardware bridge (/api/device/power real probe)
power_res=$(curl -fsS --max-time 3 "http://$LRD_BIND:$LRD_PORT/api/device/power" 2>/dev/null || true)
if [ -n "$power_res" ]; then
  pct=$(printf '%s' "$power_res" | grep -o '"percent":[0-9]*' | cut -d: -f2)
  present=$(printf '%s' "$power_res" | grep -o '"present":true')
  if [ -n "$present" ] && [ -n "$pct" ]; then
    ok "hardware bridge returns real sysfs power ($pct%)"
  else
    wn "hardware bridge returned fallback/no-battery"
  fi
else
  wn "hardware bridge not answering on /api/device/power"
fi

# 15 exec bridge
exec_res=$(curl -fsS --max-time 4 -X POST -H "content-type: application/json" -d '{"cmd":"echo ok","pty":false}' "http://127.0.0.1:${LRD_PORT}/api/host/exec/sync" 2>/dev/null || true)
if printf '%s' "$exec_res" | grep -q '"code":0'; then
  ok "exec bridge responds (sync run ok)"
else
  wn "exec bridge unavailable or failed ($exec_res)"
fi

[ $JSON -eq 1 ] && printf '{"pass":%d,"warn":%d,"fail":%d}\n' "$PASS" "$WARN" "$FAIL"
if [ $QUIET -eq 0 ]; then
  echo
  [ $FAIL -eq 0 ] && echo "  PASS $PASS  WARN $WARN  FAIL 0" || echo "  PASS $PASS  WARN $WARN  FAIL $FAIL"
fi
[ $FAIL -eq 0 ]
