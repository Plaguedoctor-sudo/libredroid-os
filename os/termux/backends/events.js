'use strict';
/* SSE event hub. Topics, coalescing, diff suppression, heartbeat, script push.
   Zero deps. Loopback only. */
const crypto = require('crypto');

const HEARTBEAT_MS = 15000;
const COALESCE_MS = 1000;
const MAX_BUFFER = 256 * 1024;

const clients = new Set();          // { id, res, topics:Set, alive, buffered }
const lastFrame = new Map();        // topic -> { hash, at }
const pending = new Map();          // topic -> { data, timer }
const stats = { emitted: 0, suppressed: 0, clients: 0 };

const hash = (v) => crypto.createHash('sha1').update(JSON.stringify(v) ?? 'null').digest('hex').slice(0, 12);

function write(c, chunk) {
  if (!c.alive) return;
  try {
    const ok = c.res.write(chunk);
    if (!ok) c.backpressure = true;
  } catch { c.alive = false; }
}

function frame(topic, data, id) {
  return `id: ${id}\nevent: ${topic}\ndata: ${JSON.stringify({ topic, at: Date.now(), data })}\n\n`;
}

/** Emit now, bypassing coalescing. */
function emitNow(topic, data) {
  const h = hash(data);
  const prev = lastFrame.get(topic);
  if (prev && prev.hash === h) { stats.suppressed++; return false; }
  lastFrame.set(topic, { hash: h, at: Date.now() });
  const id = `${Date.now()}-${stats.emitted++}`;
  const f = frame(topic, data, id);
  for (const c of clients) if (c.topics.has(topic) || c.topics.has('*')) write(c, f);
  return true;
}

/**
 * Emit with per-topic coalescing: at most one frame per COALESCE_MS, trailing.
 * A 20Hz battery sampler becomes 1Hz on the wire without losing the final value.
 */
function emit(topic, data, { immediate = false } = {}) {
  if (immediate) { const p = pending.get(topic); if (p) { clearTimeout(p.timer); pending.delete(topic); } return emitNow(topic, data); }
  const prev = lastFrame.get(topic);
  const now = Date.now();
  if (!prev || now - prev.at >= COALESCE_MS) return emitNow(topic, data);
  const p = pending.get(topic);
  if (p) p.data = data;
  else pending.set(topic, { data, timer: setTimeout(() => { const q = pending.get(topic); pending.delete(topic); if (q) emitNow(topic, q.data); }, COALESCE_MS - (now - prev.at)) });
  return true;
}

function snapshot(topic) {
  try { return require('./watchers.js').sample(topic); } catch { return null; }
}

function addClient(req, res, topics) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  });
  res.write(': libredroid event stream\n\n');
  res.write(`retry: 3000\n\n`);

  const c = { id: crypto.randomUUID(), res, topics: new Set(topics.length ? topics : ['*']), alive: true };
  clients.add(c);
  stats.clients = clients.size;

  // hello: the current state of every requested topic, so a reconnect resyncs
  const hello = {};
  for (const t of c.topics) {
    if (t === '*') continue;
    const s = snapshot(t);
    if (s !== null) hello[t] = s;
  }
  write(c, `event: hello\ndata: ${JSON.stringify({ topics: [...c.topics], state: hello, stats })}\n\n`);
  emit('lifecycle', { kind: 'client', id: c.id, total: clients.size }, { immediate: true });

  const hb = setInterval(() => write(c, `event: ping\ndata: {"t":${Date.now()}}\n\n`), HEARTBEAT_MS);
  req.on('close', () => { clearInterval(hb); c.alive = false; clients.delete(c); stats.clients = clients.size; });
  req.on('error', () => { clearInterval(hb); c.alive = false; clients.delete(c); });
  return c;
}

/** Used by watchers and by /api/events/push. */
const topics = ['power', 'thermal', 'net', 'display', 'input', 'lifecycle', 'apps', 'storage', 'tor', 'exec'];

function routes() {
  const R = [];
  const add = (m, p, fn) => R.push({ method: m, path: p, fn });

  add('GET', '/api/events', (req, res, q) => {
    const want = (q && typeof q.get === 'function' ? q.get('topics') || '' : '').split(',').map((s) => s.trim()).filter((s) => topics.includes(s));
    addClient(req, res, want);
  });

  add('GET', '/api/events/stats', (req, res) => {
    const b = Buffer.from(JSON.stringify({ ...stats, topics, clients: clients.size }));
    res.writeHead(200, { 'content-type': 'application/json', 'content-length': b.length });
    res.end(b);
  });

  // scripts push here: lrd-emit power '{"percent":41}'
  add('POST', '/api/events/push', (req, res) => {
    const c = []; req.on('data', (d) => c.push(d));
    req.on('end', () => {
      let body = {};
      try { body = JSON.parse(Buffer.concat(c).toString() || '{}'); } catch {}
      const { topic, data, immediate } = body;
      const ok = topic && topics.includes(topic) ? emit(topic, data, { immediate: !!immediate }) : false;
      const b = Buffer.from(JSON.stringify({ ok, clients: clients.size }));
      res.writeHead(ok ? 200 : 400, { 'content-type': 'application/json', 'content-length': b.length });
      res.end(b);
    });
  });

  add('GET', '/api/events/replay', (req, res) => {
    // last known value per topic — lets a cold client seed without a probe
    const out = {};
    for (const t of topics) out[t] = snapshot(t);
    const b = Buffer.from(JSON.stringify(out));
    res.writeHead(200, { 'content-type': 'application/json', 'content-length': b.length, 'cache-control': 'no-store' });
    res.end(b);
  });

  return R;
}

module.exports = { emit, emitNow, routes, topics, stats, addClient };
