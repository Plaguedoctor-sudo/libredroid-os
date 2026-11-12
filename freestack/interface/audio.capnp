@0xa1b2c3d4e5f60016;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

struct Node { id @0 :UInt32; name @1 :Text; kind @2 :Kind; muted @3 :Bool; volume @4 :UInt8; enum Kind { sink @0; source @1; } }

interface Audio {
  nodes      @0 (ctx :Common.Ctx) -> (list :List(Node));
  setVolume  @1 (ctx :Common.Ctx, id :UInt32, pct :UInt8) -> ();
  setMute    @2 (ctx :Common.Ctx, id :UInt32, muted :Bool) -> ();
  setDefault @3 (ctx :Common.Ctx, id :UInt32) -> ();
  record     @4 (ctx :Common.Ctx, on :Bool) -> ();
}
