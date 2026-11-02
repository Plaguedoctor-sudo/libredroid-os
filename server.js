#!/usr/bin/env node
/**
 * LibreDroid Shell + Bridge Server
 * Loopback-only, zero npm dependencies, supporting Termux hostandroid backend and static SPA serving.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.LRD_PORT || process.env.PORT || '3001', 10);
const HOST = process.env.LRD_BIND || '127.0.0.1';
const STRICT_LOCAL = process.env.LRD_STRICT_LOCAL !== '0';
const BACKEND = process.env.LRD_BACKEND || 'hostandroid';
const HOME = process.env.LRD_HOME || path.join(process.env.HOME || '/root', '.lrd');
const LRD_MODELS = process.env.LRD_MODELS || path.join(HOME, 'models');
const DIST_DIR = path.resolve(__dirname, 'dist');

// Fail-closed local binding check
if (STRICT_LOCAL && (HOST === '0.0.0.0' || HOST === '::')) {
  console.error('[SECURITY FATAL] LRD_STRICT_LOCAL=1 forbids binding to 0.0.0.0 / LAN. Refusing to start.');
  process.exit(1);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.bin': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
};

// Route registry
const routes = [];

/* ---------- auth: token, Origin, Host ---------- */
function getAuthToken() {
  try { return fs.readFileSync('/etc/lrd/bridge.token', 'utf8').trim(); } catch { return null; }
}
const ALLOW_ORIGINS = (process.env.LRD_ALLOW_ORIGINS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const ALLOW_HOSTS = ['127.0.0.1', 'localhost', '[::1]'];

function authCheck(req, url) {
  // Host header: defeats DNS rebinding
  const host = (req.headers.host || '').split(':')[0];
  if (!ALLOW_HOSTS.includes(host)) return { ok: false, code: 421, why: `bad host ${host}` };

  // Origin: any page could POST to localhost before this existed
  const origin = req.headers.origin;
  if (origin) {
    let ohost = '';
    try { ohost = new URL(origin).hostname; } catch {}
    const allowed = ALLOW_ORIGINS.length
      ? ALLOW_ORIGINS.some((o) => o === origin || o === ohost)
      : (ohost === '127.0.0.1' || ohost === 'localhost' || ohost === '');
    if (!allowed) return { ok: false, code: 403, why: `bad origin ${origin}` };
  }

  // Token: required for anything that can change state
  const mutating = req.method !== 'GET' && req.method !== 'HEAD';
  const exempt = url.pathname === '/healthz' || url.pathname === '/api/events';
  if (mutating && !exempt) {
    const token = getAuthToken();
    if (!token) return { ok: true, why: 'no token configured' };
    const got = req.headers['x-lrd-token'] || url.searchParams.get('token');
    if (got !== token) return { ok: false, code: 401, why: 'bad token' };
  }
  return { ok: true };
}

// App scoping
const APP_TOKENS = new Map();   // appId -> { token, allow: [regex], deny: [] }
const DEFAULT_APP_ALLOW = [/^\/api\/host\/caps$/, /^\/api\/waydroid\//, /^\/api\/files\//, /^\/api\/status$/];

function registerApp(appId, allow = DEFAULT_APP_ALLOW) {
  const token = crypto.randomBytes(24).toString('base64url');
  APP_TOKENS.set(appId, { token, allow, deny: [] });
  return token;
}

function appAuth(req, url) {
  const appId = req.headers['x-lrd-app-id'] || url.searchParams.get('appId');
  if (!appId) return { ok: true };
  const rec = APP_TOKENS.get(appId);
  if (!rec) return { ok: false, code: 403, why: `unknown app ${appId}` };
  if (req.headers['x-lrd-app-token'] !== rec.token) return { ok: false, code: 401, why: 'bad app token' };
  if (!rec.allow.some((r) => r.test(url.pathname))) return { ok: false, code: 403, why: 'path not allowed for this app' };
  return { ok: true };
}

// CORS so the shell (and only the shell) can read responses
function cors(req, res) {
  const o = req.headers.origin;
  if (!o) return;
  const h = (() => { try { return new URL(o).hostname; } catch { return ''; } })();
  if (h === '127.0.0.1' || h === 'localhost' || ALLOW_ORIGINS.includes(o)) {
    res.setHeader('access-control-allow-origin', o);
    res.setHeader('access-control-allow-headers', 'content-type,x-lrd-token');
    res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
    res.setHeader('vary', 'origin');
  }
}

function addRoute(method, pattern, handler) {
  // convert route path with :param into regex
  const paramNames = [];
  const regexStr = '^' + pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  }) + '$';
  routes.push({
    method: method.toUpperCase(),
    regex: new RegExp(regexStr),
    paramNames,
    handler,
  });
}

