@0xa1b2c3d4e5f60027;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";
using Lease = import "lease.capnp";

struct DistanceBoundProof {
  roundTripNs @0 :UInt32;
  peerNonce   @1 :Data;
  signedProof @2 :Data;
}

interface Vehicle {
  unlock      @0 (ctx :Common.Ctx, vin :Text, proof :DistanceBoundProof, lease :Lease.Lease) -> (granted :Bool);
  lock        @1 (ctx :Common.Ctx, vin :Text) -> ();
  telemetry   @2 (ctx :Common.Ctx, vin :Text) -> (statusJson :Text);
}
