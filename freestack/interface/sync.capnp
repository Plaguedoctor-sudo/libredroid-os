@0xa1b2c3d4e5f60028;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";
using Lease = import "lease.capnp";

struct ChangeSet {
  docId     @0 :Text;
  seq       @1 :UInt64;
  crdtBytes @2 :Data;
  prov      @3 :Lease.Provenance;
}

interface Sync {
  pushChanges @0 (ctx :Common.Ctx, changes :ChangeSet, lease :Lease.Lease) -> (accepted :Bool);
  pullChanges @1 (ctx :Common.Ctx, docId :Text, sinceSeq :UInt64, budget :Lease.Budget) -> (list :List(ChangeSet));
  peers       @2 (ctx :Common.Ctx) -> (peerCount :UInt32);
}
