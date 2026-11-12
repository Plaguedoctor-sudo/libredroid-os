@0xa1b2c3d4e5f6001d;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

struct Feature { id @0 :Text; enabled @1 :Bool; }

interface A11y {
  features   @0 (ctx :Common.Ctx) -> (list :List(Feature));
  enable     @1 (ctx :Common.Ctx, id :Text) -> ();
  disable    @2 (ctx :Common.Ctx, id :Text) -> ();
  tree       @3 (ctx :Common.Ctx) -> (nodeJson :Text);
  activate   @4 (ctx :Common.Ctx, nodeJsonPath :Text) -> ();
  speak      @5 (ctx :Common.Ctx, text :Text) -> ();
  rate       @6 (ctx :Common.Ctx, wpm :UInt16) -> ();
}
