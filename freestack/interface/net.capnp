@0xa1b2c3d4e5f60011;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

enum Proto  { tcp @0; udp @1; icmp @2; }
enum Action { accept @0; drop @1; }
enum IfKind { ethernet @0; wifi @1; modem @2; vpn @3; loopback @4; }

struct Rule {
  proto   @0 :Proto;
  dport   @1 :UInt16;
  daddr   @2 :Data;
  action  @3 :Action;
  comment @4 :Text;
}

struct Iface {
  name @0 :Text;
  kind @1 :IfKind;
  up   @2 :Bool;
  addr @3 :List(Data);
}

struct Status {
  defaultDeny @0 :Bool;
  egressBytes @1 :UInt64;
  ingressBytes @2 :UInt64;
  modemOn @3 :Bool;
  activeIface @4 :Text;
}

interface Net {
  status     @0 (ctx :Common.Ctx) -> (s :Status);
  interfaces @1 (ctx :Common.Ctx) -> (list :List(Iface));
  up         @2 (ctx :Common.Ctx, name :Text) -> ();
  down       @3 (ctx :Common.Ctx, name :Text) -> ();
  allow      @4 (ctx :Common.Ctx, rule :Rule) -> ();
  deny       @5 (ctx :Common.Ctx, rule :Rule) -> ();
  rules      @6 (ctx :Common.Ctx) -> (list :List(Rule));
  meter      @7 (ctx :Common.Ctx) -> (rx :UInt64, tx :UInt64);
  modemKill  @8 (ctx :Common.Ctx, on :Bool) -> ();
  resolve    @9 (ctx :Common.Ctx, name :Text) -> (addrs :List(Data));
}
