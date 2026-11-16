#!/bin/bash
set -euo pipefail

UP=0; [ "${1:-up}" = "up" ] && UP=1
NS_ALL="tor-gw anon-ws vault work dispos android"
nsname(){ echo "lrd-$1"; }
mkns(){ ip netns add "$(nsname "$1")" 2>/dev/null || true; ip -n "$(nsname "$1")" link set lo up; }
veth(){ ip link add "$1" type veth peer name "$2" 2>/dev/null || true; }

if [ "$UP" = "0" ]; then
  for n in $NS_ALL; do ip netns del "$(nsname "$n")" 2>/dev/null || true; done
  echo "netns: torn down"; exit 0
fi

install -d -m0755 /run/libredroid
for n in $NS_ALL; do install -d -m0755 "/run/libredroid/$n"; mkns "$n"; done

# tor-gw uplink
veth v-tgw-up v-up-host
ip link set v-tgw-up netns "$(nsname tor-gw)"
ip -n "$(nsname tor-gw)" addr add 10.152.151.2/24 dev v-tgw-up
ip -n "$(nsname tor-gw)" link set v-tgw-up up
ip -n "$(nsname tor-gw)" route replace default via 10.152.151.1
ip addr add 10.152.151.1/24 dev v-up-host 2>/dev/null || true
ip link set v-up-host up

# anon-ws — no uplink
veth v-tgw v-anon
ip link set v-tgw  netns "$(nsname tor-gw)"
ip link set v-anon netns "$(nsname anon-ws)"
ip -n "$(nsname tor-gw)"  addr add 10.152.152.10/24 dev v-tgw
ip -n "$(nsname anon-ws)" addr add 10.152.152.11/24 dev v-anon
ip -n "$(nsname tor-gw)"  link set v-tgw  up
ip -n "$(nsname anon-ws)" link set v-anon up
ip -n "$(nsname anon-ws)" route replace default via 10.152.152.10

# vault — lo only. nothing to do.

# NAT domains
declare -A NET=( [work]=10.201.0 [dispos]=10.202.0 [android]=10.203.0 )
for n in work dispos android; do
  net="${NET[$n]}"
  veth "v-$n" "v-$n-host"
  ip link set "v-$n" netns "$(nsname "$n")"
  ip -n "$(nsname "$n")" addr add "${net}.2/24" dev "v-$n"
  ip -n "$(nsname "$n")" link set "v-$n" up
  ip -n "$(nsname "$n")" route replace default via "${net}.1"
  ip addr add "${net}.1/24" dev "v-$n-host" 2>/dev/null || true
  ip link set "v-$n-host" up
done

sysctl -qw net.ipv4.ip_forward=1
nft -f /etc/nftables.d/lrd-nat.nft
ip netns exec "$(nsname tor-gw)" sysctl -qw net.ipv4.ip_forward=1
ip netns exec "$(nsname tor-gw)" nft -f /etc/nftables.d/lrd-tor-gw.nft
echo "netns: fabric up"
