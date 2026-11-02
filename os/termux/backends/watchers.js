'use strict';
/* Topic samplers. Each returns a plain object; the hub diffs and coalesces.
   Intervals are deliberately uneven — cheap reads are fast, expensive ones slow. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const device = require('./device.js');

const rd = (p) => { try { return fs.readFileSync(p, 'utf8').trim(); } catch { return ''; } };
const rn = (p, d = null) => { const v = parseInt(rd(p), 10); return Number.isFinite(v) ? v : d; };
const glob = (d, re) => { try { return fs.readdirSync(d).filter((f) => re.test(f)); } catch { return []; } };
const sh = (c, a) => { try { return execFileSync(c, a, { encoding: 'utf8', timeout: 6000, stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };

/* ---------- samples ---------- */
const S = {
  power() {
    const p = device.power();
    return {
      present: p.present, percent: p.percent, charging: p.charging, ac: p.ac, usb: p.usb,
      currentMa: p.currentMa, voltageMv: p.voltageMv, tempC: p.tempC, health: p.health,
      thermal: Math.round(p.thermal * 100) / 100, throttling: p.throttling,
      mode: p.charging ? 'charging' : p.percent <= 5 ? 'critical' : p.percent <= 20 ? 'saver' : 'balanced',
    };
  },
  thermal() {
    const z = device.thermalZones().slice(0, 6);
    return { max: z[0]?.c ?? null, throttling: S.power().throttling, zones: z };
  },
  net() {
    const n = device.net();
    return { online: n.online, type: n.type, metered: n.metered, ssid: n.ssid, operator: n.operator, ip: n.ip, gateway: n.gateway, proxy: n.proxy };
  },
  display() {
    const d = device.display();
    return { brightness: Math.round(d.brightness * 100) / 100, refreshHz: d.refreshHz, docked: d.docked, screenOn: d.screenOn, external: d.external.map((e) => ({ name: e.name, connected: e.connected })) };
  },
  input() {
    return require('./input.js').state();
  },
  storage() {
    const v = device.volumes().filter((x) => !x.removable).slice(0, 4);
    return { free: v.reduce((a, x) => a + x.free, 0), total: v.reduce((a, x) => a + x.total, 0), volumes: v.length };
  },
  lifecycle() { return require('./input.js').lifecycle(); },
  apps() { return require('./input.js').appsSummary(); },
  tor() { return require('./input.js').tor(); },
  exec() { return require('./exec.js').sample(); },
};

function sample(topic) {
  try { return S[topic] ? S[topic]() : null; } catch { return null; }
}

/* ---------- loops ---------- */
const TIMERS = [];
const INTERVALS = {
  power: 5000,
  thermal: 5000,
  net: 4000,
  display: 6000,
  input: 3000,
  storage: 30000,
  lifecycle: 10000,
  apps: 20000,
  tor: 30000,
  exec: 4000,
};

function start() {
  let hub;
  try { hub = require('./events.js'); } catch { return () => {}; }

  for (const [topic, ms] of Object.entries(INTERVALS)) {
    // seed so the first hello has data and no spurious "change" fires
    const first = sample(topic);
    if (first !== null) hub.emit(topic, first, { immediate: true });

    const t = setInterval(() => {
      const s = sample(topic);
      if (s !== null) hub.emit(topic, s);
    }, ms);
    t.unref?.();
    TIMERS.push(t);
  }

  // net is special: a route change is instant via netlink if available
  startNetlink(hub);

  return () => TIMERS.forEach(clearInterval);
}

function startNetlink(hub) {
  const { spawn } = require('child_process');
  let child;
  try {
    child = spawn('ip', ['monitor', 'route', 'address'], { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch { return; }
  let buf = '';
  child.stdout.on('data', (d) => {
    buf += d.toString();
    if (buf.length > 8192) buf = buf.slice(-4096);
    // a burst of route events collapses into one emit thanks to coalescing
    hub.emit('net', S.net());
  });
  child.on('error', () => {});
}

/* ---------- cheap edge triggers via fs.watch ---------- */
function startFsWatch(hub) {
  const targets = [
    ['/sys/class/power_supply', () => hub.emit('power', S.power())],
    ['/sys/class/drm', () => hub.emit('display', S.display())],
    ['/sys/class/thermal', () => hub.emit('thermal', S.thermal())],
  ];
  const watchers = [];
  for (const [p, fn] of targets) {
    try { const w = fs.watch(p, { persistent: false }, () => fn()); watchers.push(w); } catch {}
  }
  return () => watchers.forEach((w) => { try { w.close(); } catch {} });
}

module.exports = { start, sample, intervals: INTERVALS };
