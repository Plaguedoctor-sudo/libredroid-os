@0xa1b2c3d4e5f60025;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";
using Lease = import "lease.capnp";

struct PaymentRequest {
  merchant  @0 :Text;
  amountSat @1 :UInt64;
  asset     @2 :Text;
  confirm   @3 :Lease.Confirm;
}

interface Wallet {
  balance   @0 (ctx :Common.Ctx, asset :Text) -> (amount :UInt64);
  authorize @1 (ctx :Common.Ctx, req :PaymentRequest, budget :Lease.Budget) -> (txId :Data);
  transitTap @2 (ctx :Common.Ctx, readerId :Text, lease :Lease.Lease) -> (token :Data);
  history   @3 (ctx :Common.Ctx, limit :UInt32) -> (txListJson :Text);
}
