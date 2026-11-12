@0xa1b2c3d4e5f6001e;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";

interface I18n {
  locales      @0 (ctx :Common.Ctx) -> (list :List(Text), current :Text);
  setLocale    @1 (ctx :Common.Ctx, tag :Text) -> ();
  setLayout    @2 (ctx :Common.Ctx, kind :Text) -> ();
  rtl          @3 (ctx :Common.Ctx) -> (on :Bool);
  translations @4 (ctx :Common.Ctx, tag :Text) -> (pct :UInt8);
}
