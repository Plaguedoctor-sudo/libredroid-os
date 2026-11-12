@0xa1b2c3d4e5f60022;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";
using Lease = import "lease.capnp";

struct Model {
  id        @0 :Text;
  prov      @1 :Lease.Provenance;
  paramsB   @2 :UInt32;
  localOnly @3 :Bool;
  ctxTokens @4 :UInt32;
}

interface Infer {
  models   @0 (ctx :Common.Ctx) -> (list :List(Model));
  load     @1 (ctx :Common.Ctx, id :Text) -> (handle :Data);
  run      @2 (ctx :Common.Ctx, handle :Data, prompt :Text, budget :Lease.Budget) -> (stream :Text);
  unload   @3 (ctx :Common.Ctx, handle :Data) -> ();
  inUse    @4 (ctx :Common.Ctx) -> (list :Text);
}
