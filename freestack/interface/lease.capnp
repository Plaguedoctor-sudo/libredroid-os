@0xa1b2c3d4e5f60020;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

enum BudgetKind { tokens @0; bytes @1; joules @2; wallMs @3; invocations @4; }

struct Lease {
  id        @0 :Data;
  expiresAt @1 :Int64;    # 0 = no expiry
  uses      @2 :UInt32;   # 0 = unlimited
  used      @3 :UInt32;
}

struct Budget {
  kind   @0 :BudgetKind;
  limit  @1 :UInt64;
  spent  @2 :UInt64;
}

struct Confirm {
  required @0 :Bool;
  reason   @1 :Text;
  digest   @2 :Data;      # hash of the exact effect, so consent is bound to it
}

struct Provenance {
  signer    @0 :Data;     # key fingerprint
  sha256    @1 :Data;
  license   @2 :Text;
  origin    @3 :Text;     # where it came from
  trainedOn @4 :Text;     # plain statement, empty if n/a
  quantised @5 :Text;
}

interface Atten {
  narrow @0 (ctx :Common.Ctx, src :Data, caps :List(Common.Cap),
             lease :Lease, budget :Budget) -> (narrowed :Data);
}
