@0xa1b2c3d4e5f60018;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

struct Sensor { id @0 :Text; kind @1 :Text; hz @2 :Float32; active @3 :Bool; }

interface Sensors {
  list      @0 (ctx :Common.Ctx) -> (list :List(Sensor));
  enable    @1 (ctx :Common.Ctx, id :Text) -> ();
  disable   @2 (ctx :Common.Ctx, id :Text) -> ();
  readOnce  @3 (ctx :Common.Ctx, id :Text) -> (x :Float64, y :Float64, z :Float64);
  privacy   @4 (ctx :Common.Ctx, on :Bool) -> ();
}
