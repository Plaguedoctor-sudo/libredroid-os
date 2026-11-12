@0xa1b2c3d4e5f60001;
# SPDX-License-Identifier: GPL-3.0-or-later
# Frozen. Add fields with new ordinals only; never renumber.

struct Ctx {
  caller        @0 :Text;    # app id, or "root", or "fsctl"
  token         @1 :Data;    # revocable handle id, empty for direct
  dryRun        @2 :Bool;
  idempotencyKey @3 :Text;
}

struct Ok      { message @0 :Text; }
struct Err     { code @0 :UInt16; message @1 :Text; detail @2 :Text; }

struct Envelope {
  union {
    ok   @0 :Ok;
    err  @1 :Err;
  }
  durationMs @2 :UInt32;
  schemaVersion @3 :Text;
}

enum ExitCode {
  ok          @0;
  usage       @1;
  denied      @2;
  notFound    @3;
  conflict    @4;
  unavailable @5;
  internal    @6;
  needsTty    @7;
}

enum Cap {
  net         @0;
  netDns      @1;
  netRaw      @2;
  netModem    @3;
  storage     @4;
  display     @5;
  audio       @6;
  audioRecord @7;
  camera      @8;
  location    @9;
  sensors     @10;
  power       @11;
  keystore    @12;
  clock       @13;
  a11y        @14;
  app         @15;
  update      @16;
  perm        @17;
  infer       @18;
  agent       @19;
  ambient     @20;
  sync        @21;
  continuity  @22;
  caption     @23;
  translate   @24;
  emu         @25;
}

enum Level { debug @0; info @1; warn @2; error @3; }

interface Log {
  write @0 (ctx :Ctx, level :Level, msg :Text) -> ();
}

interface Clock {
  now @0 (ctx :Ctx) -> (unixNs :Int64, source :Text, synced :Bool);
}
