@0xa1b2c3d4e5f6001b;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

enum Slot { a @0; b @1; }
enum UpdState { idle @0; checking @1; available @2; downloading @3; verifying @4; ready @5; applying @6; failed @7; }

struct Status { state @0 :UpdState; activeSlot @1 :Slot; version @2 :Text; signed @3 :Bool; logged @4 :Bool; rollbackCounter @5 :UInt64; }

interface Update {
  status    @0 (ctx :Common.Ctx) -> (s :Status);
  check     @1 (ctx :Common.Ctx) -> (available :Bool, version :Text);
  apply     @2 (ctx :Common.Ctx) -> ();
  rollback  @3 (ctx :Common.Ctx) -> ();
  slots     @4 (ctx :Common.Ctx) -> (active :Slot, other :Slot);
  proof     @5 (ctx :Common.Ctx) -> (rekorUuid :Text);
}
