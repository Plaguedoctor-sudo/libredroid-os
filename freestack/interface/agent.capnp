@0xa1b2c3d4e5f60021;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";
using Lease = import "lease.capnp";

struct Step {
  verb     @0 :Text;
  argsJson @1 :Text;
  confirm  @2 :Lease.Confirm;
}

interface Agent {
  plan    @0 (ctx :Common.Ctx, goal :Text) -> (steps :List(Step));
  step    @1 (ctx :Common.Ctx, idx :UInt32) -> (done :Bool, outJson :Text);
  budget  @2 (ctx :Common.Ctx) -> (b :Lease.Budget);
  halt    @3 (ctx :Common.Ctx) -> ();
  caps    @4 (ctx :Common.Ctx) -> (list :List(Common.Cap));
}
