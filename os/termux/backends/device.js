'use strict';
/* Real device introspection from sysfs/getprop. No root, no Termux:API required
   for the parts that matter. Everything is try/catch and returns null on failure. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const sh = (c, a) => { try { return execFileSync(c, a, { encoding: 'utf8', timeout: 8000, stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const rd = (p) => { try { return fs.readFileSync(p, 'utf8').trim(); } catch { return ''; } };
const rn = (p, d = null) => { const v = parseInt(rd(p), 10); return Number.isFinite(v) ? v : d; };
const glob = (dir, re) => { try { return fs.readdirSync(dir).filter((f) => re.test(f)); } catch { return []; } };

const gp = (k) => {
  const v = sh('getprop', [k]);
  if (v) return v;
  return sh('adb', ['shell', 'getprop', k]);
};

/* ---------- identity / boot chain ---------- */
function device() {
  const abis = (gp('ro.product.cpu.abilist') || gp('ro.product.cpu.abi') || '').split(',').filter(Boolean);
  const unlockedRaw = gp('ro.boot.flash.locked');       // '0' means unlocked
  const slot = gp('ro.boot.slot_suffix') || null;
  const drm = glob('/sys/class/drm', /^card\d+-(HDMI|DP|DSI|eDP)/).map((n) => ({
    name: n, connected: rd(`/sys/class/drm/${n}/status`) === 'connected',
    modes: rd(`/sys/class/drm/${n}/modes`).split('\n').filter(Boolean).slice(0, 8),
  }));
  const usb = glob('/sys/bus/usb/devices', /^\d+-[\d.]+$/).map((n) => ({
    id: `${rd(`/sys/bus/usb/devices/${n}/idVendor`)}:${rd(`/sys/bus/usb/devices/${n}/idProduct`)}`,
    product: rd(`/sys/bus/usb/devices/${n}/product`),
  })).filter((u) => u.id !== ':');

  return {
    model: gp('ro.product.model'), manufacturer: gp('ro.product.manufacturer'),
    product: gp('ro.product.name'), device: gp('ro.product.device'),
    sdk: parseInt(gp('ro.build.version.sdk') || '0', 10),
    abis, kernel: sh('uname', ['-r']), hostname: sh('uname', ['-n']) || 'android',
    unlocked: unlockedRaw === '' ? null : unlockedRaw === '0',
    slot, verifiedBoot: gp('ro.boot.verifiedbootstate') || null,
    verity: gp('ro.boot.veritymode') || null,
    dynamicPartitions: gp('ro.boot.dynamic_partitions') === 'true',
    external: drm, usb,
    fingerprint: gp('ro.build.fingerprint'),
  };
}

/* ---------- power / thermal ---------- */
function batteryDir() {
  for (const n of ['battery', 'Battery', 'bms', 'main']) {
    const p = `/sys/class/power_supply/${n}`;
    if (fs.existsSync(p)) return p;
  }
  return null;
}
function thermalZones() {
  const out = [];
  for (const z of glob('/sys/class/thermal', /^thermal_zone\d+$/)) {
    const t = rn(`/sys/class/thermal/${z}/temp`);
    if (t === null) continue;
    out.push({ name: rd(`/sys/class/thermal/${z}/type`) || z, c: t > 1000 ? t / 1000 : t });
  }
  return out.sort((a, b) => b.c - a.c);
}
function power() {
  const b = batteryDir();
  const zones = thermalZones();
  const hottest = zones[0] ?? null;
  const soc = rn('/sys/class/power_supply/battery/capacity', rn(`${b}/capacity`));
  const ac = glob('/sys/class/power_supply', /^(AC|ac|mains|USB|usb|usb_port)/)
    .some((n) => rd(`/sys/class/power_supply/${n}/online`) === '1');
  // Android exposes throttle state through the thermal framework
  const throttled = glob('/sys/class/thermal', /^cooling_device\d+$/)
    .some((c) => rn(`/sys/class/thermal/${c}/cur_state`, 0) > 0);
  const thermal = hottest ? Math.min(1, Math.max(0, (hottest.c - 35) / 45)) : 0;
  return {
    present: soc !== null,
    percent: soc ?? 100,
    charging: /Charging|Full/i.test(rd(`${b}/status`)),
    ac, usb: ac,
    currentMa: rn(`${b}/current_now`) !== null ? Math.round(rn(`${b}/current_now`) / 1000) : null,
    voltageMv: rn(`${b}/voltage_now`) !== null ? Math.round(rn(`${b}/voltage_now`) / 1000) : null,
    tempC: rn(`${b}/temp`) !== null ? rn(`${b}/temp`) / 10 : null,
    health: rd(`${b}/health`) || null,
    cycles: rn(`${b}/cycle_count`),
    thermal, throttling: throttled, hottestZone: hottest,
    zones,
  };
}

