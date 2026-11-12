@0xa1b2c3d4e5f60023;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";
using Lease = import "lease.capnp";

enum Kind { audio @0; vision @1; motion @2; }

struct Window {
  kind     @0 :Kind;
  startNs  @1 :Int64;
  endNs    @2 :Int64;
  ringKb   @3 :UInt32;
  gated    @4 :Bool;
}

interface Ambient {
  tail     @0 (ctx :Common.Ctx, kind :Kind, windowMs :UInt32, lease :Lease.Lease) -> (w :Window, chunk :Data);
  gate     @1 (ctx :Common.Ctx, kind :Kind, active :Bool) -> ();
  killAll  @2 (ctx :Common.Ctx) -> ();
}
