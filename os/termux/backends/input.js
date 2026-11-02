'use strict';
/* Input + ambient state. On Android we infer keys from their effects (volume, screen).
   On Linux with /dev/input readable we read evdev directly for real key events. */
const fs = require('fs');
const { execFileSync } = require('child_process');

const sh = (c, a) => { try { return execFileSync(c, a, { encoding: 'utf8', timeout: 5000 }).trim(); } catch { return ''; } };
const rd = (p) => { try { return fs.readFileSync(p, 'utf8').trim(); } catch { return ''; } };
const rn = (p, d = null) => { const v = parseInt(rd(p), 10); return Number.isFinite(v) ? v : d; };
const glob = (d, re) => { try { return fs.readdirSync(d).filter((f) => re.test(f)); } catch { return []; } };

/* ---------- state ---------- */
const st = {
  volume: { media: null, ring: null, alarm: null, call: null },
  screenOn: true,
  backlight: 1,
  keys: [],              // recent { code, name, at } on Linux
  lifecycle: { phase: 'running', since: Date.now(), bootCount: 0, crashCount: 0 },
  tor: { running: false, exitIp: null, verified: false },
  install: null,         // { pkg, phase, pct }
  lastKey: null,
};

const VOL_STREAMS = { call: 0, ring: 2, media: 3, alarm: 4 };

function readVolumes() {
  const out = {};
  for (const [name, idx] of Object.entries(VOL_STREAMS)) {
    const s = sh('media', ['volume', '--stream', String(idx), '--get']);
    const m = /volume is (\d+)/.exec(s);
    out[name] = m ? Number(m[1]) : null;
  }
  return out;
}

function pollVolume(hub) {
  const v = readVolumes();
  for (const k of Object.keys(v)) {
    if (v[k] === null) continue;
    if (st.volume[k] !== null && v[k] !== st.volume[k]) {
      const dir = v[k] > st.volume[k] ? 'up' : 'down';
      hub.emit('input', { kind: 'volume', stream: k, value: v[k], dir }, { immediate: true });
      st.lastKey = { name: `volume_${dir}`, at: Date.now() };
    }
    st.volume[k] = v[k];
  }
}

function pollScreen(hub) {
  const bls = glob('/sys/class/backlight', /.*/);
  const cur = bls[0] ? rn(`/sys/class/backlight/${bls[0]}/actual_brightness`) : null;
  const on = cur === null ? st.screenOn : cur > 0;
  if (on !== st.screenOn) {
    st.screenOn = on;
    hub.emit('input', { kind: 'screen', on }, { immediate: true });
    hub.emit('display', { ...require('./watchers.js').sample('display') }, { immediate: true });
  }
  st.backlight = cur ?? st.backlight;
}

/* ---------- Linux evdev (real kernel-tier keys) ---------- */
const EVDEV = {
  1: 'escape', 102: 'home', 158: 'back', 116: 'power', 115: 'volume_up',
  114: 'volume_down', 113: 'mute', 139: 'menu', 127: 'menu',
};
function startEvdev(hub) {
  const devs = glob('/dev/input', /^event\d+$/).map((f) => `/dev/input/${f}`);
  const opened = [];
  for (const p of devs) {
    try {
      const fd = fs.openSync(p, 'r');
      const buf = Buffer.alloc(24);
      const loop = () => {
        try {
          const n = fs.readSync(fd, buf, 0, 24, null);
          if (n < 24) return;
          const type = buf.readUInt16LE(16);
          const code = buf.readUInt16LE(18);
          const value = buf.readInt32LE(20);
          if (type === 1 && value === 1) {
            const name = EVDEV[code];
            if (name) {
              st.lastKey = { name, code, at: Date.now() };
              hub.emit('input', { kind: 'key', name, code }, { immediate: true });
            }
          }
        } catch { /* EAGAIN */ }
      };
      const t = setInterval(loop, 100);
      t.unref?.();
      opened.push({ fd, t });
    } catch { /* not readable: needs the `input` group */ }
  }
  return () => opened.forEach(({ fd, t }) => { clearInterval(t); try { fs.closeSync(fd); } catch {} });
}

/* ---------- lifecycle from the shell ---------- */
function setLifecycle(patch) {
  Object.assign(st.lifecycle, patch);
  require('./events.js').emit('lifecycle', { ...st.lifecycle }, { immediate: true });
}

/* ---------- install progress: parse pm output ---------- */
function beginInstall(pkg) {
  st.install = { pkg, phase: 'start', pct: 0, at: Date.now() };
  require('./events.js').emit('apps', appsSummary(), { immediate: true });
}
function progressInstall(patch) {
  if (!st.install) return;
  Object.assign(st.install, patch);
  require('./events.js').emit('apps', appsSummary(), { immediate: true });
}
function endInstall(pkg, ok) {
  st.install = null;
  require('./events.js').emit('apps', { ...appsSummary(), installed: ok ? pkg : null }, { immediate: true });
}

/* ---------- tor ---------- */
function pollTor(hub) {
  const running = !!glob('/data/data/com.termux/files/usr/var/service/tor', /./).length;
  if (running !== st.tor.running) { st.tor.running = running; hub.emit('tor', { ...st.tor }, { immediate: true }); }
}

/* ---------- summaries for hello snapshots ---------- */
const state = () => ({
  screenOn: st.screenOn, lastKey: st.lastKey,
  volume: st.volume, install: st.install,
});
const lifecycle = () => ({ ...st.lifecycle });
const tor = () => ({ ...st.tor });
function appsSummary() {
  let n = 0;
  try { n = require('./hostandroid.js').listApps().length; } catch {}
  return { count: n, install: st.install, installed: null };
}

/* ---------- start ---------- */
function start() {
  let hub;
  try { hub = require('./events.js'); } catch { return () => {}; }
  const timers = [
    setInterval(() => pollVolume(hub), 1500),
    setInterval(() => pollScreen(hub), 2000),
    setInterval(() => pollTor(hub), 8000),
  ];
  timers.forEach((t) => t.unref?.());
  const stopEvdev = startEvdev(hub);
  pollVolume(hub); pollScreen(hub);
  return () => { timers.forEach(clearInterval); stopEvdev(); };
}

module.exports = { start, state, lifecycle, tor, appsSummary, setLifecycle, beginInstall, progressInstall, endInstall };
