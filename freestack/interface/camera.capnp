@0xa1b2c3d4e5f60017;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

struct Device { id @0 :Text; name @1 :Text; rear @2 :Bool; maxW @3 :UInt32; maxH @4 :UInt32; }

interface Camera {
  devices @0 (ctx :Common.Ctx) -> (list :List(Device));
  open    @1 (ctx :Common.Ctx, id :Text) -> (node :Text);
  close   @2 (ctx :Common.Ctx, id :Text) -> ();
  inUse   @3 (ctx :Common.Ctx) -> (list :Text);
}
