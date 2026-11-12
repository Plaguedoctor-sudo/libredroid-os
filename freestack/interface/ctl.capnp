@0xa1b2c3d4e5f60010;
# SPDX-License-Identifier: GPL-3.0-or-later
using Common = import "common.capnp";
using Net = import "net.capnp";
using Power = import "power.capnp";
using Perm = import "perm.capnp";
using Storage = import "storage.capnp";
using Display = import "display.capnp";
using Audio = import "audio.capnp";
using Camera = import "camera.capnp";
using Sensors = import "sensors.capnp";
using Location = import "location.capnp";
using App = import "app.capnp";
using Update = import "update.capnp";
using Key = import "key.capnp";
using A11y = import "a11y.capnp";
using I18n = import "i18n.capnp";

# Capability distribution. Each accessor returns an interface handle the caller may keep
# only if it holds the corresponding Cap in its token.
interface Control {
  net      @0 (ctx :Common.Ctx) -> (cap :Net.Net);
  power    @1 (ctx :Common.Ctx) -> (cap :Power.Power);
  perm     @2 (ctx :Common.Ctx) -> (cap :Perm.Perm);
  storage  @3 (ctx :Common.Ctx) -> (cap :Storage.Storage);
  display  @4 (ctx :Common.Ctx) -> (cap :Display.Display);
  audio    @5 (ctx :Common.Ctx) -> (cap :Audio.Audio);
  camera   @6 (ctx :Common.Ctx) -> (cap :Camera.Camera);
  sensors  @7 (ctx :Common.Ctx) -> (cap :Sensors.Sensors);
  location @8 (ctx :Common.Ctx) -> (cap :Location.Location);
  app      @9 (ctx :Common.Ctx) -> (cap :App.App);
  update   @10 (ctx :Common.Ctx) -> (cap :Update.Update);
  key      @11 (ctx :Common.Ctx) -> (cap :Key.Key);
  a11y     @12 (ctx :Common.Ctx) -> (cap :A11y.A11y);
  i18n     @13 (ctx :Common.Ctx) -> (cap :I18n.I18n);
  version  @14 (ctx :Common.Ctx) -> (v :Text);
}
