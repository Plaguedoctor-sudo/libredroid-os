#!/usr/bin/env node
/**
 * LibreDroid system bridge — REST + WebSocket, ZERO npm dependencies.
 * This replaces server/hardwareBridgePlugin.ts in production: there is no
 * adb here, everything talks to the real kernel.
 */
'use strict';

const http = require('node:http');
const net = require('node:net');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');

const PORT = Number(process.env.PORT || 3001);
const SHELL_DIR = process.env.SHELL_DIR || '/opt/libredroid/shell';
const NOVNC_DIR = '/usr/share/novnc';

const DOMAINS = ['vault', 'tor-gw', 'anon-ws', 'work', 'dispos', 'android'];
const WS_PORT = { vault: 5911, 'anon-ws': 5912, work: 5914, dispos: 5915, android: 5916 };

const run = (cmd, args = [], opts = {}) =>
  new Promise((ok, no) =>
    execFile(cmd, args, { timeout: 15000, maxBuffer: 8 << 20, ...opts },
      (e, so, se) => (e ? no(new Error((se || e.message).trim())) : ok(String(so).trim()))));

const ok = (r, body) => { r.writeHead(200, { 'content-type': 'application/json' }); r.end(JSON.stringify(body)); };
const bad = (r, code, msg) => { r.writeHead(code, { 'content-type': 'application/json' }); r.end(JSON.stringify({ error: msg })); };
const readBody = (req) => new Promise((res) => { let b = ''; req.on('data', c => b += c); req.on('end', () => { try { res(JSON.parse(b || '{}')); } catch { res({}); }
}); });

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json',
};

