@0xa1b2c3d4e5f60024;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";
using Lease = import "lease.capnp";

struct Claim {
  name  @0 :Text;
  value @1 :Text;
  prov  @2 :Lease.Provenance;
}

interface Identity {
  resolveDID @0 (ctx :Common.Ctx, did :Text) -> (docJson :Text);
  presentClaim @1 (ctx :Common.Ctx, claim :Text, recipient :Text, lease :Lease.Lease) -> (proof :Data);
  verifyClaim  @2 (ctx :Common.Ctx, presentation :Data) -> (valid :Bool, claims :List(Claim));
  revokeClaim  @3 (ctx :Common.Ctx, claimId :Text) -> ();
}