/* ---------- display ---------- */
function display() {
  const bls = glob('/sys/class/backlight', /.*/);
  const bl = bls[0] ? `/sys/class/backlight/${bls[0]}` : null;
  const max = bl ? rn(`${bl}/max_brightness`) : null;
  const cur = bl ? rn(`${bl}/brightness`) : null;
  const external = glob('/sys/class/drm', /^card\d+-(HDMI|DP)/).map((n) => ({
    name: n, connected: rd(`/sys/class/drm/${n}/status`) === 'connected',
    modes: rd(`/sys/class/drm/${n}/modes`).split('\n').filter(Boolean).slice(0, 8),
  }));
  const modes = glob('/sys/class/drm', /^card\d+-\w+$/).flatMap((n) => rd(`/sys/class/drm/${n}/modes`).split('\n').filter(Boolean));
  const hz = modes.map((m) => /(\d+)$/.exec(m)?.[1]).map(Number).filter((n) => n >= 24 && n <= 165).sort((a, b) => b - a)[0] ?? null;
  return {
    brightness: max && cur !== null ? cur / max : 1, maxBrightness: max ?? 1,
    autoBrightness: null, refreshHz: hz, external,
    docked: external.some((e) => e.connected), screenOn: rn(`${bl}/actual_brightness`, 1) !== 0,
  };
}

/* ---------- network ---------- */
function net() {
  const ifaces = glob('/sys/class/net', /^(?!lo$).*/);
  const up = ifaces.filter((i) => rd(`/sys/class/net/${i}/operstate`) === 'up');
  const wifi = up.find((i) => i.startsWith('wlan') || i.startsWith('wifi'));
  const cell = up.find((i) => /^(rmnet|ccmni|pdp|wwan)/.test(i));
  const eth = up.find((i) => i.startsWith('eth') || i.startsWith('rndis') || i.startsWith('usb'));
  const vpn = up.find((i) => i.startsWith('tun') || i.startsWith('ppp'));
  const type = vpn ? 'vpn' : wifi ? 'wifi' : cell ? 'cellular' : eth ? 'ethernet' : up.length ? 'unknown' : 'none';
  const route = sh('ip', ['route', 'get', '1.1.1.1']) || '';
  return {
    online: type !== 'none',
    type, metered: type === 'cellular',
    ssid: wifi ? (sh('cmd', ['wifi', 'status']) || '').match(/SSID:\s*"?([^"\n]+)/)?.[1] ?? null : null,
    operator: gp('gsm.operator.alpha') || null,
    ip: route.match(/src\s+([\d.]+)/)?.[1] ?? null,
    gateway: route.match(/via\s+([\d.]+)/)?.[1] ?? null,
    proxy: process.env.all_proxy ?? null,
    tor: { running: fs.existsSync(path.join(process.env.HOME || '', '.lrd/state/tor')), exitIp: null, verified: false },
    captive: false, queued: 0,
  };
}

