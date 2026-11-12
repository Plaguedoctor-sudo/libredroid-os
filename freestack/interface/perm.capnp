@0xa1b2c3d4e5f60013;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

enum State { granted @0; denied @1; ask @2; revoked @3; }

struct Grant {
  app   @0 :Text;
  cap   @1 :Common.Cap;
  state @2 :State;
  scope @3 :Text;   # e.g. a host, a path, a device
  since @4 :Int64;
  expiresAt @5 :Int64;
}

interface Perm {
  list    @0 (ctx :Common.Ctx, app :Text) -> (list :List(Grant));
  grant   @1 (ctx :Common.Ctx, app :Text, cap :Common.Cap, scope :Text) -> (g :Grant);
  revoke  @2 (ctx :Common.Ctx, app :Text, cap :Common.Cap, scope :Text) -> ();
  explain @3 (ctx :Common.Ctx, app :Text, cap :Common.Cap) -> (why :Text);
  audit   @4 (ctx :Common.Ctx, since :Int64) -> (list :List(Grant));
}
