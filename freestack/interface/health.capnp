@0xa1b2c3d4e5f60026;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";
using Lease = import "lease.capnp";

struct Metric {
  name       @0 :Text;
  sampleRate @1 :UInt32;
  localOnly  @2 :Bool;
}

interface Health {
  listMetrics @0 (ctx :Common.Ctx) -> (metrics :List(Metric));
  streamData  @1 (ctx :Common.Ctx, metric :Text, lease :Lease.Lease, budget :Lease.Budget) -> (streamId :Data);
  closeStream @2 (ctx :Common.Ctx, streamId :Data) -> ();
}