// Mount hostandroid and bare-metal backend modules
const backendModules = ['hostandroid.js', 'device.js', 'events.js', 'remedies.js', 'exec.js'];
for (const m of backendModules) {
  try {
    const modPath = path.join(__dirname, 'os/termux/backends', m);
    if (fs.existsSync(modPath)) {
      const mod = require(modPath);
      if (mod.routes) {
        for (const r of mod.routes()) {
          addRoute(r.method, r.path, r.fn);
        }
      }
      console.log(`[LRD] backend: ${m} mounted`);
    }
  } catch (err) {
    console.error(`[LRD] Error mounting ${m}:`, err);
  }
}

try {
  const watchers = require('./os/termux/backends/watchers.js');
  watchers.start();
  console.log('[LRD] backend: in-process watchers started');
} catch (err) {
  console.warn('[LRD] In-process watchers note:', err.message);
}

function serveFile(res, filePath, contentType) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: 'File not found' }));
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = contentType || MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'content-type': mime,
      'content-length': stats.size,
      'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  if (method === 'OPTIONS') {
    cors(req, res);
    res.writeHead(204);
    return res.end();
  }
  cors(req, res);

  const a = authCheck(req, parsedUrl);
  if (!a.ok) {
    res.writeHead(a.code, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, error: a.why }));
  }

  const aa = appAuth(req, parsedUrl);
  if (!aa.ok) {
    res.writeHead(aa.code, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, error: aa.why }));
  }

  if (pathname === '/api/app/register' && method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const json = JSON.parse(body || '{}');
        const appId = json.appId || `app-${crypto.randomUUID().slice(0, 8)}`;
        const token = registerApp(appId);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, appId, token }));
      } catch (e) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e.message) }));
      }
    });
    return;
  }

  // 1. /healthz endpoint for runit / watchdog
  if (pathname === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ ok: true, backend: BACKEND, up: process.uptime() }));
  }

  // 1.01 /api/system/lock endpoint to trigger session lock from CLI (lrd-lock) or host
  if (pathname === '/api/system/lock') {
    try {
      const events = require('./os/termux/backends/events.js');
      events.emit('lifecycle', { action: 'lock', at: Date.now() }, { immediate: true });
    } catch {}
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ ok: true, locked: true }));
  }

  // 1.02 /api/device/power endpoint for graceful shutdown / reboot
  if (pathname === '/api/device/power') {
    if (method === 'POST') {
      let b = '';
      req.on('data', (c) => (b += c));
      req.on('end', () => {
        let action = 'poweroff';
        try { action = JSON.parse(b || '{}').action || 'poweroff'; } catch {}
        console.log(`[LRD] Power action requested: ${action}`);
        try {
          const events = require('./os/termux/backends/events.js');
          events.emit('lifecycle', { action, at: Date.now() }, { immediate: true });
        } catch {}
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, action }));
      });
      return;
    }
  }

  // 1.05 /api/shell/dom-check probe for lrd-doctor regression testing
  if (pathname === '/api/shell/dom-check') {
    if (method === 'POST') {
      let b = '';
      req.on('data', (c) => (b += c));
      req.on('end', () => {
        try {
          const body = JSON.parse(b || '{}');
          if (typeof body.overlayRootIsBodyChild === 'boolean') {
            globalThis.__lrdOverlayOk = body.overlayRootIsBodyChild;
          }
          if (Array.isArray(body.failures)) {
            globalThis.__lrdDomFailures = body.failures;
          }
          if (typeof body.dockMarkerPresent === 'boolean') {
            globalThis.__lrdDockMarkerOk = body.dockMarkerPresent;
          }
          if (typeof body.noOverlap === 'boolean') {
            globalThis.__lrdNoOverlap = body.noOverlap;
          }
          if (typeof body.noClipping === 'boolean') {
            globalThis.__lrdNoClipping = body.noClipping;
          }
        } catch {}
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, overlayRootIsBodyChild: !!(globalThis.__lrdOverlayOk ?? true) }));
      });
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({
      overlayRootIsBodyChild: !!(globalThis.__lrdOverlayOk ?? true),
      dockMarkerPresent: !!(globalThis.__lrdDockMarkerOk ?? true),
      noOverlap: !!(globalThis.__lrdNoOverlap ?? true),
      noClipping: !!(globalThis.__lrdNoClipping ?? true),
      failures: globalThis.__lrdDomFailures || [],
      note: 'set by OverlayHost on mount',
    }));
  }

  // 1.1 /api/version
  if (pathname === '/api/version') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ ok: true, compat: true, api: API_VERSION, minShellApi: MIN_SHELL_API, backend: BACKEND, build: '2026.10' }));
  }

  // 1.2 Native apps catalog
  if (pathname === '/api/apps/native' && method === 'GET') {
    let appsList = [];
    try {
      const reg = '/var/lib/lrd/apps.json';
      if (fs.existsSync(reg)) {
        appsList = JSON.parse(fs.readFileSync(reg, 'utf8')).apps || [];
      }
    } catch {}
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, apps: appsList }));
  }

  // 1.3 WM event & control
  if (pathname === '/api/wm/event' && method === 'POST') {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => {
      try {
        const body = JSON.parse(b || '{}');
        try {
          const events = require('./os/termux/backends/events.js');
          events.emit('wm', body);
        } catch {}
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // 2. Manifest
  if (pathname === '/manifest.webmanifest') {
    const mPath = fs.existsSync(path.join(DIST_DIR, 'manifest.webmanifest'))
      ? path.join(DIST_DIR, 'manifest.webmanifest')
      : path.join(__dirname, 'os/termux/etc/manifest.webmanifest');
    return serveFile(res, mPath, 'application/manifest+json');
  }

  // 3. Vendored model files (disabled: zero-weight sovereign intent engine)
  if (pathname.startsWith('/models/')) {
    res.writeHead(404, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, error: 'Large neural models removed. LibreDroid OS operates on a zero-weight sovereign engine (0 MB weights).' }));
  }

  // 4. API Routes
  for (const r of routes) {
    if (r.method === method || r.method === 'ALL') {
      const match = pathname.match(r.regex);
      if (match) {
        const params = {};
        for (let i = 0; i < r.paramNames.length; i++) {
          params[r.paramNames[i]] = decodeURIComponent(match[i + 1]);
        }
        try {
          return await r.handler(req, res, parsedUrl.searchParams, params);
        } catch (err) {
          console.error(`[API Error] ${method} ${pathname}:`, err);
          if (!res.headersSent) {
            res.writeHead(500, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: String(err.message || err) }));
          }
          return;
        }
      }
    }
  }

  // 5. Static file serving from dist/
  if (method === 'GET' || method === 'HEAD') {
    const cleanPath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    let target = path.join(DIST_DIR, cleanPath);

    fs.stat(target, (err, stats) => {
      if (!err && stats.isFile()) {
        return serveFile(res, target);
      }
      // SPA Fallback: serve index.html for navigation requests
      const accepts = req.headers.accept || '';
      if (accepts.includes('text/html') || pathname === '/') {
        const indexPath = path.join(DIST_DIR, 'index.html');
        return serveFile(res, indexPath, 'text/html; charset=utf-8');
      }
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Not found' }));
    });
    return;
  }

  res.writeHead(405, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
});

const API_VERSION = 1;
const MIN_SHELL_API = 1;

/* ---------- graceful shutdown ---------- */
let shuttingDown = false;
function shutdown(sig) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[LRD] received ${sig} — draining`);
  server.close();
  try {
    const ex = require('./os/termux/backends/exec.js');
    for (const j of ex.jobs?.values?.() ?? []) {
      if (j.state === 'running' && !j.persistent) ex.kill(j, 'SIGTERM');
    }
  } catch {}
  setTimeout(() => process.exit(0), 1000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

server.listen(PORT, HOST, () => {
  console.log(`[LRD] LibreDroid Shell listening on http://${HOST}:${PORT} (backend=${BACKEND})`);
});
