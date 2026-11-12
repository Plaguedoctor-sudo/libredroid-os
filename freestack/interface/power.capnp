@0xa1b2c3d4e5f60012;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

enum Profile { saver @0; balanced @1; performance @2; }

struct Battery { present @0 :Bool; percent @1 :UInt8; charging @2 :Bool; minutesLeft @3 :UInt32; }
struct Thermal { zone @0 :Text; milliC @1 :Int32; throttled @2 :Bool; }

interface Power {
  profile      @0 (ctx :Common.Ctx) -> (p :Profile);
  setProfile   @1 (ctx :Common.Ctx, p :Profile) -> ();
  battery      @2 (ctx :Common.Ctx) -> (b :Battery);
  thermal      @3 (ctx :Common.Ctx) -> (list :List(Thermal));
  suspend      @4 (ctx :Common.Ctx) -> ();
  wakeups      @5 (ctx :Common.Ctx) -> (list :List(Text));
}