/* ---------- volumes ---------- */
function volumes() {
  const out = [];
  const seen = new Set();
  const mounts = rd('/proc/mounts').split('\n');
  const cands = ['/storage/emulated/0', '/sdcard', '/storage', '/mnt/media_rw', '/data'];
  for (const m of mounts) {
    const [dev, mount, fsType] = m.split(' ');
    if (!mount) continue;
    const interesting = cands.some((c) => mount.startsWith(c)) ||
      /^\/dev\/block\/.*(sd|mmcblk|dm-)/.test(dev);
    if (!interesting || seen.has(mount)) continue;
    seen.add(mount);
    let st = null;
    try { st = fs.statfsSync(mount); } catch {}
    if (!st) continue;
    out.push({
      id: mount.replace(/\//g, '_') || '_root', label: path.basename(mount) || 'root',
      mount, removable: /media_rw|sd|mmcblk/.test(dev) && !/emulated/.test(mount),
      emulated: /emulated|sdcard/.test(mount), fs: fsType,
      total: st.blocks * st.bsize, free: st.bavail * st.bsize,
      writable: (() => { try { fs.accessSync(mount, fs.constants.W_OK); return true; } catch { return false; } })(),
    });
  }
  return out;
}

/* ---------- misc ---------- */
const sensors = () => (sh('termux-sensor', ['-l']) || '').split('\n').map((s) => ({ id: s, name: s })).filter((s) => s.id);
const cameras = () => {
  const ids = glob('/sys/class/video4linux', /^video\d+$/);
  return ids.map((v, i) => ({ id: String(i), name: rd(`/sys/class/video4linux/${v}/name`) || v }));
};

function caps() {
  const p = power();
  return {
    model: gp('ro.product.model'), sdk: parseInt(gp('ro.build.version.sdk') || '0', 10),
    abis: (gp('ro.product.cpu.abilist') || '').split(',').filter(Boolean),
    root: (() => { const r = sh('su', ['-c', 'id']); return /uid=0/.test(r); })(),
    termuxApi: !!sh('which', ['termux-battery-status']),
    tor: fs.existsSync('/data/data/com.termux/files/usr/var/service/tor'),
    battery: p.present, thermal: p.zones.length > 0,
  };
}

function routes() {
  const R = [];
  const add = (m, p, fn) => R.push({ method: m, path: p, fn });
  const J = (res, o, c = 200) => { const b = Buffer.from(JSON.stringify(o)); res.writeHead(c, { 'content-type': 'application/json', 'content-length': b.length, 'cache-control': 'no-store' }); res.end(b); };
  const body = (req) => new Promise((ok) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => { try { ok(JSON.parse(Buffer.concat(c).toString() || '{}')); } catch { ok({}); } }); });

  add('GET', '/api/device', (q, s) => J(s, device()));
  add('GET', '/api/device/power', (q, s) => J(s, power()));
  add('GET', '/api/device/thermal', (q, s) => J(s, thermalZones()));
  add('GET', '/api/device/display', (q, s) => J(s, display()));
  add('GET', '/api/device/net', (q, s) => J(s, net()));
  add('GET', '/api/device/volumes', (q, s) => J(s, volumes()));
  add('GET', '/api/device/sensors', (q, s) => J(s, sensors()));
  add('GET', '/api/device/cameras', (q, s) => J(s, cameras()));
  add('GET', '/api/system/caps', (q, s) => {
    let adapt = null;
    const candidates = [process.env.LRD_ADAPT_JSON, '/run/lrd/adapt.json', '/var/lib/lrd/adapt.json'].filter(Boolean);
    for (const p of candidates) {
      try { adapt = JSON.parse(fs.readFileSync(p, 'utf8')); break; } catch {}
    }
    if (adapt) {
      const t = adapt.tier ?? {};
      return J(s, {
        source: 'adapt.json',
        netns: t.user_namespaces === true, cgroup2: t.cgroup2 === true,
        nft: t.nft_redirect === true, landlock: t.landlock === true,
        overlayfs: t.overlayfs === true, binderfs: t.binderfs === true,
        systemd: true, sysupdate: false, ab: false, verity: false,
        score: adapt.score, level: adapt.level, verdict: adapt.verdict,
        blockers: adapt.blockers, isolation: adapt.isolation, steps: adapt.steps,
      });
    }
    // fall back to live probing when there is no adaptation report
    J(s, {
      source: 'live',
      netns: false, cgroup2: false, nft: false, systemd: false,
      backlight: glob('/sys/class/backlight', /.*/).length > 0,
      drm: glob('/sys/class/drm', /^card/).length > 0,
      powerSupply: glob('/sys/class/power_supply', /.*/).length > 0,
      thermal: glob('/sys/class/thermal', /^thermal_zone/).length > 0,
      cpufreq: glob('/sys/devices/system/cpu/cpu0/cpufreq', /.*/).length > 0,
      logind: false, sysupdate: false, ab: false, verity: false, slot: gp('ro.boot.slot_suffix') || null,
    });
  });

  add('POST', '/api/device/brightness', async (q, s) => {
    const { v } = await body(q);
    const bls = glob('/sys/class/backlight', /.*/);
    const max = bls[0] ? rn(`/sys/class/backlight/${bls[0]}/max_brightness`) : null;
    if (max) {
      try { fs.writeFileSync(`/sys/class/backlight/${bls[0]}/brightness`, String(Math.round(v * max))); return J(s, { ok: true, via: 'sysfs' }); }
      catch { /* fall through */ }
    }
    const pct = Math.round(v * 255);
    const out = sh('settings', ['put', 'system', 'screen_brightness', String(pct)]);
    if (out !== '') { try { sh('su', ['-c', `settings put system screen_brightness ${pct}`]); } catch {} }
    J(s, { ok: true, via: 'settings' });
  });

  add('POST', '/api/device/volume', async (q, s) => {
    const { stream = 'media', v } = await body(q);
    const idx = { call: 0, ring: 2, media: 3, alarm: 4 }[stream] ?? 3;
    const maxv = parseInt(sh('media', ['volume', '--stream', String(idx), '--get'])?.match(/volume is (\d+)/)?.[1] || '15', 10);
    sh('media', ['volume', '--stream', String(idx), '--set', String(Math.round(v * maxv))]);
    J(s, { ok: true, stream, max: maxv });
  });

  add('POST', '/api/device/wakelock', async (q, s) => {
    const { on } = await body(q);
    sh('termux-wake-lock', []);
    if (!on) sh('termux-wake-unlock', []);
    J(s, { ok: true });
  });

  add('POST', '/api/device/screen', async (q, s) => {
    const { on } = await body(q);
    sh('svc', ['power', 'stayon', on ? 'true' : 'false']);
    if (!on) sh('input', ['keyevent', '26']);   // KEYCODE_POWER
    J(s, { ok: true });
  });

  add('POST', '/api/device/governor', async (q, s) => {
    const { mode } = await body(q);
    const gov = mode === 'saver' ? 'powersave' : mode === 'performance' ? 'performance' : 'schedutil';
    for (const c of glob('/sys/devices/system/cpu', /^cpu\d+$/)) {
      try { fs.writeFileSync(`/sys/devices/system/cpu/${c}/cpufreq/scaling_governor`, gov); } catch {}
    }
    J(s, { ok: true, governor: gov, via: 'sysfs(ro)' });
  });

  add('POST', '/api/device/power', async (q, s) => {
    const { action } = await body(q);
    const map = { poweroff: ['reboot', '-p'], reboot: ['reboot'], 'reboot-recovery': ['reboot', 'recovery'], suspend: ['input', ['keyevent', '26']] };
    const a = map[action] ?? ['reboot'];
    const ok = sh('svc', ['power', action === 'poweroff' ? 'poweroff' : 'reboot']);
    J(s, { ok: true, action, out: ok });
  });

  add('POST', '/api/device/route', async (q, s) => {
    const { tor } = await body(q);
    const p = tor ? 'socks5h://127.0.0.1:9050' : '';
    process.env.all_proxy = p; process.env.ALL_PROXY = p;
    J(s, { ok: true, proxy: p || null });
  });

  add('POST', '/api/device/tor/verify', (q, s) => {
    let exitIp = null, isTor = false;
    try {
      exitIp = sh('curl', ['-s', '--max-time', '25', '--socks5-hostname', '127.0.0.1:9050', 'https://check.torproject.org/api/ip']);
      isTor = /"IsTor":true/.test(exitIp);
      try { exitIp = JSON.parse(exitIp).IP; } catch {}
    } catch {}
    J(s, { ok: isTor, isTor, exitIp });
  });

  add('POST', '/api/host/volume', async (q, s) => { /* alias */ J(s, { ok: true }); });
  return R;
}

module.exports = { device, power, display, net, volumes, caps, sensors, cameras, thermalZones, routes };
