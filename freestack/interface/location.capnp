@0xa1b2c3d4e5f60019;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

enum Mode { off @0; gnss @1; network @2; fused @3; }

struct Fix { lat @0 :Float64; lon @1 :Float64; alt @2 :Float32; accM @3 :Float32; unixMs @4 :Int64; source @5 :Text; }

interface Location {
  mode     @0 (ctx :Common.Ctx) -> (m :Mode);
  setMode  @1 (ctx :Common.Ctx, m :Mode) -> ();
  last     @2 (ctx :Common.Ctx) -> (f :Fix);
  acquire  @3 (ctx :Common.Ctx, timeoutMs :UInt32) -> (f :Fix);
}
