@0xa1b2c3d4e5f6001a;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

struct AppInfo { id @0 :Text; name @1 :Text; version @2 :Text; caps @3 :List(Common.Cap); running @4 :Bool; }

interface App {
  list    @0 (ctx :Common.Ctx) -> (list :List(AppInfo));
  install @1 (ctx :Common.Ctx, ref :Text, sha256 :Data) -> (id :Text);
  remove  @2 (ctx :Common.Ctx, id :Text) -> ();
  launch  @3 (ctx :Common.Ctx, id :Text) -> (pid :UInt32);
  stop    @4 (ctx :Common.Ctx, id :Text) -> ();
  freeze  @5 (ctx :Common.Ctx, id :Text, on :Bool) -> ();
  caps    @6 (ctx :Common.Ctx, id :Text) -> (list :List(Common.Cap));
}
