@0xa1b2c3d4e5f6001c;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

struct KeyInfo { id @0 :Text; kind @1 :Text; backend @2 :Text; pcrBound @3 :Bool; created @4 :Int64; }

interface Key {
  list    @0 (ctx :Common.Ctx) -> (list :List(KeyInfo));
  seal    @1 (ctx :Common.Ctx, id :Text, pcr :List(UInt8), data :Data) -> ();
  unseal  @2 (ctx :Common.Ctx, id :Text) -> (data :Data);
  rotate  @3 (ctx :Common.Ctx, id :Text) -> (newId :Text);
  revoke  @4 (ctx :Common.Ctx, id :Text) -> ();
  attest  @5 (ctx :Common.Ctx) -> (quote :Data, pcrLog :Data);
}
