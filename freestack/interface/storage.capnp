@0xa1b2c3d4e5f60014;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

struct Volume { id @0 :Text; mount @1 :Text; fs @2 :Text; encrypted @3 :Bool; verity @4 :Bool; used @5 :UInt64; total @6 :UInt64; }

interface Storage {
  volumes    @0 (ctx :Common.Ctx) -> (list :List(Volume));
  usage      @1 (ctx :Common.Ctx, id :Text) -> (used :UInt64, total :UInt64);
  mount      @2 (ctx :Common.Ctx, id :Text) -> ();
  unmount    @3 (ctx :Common.Ctx, id :Text) -> ();
  verity     @4 (ctx :Common.Ctx, id :Text) -> (ok :Bool, detail :Text);
  luksStatus @5 (ctx :Common.Ctx, id :Text) -> (encrypted :Bool, kdf :Text);
  scrub      @6 (ctx :Common.Ctx, id :Text) -> ();
}
