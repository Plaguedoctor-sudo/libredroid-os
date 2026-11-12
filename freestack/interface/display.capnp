@0xa1b2c3d4e5f60015;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

struct Output { name @0 :Text; width @1 :UInt32; height @2 :UInt32; refresh @3 :UInt32; scale @4 :Float32; rotation @5 :UInt16; brightness @6 :UInt8; }

interface Display {
  outputs       @0 (ctx :Common.Ctx) -> (list :List(Output));
  setBrightness @1 (ctx :Common.Ctx, name :Text, pct :UInt8) -> ();
  setScale      @2 (ctx :Common.Ctx, name :Text, scale :Float32) -> ();
  setRotation   @3 (ctx :Common.Ctx, name :Text, deg :UInt16) -> ();
  setMode       @4 (ctx :Common.Ctx, name :Text, w :UInt32, h :UInt32, hz :UInt32) -> ();
  dpms          @5 (ctx :Common.Ctx, on :Bool) -> ();
}