async function serveFile(res, root, rel) {
  const p = path.normalize(path.join(root, rel));
  if (!p.startsWith(root)) return bad(res, 403, 'traversal');
  try {
    const st = await fsp.stat(p);
    const file = st.isDirectory() ? path.join(p, 'index.html') : p;
    const buf = await fsp.readFile(file);
    res.writeHead(200, {
      'content-type': MIME[path.extname(file)] || 'application/octet-stream',
      'cache-control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(buf);
  } catch {
    // SPA fallback
    try { res.writeHead(200, { 'content-type': 'text/html' }); res.end(await fsp.readFile(path.join(root, 'index.html'))); }
    catch { bad(res, 404, 'not found'); }
  }
}

/* ────────────────────────────── status ────────────────────────────── */

async function netnsState() {
  try { return (await run('ip', ['netns', 'list'])).split('\n').map(l => l.split(' ')[0]).filter(Boolean); }
  catch { return []; }
}

async function domainState() {
  try {
    const out = await run('systemctl', ['list-units', '--type=service', '--all', '--plain', '--no-legend', 'libredroid-domain@*']);
    return out.split('\n').filter(Boolean).map(l => {
      const p = l.trim().split(/\s+/);
      return { name: p[0].replace('libredroid-domain@', '').replace('.service', ''), active: p[2] === 'running' };
    });
  } catch { return []; }
}

async function torState() {
  try {
    const out = await run('ip', ['netns', 'exec', 'lrd-tor-gw', 'ss', ['-Htnp'].join('')]);
    return { running: out.includes('9040'), raw: out.split('\n').filter(Boolean).slice(0, 8) };
  } catch { return { running: false, raw: [] }; }
}

async function waydroidState() {
  try {
    const out = await run('systemd-run', ['-M', 'android', '--pipe', '--wait', '--collect', 'waydroid', 'status']);
    return { installed: true, raw: out.split('\n').slice(0, 12) };
  } catch { return { installed: false, raw: [] }; }
}

/* ─────────────────────────────── HTTP ─────────────────────────────── */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  try {
    if (p.startsWith('/novnc/')) return serveFile(res, NOVNC_DIR, p.slice(7));
    if (p.startsWith('/api/')) { /* handled below */ }
    else if (req.method === 'GET') return serveFile(res, SHELL_DIR, p === '/' ? '/index.html' : p);

    /* ---- status ---- */
    if (p === '/api/status' && req.method === 'GET') {
      const [battery, mem, uptime, netns, domains, tor, wd] = await Promise.all([
        (async () => { try { const b = (await fsp.readdir('/sys/class/power_supply'))[0];
          return { level: +(await fsp.readFile(`/sys/class/power_supply/${b}/capacity`, 'utf8')),
                   charging: (await fsp.readFile(`/sys/class/power_supply/${b}/status`, 'utf8')).trim() === 'Charging' }; }
          catch { return null; } })(),
        (async () => { try { const m = await fsp.readFile('/proc/meminfo', 'utf8');
          const g = k => +(m.match(new RegExp(`^${k}:\\s+(\\d+)`, 'm'))?.[1] || 0) / 1048576;
          return { totalMb: Math.round(g('MemTotal')), availMb: Math.round(g('MemAvailable')) }; }
          catch { return null; } })(),
        fsp.readFile('/proc/uptime', 'utf8').then(s => Math.round(+s.split(' ')[0])).catch(() => 0),
        netnsState(), domainState(), torState(), waydroidState(),
      ]);
      const uname = await run('uname', ['-srm']).catch(() => 'linux');
      return ok(res, {
        host: require('node:os').hostname(),
        kernel: uname,
        uptimeSec: uptime,
        battery, mem,
        netns, domains, tor, waydroid: wd,
        freeform: true,
      });
    }

    /* ---- domains ---- */
    if (p === '/api/domains' && req.method === 'GET') return ok(res, await domainState());

    let m;
    if ((m = p.match(/^\/api\/domains\/([a-z0-9-]+)\/(start|stop|restart)$/)) && req.method === 'POST') {
      const [, name, action] = m;
      if (!DOMAINS.includes(name)) return bad(res, 400, 'unknown domain');
      if (action !== 'stop') await run('/opt/libredroid/bin/lrd-stream', ['start', name]).catch(() => {});
      await run('systemctl', [action, `libredroid-domain@${name}.service`]);
      return ok(res, { name, action });
    }

    if ((m = p.match(/^\/api\/domains\/([a-z0-9-]+)\/exec$/)) && req.method === 'POST') {
      const body = await readBody(req);
      if (!DOMAINS.includes(m[1])) return bad(res, 400, 'unknown domain');
      const out = await run('systemd-run', ['-M', m[1], '--pipe', '--wait', '--collect', body.cmd, ...(body.args || [])]);
      return ok(res, { out });
    }

    if (p === '/api/domains/tor/rotate' && req.method === 'POST') {
      const out = await run('ip', ['netns', 'exec', 'lrd-tor-gw', 'sh', '-c',
        "echo -e 'AUTHENTICATE \"\"\\r\\nSIGNAL NEWNYM\\r\\nQUIT' | nc 10.152.152.10 9051"]);
      return ok(res, { out });
    }

    /* ---- power / display ---- */
    if (p === '/api/power' && req.method === 'GET') {
      const b = (await fsp.readdir('/sys/class/power_supply')).find(x => x.startsWith('BAT') || x.startsWith('bat'));
      if (!b) return ok(res, { present: false });
      return ok(res, {
        present: true,
        level: +(await fsp.readFile(`/sys/class/power_supply/${b}/capacity`, 'utf8')),
        charging: (await fsp.readFile(`/sys/class/power_supply/${b}/status`, 'utf8')).trim() === 'Charging',
      });
    }

    if ((m = p.match(/^\/api\/brightness\/(\d+)$/)) && req.method === 'POST') {
      await run('brightnessctl', ['set', `${m[1]}%`]);
      return ok(res, { brightness: +m[1] });
    }

    /* ---- network ---- */
    if (p === '/api/network' && req.method === 'GET') {
      const out = await run('nmcli', ['-t', '-f', 'DEVICE,TYPE,STATE,CONNECTION', 'device']);
      return ok(res, { devices: out.split('\n').filter(Boolean).map(l => {
        const [device, type, state, connection] = l.split(':');
        return { device, type, state, connection };
      })});
    }

    if (p === '/api/network/wifi' && req.method === 'POST') {
      const { on } = await readBody(req);
      await run('nmcli', ['radio', 'wifi', on ? 'on' : 'off']);
      return ok(res, { wifi: !!on });
    }

    /* ---- waydroid: REAL apk install (replaces the filename parser) ---- */
    if (p === '/api/waydroid/apps' && req.method === 'GET') {
      try {
        const out = await run('systemd-run', ['-M', 'android', '--pipe', '--wait', '--collect', 'waydroid', 'app', 'list']);
        return ok(res, { apps: out.split('\n').filter(Boolean).map(l => { const [pkg, name] = l.split('\t'); return { pkg, name: name || pkg }; }) });
      } catch (e) { return ok(res, { apps: [], error: e.message }); }
    }

    if (p === '/api/waydroid/install' && req.method === 'POST') {
      const { path: apk } = await readBody(req);
      if (!apk || !apk.endsWith('.apk')) return bad(res, 400, 'path must be a .apk');
      const out = await run('systemd-run', ['-M', 'android', '--pipe', '--wait', '--collect', 'waydroid', 'app', 'install', apk]);
      return ok(res, { out });
    }

    /* ---- nft: live tracker set ---- */
    if (p === '/api/trackers' && req.method === 'GET') {
      const out = await run('ip', ['netns', 'exec', 'lrd-android', 'nft', 'list', 'set', 'ip', 'lrd_android', 'trackers']).catch(() => '');
      return ok(res, { raw: out });
    }

    return bad(res, 404, `no route: ${req.method} ${p}`);
  } catch (e) {
    return bad(res, 500, e.message);
  }
});

/* ─────────────── WebSocket proxy: browser ⇄ wayvnc (raw pipe) ───────────────
 * noVNC speaks WebSocket. websockify already terminates WS→TCP for us, so the
 * bridge just replays the HTTP upgrade verbatim and pipes bytes. Client frames
 * arrive masked, server frames leave unmasked — a raw pipe is byte-correct.
 */
server.on('upgrade', (req, socket, head) => {
  const m = req.url.match(/^\/api\/stream\/([a-z0-9-]+)/);
  const port = m && WS_PORT[m[1]];
  if (!port) { socket.destroy(); return; }

  const up = net.connect(port, '127.0.0.1', () => {
    const lines = [
      'GET / HTTP/1.1',
      `Host: 127.0.0.1:${port}`,
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Key: ${req.headers['sec-websocket-key']}`,
      'Sec-WebSocket-Version: 13',
    ];
    if (req.headers['sec-websocket-protocol']) {
      lines.push(`Sec-WebSocket-Protocol: ${req.headers['sec-websocket-protocol']}`);
    }
    lines.push('', '');
    up.write(lines.join('\r\n'));
    if (head && head.length) up.write(head);
    socket.pipe(up);
    up.pipe(socket);
  });

  up.on('error', () => socket.destroy());
  socket.on('error', () => up.destroy());
  socket.setNoDelay(true);
  up.setNoDelay(true);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[libredroid-bridge] listening on 127.0.0.1:${PORT}`);
  console.log(`[libredroid-bridge] shell: ${SHELL_DIR}`);
});
