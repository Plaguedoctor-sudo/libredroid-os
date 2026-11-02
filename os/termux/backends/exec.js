'use strict';
/* Command runner. PTY by default for interactive output, pipes for scripts.
   Streams over the SSE hub on topic `exec`, batched at ~25fps, offset-addressed
   so a late or reconnecting client can replay from an exact byte offset. */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const MAX_JOBS = 8;
const MAX_BUF = 512 * 1024;      // per-job ring
const FLUSH_MS = 40;             // 25fps batching
const DEFAULT_TIMEOUT = 180_000;
const MAX_TIMEOUT = 3_600_000;

const jobs = new Map();
const queue = [];
let seq = 0;

const HOME = os.homedir();
const PREFIX = process.env.PREFIX || path.join(HOME, '..', 'usr');
const SAFE_PATH = [path.join(PREFIX, 'bin'), '/system/bin', '/system/xbin', '/product/bin', '/vendor/bin', '/sbin', '/bin', '/usr/bin'].join(':');

/* ---------- ring buffer, offset addressed ---------- */
class Ring {
  constructor(max = MAX_BUF) { this.max = max; this.parts = []; this.len = 0; this.base = 0; }
  push(buf) {
    if (!buf?.length) return;
    this.parts.push(buf); this.len += buf.length;
    while (this.len > this.max && this.parts.length > 1) {
      const f = this.parts.shift(); this.len -= f.length; this.base += f.length;
    }
    if (this.len > this.max && this.parts.length === 1) {
      const f = this.parts[0]; const drop = this.len - this.max;
      this.parts[0] = f.subarray(drop); this.len -= drop; this.base += drop;
    }
  }
  since(off) {
    if (off < this.base) off = this.base;
    const out = []; let pos = this.base;
    for (const p of this.parts) {
      const end = pos + p.length;
      if (end > off) out.push(p.subarray(Math.max(0, off - pos)));
      pos = end;
    }
    return { buf: Buffer.concat(out), from: Math.max(off, this.base) };
  }
  get end() { return this.base + this.len; }
  text() { return Buffer.concat(this.parts).toString('utf8'); }
}

/* ---------- pty detection ---------- */
let PTY_CMD = null; // null = unchecked, false = unavailable
function ptyAvailable() {
  if (PTY_CMD !== null) return PTY_CMD;
  try {
    const r = spawnSync('script', ['--version'], { encoding: 'utf8', timeout: 4000 });
    PTY_CMD = r.status === 0 ? 'script' : false;
  } catch { PTY_CMD = false; }
  return PTY_CMD;
}
function ptyArgs(cmd) {
  // -q quiet, -e propagate exit status, -f flush, -c command, /dev/null = no typescript
  return ['-qefc', cmd, '/dev/null'];
}

/* ---------- job ---------- */
function makeJob(opts) {
  const id = crypto.randomUUID().slice(0, 8);
  return {
    id, cmd: opts.cmd, pty: !!opts.pty && !!ptyAvailable(),
    cwd: opts.cwd || HOME, env: opts.env || {},
    startedAt: Date.now(), endedAt: null, state: 'queued',
    code: null, signal: null, pid: null,
    out: new Ring(), pending: [], pendingFrom: null, flushTimer: null,
    child: null, killer: null, root: !!opts.root,
  };
}

function emitFrame(job, extra = {}) {
  let hub; try { hub = require('./events.js'); } catch { return; }
  hub.emit('exec', {
    jobId: job.id, cmd: job.cmd, state: job.state,
    offset: job.out.end, ...extra,
  }, { immediate: true });
}

function flush(job) {
  job.flushTimer = null;
  if (!job.pending.length) return;
  const from = job.pendingFrom;
  const buf = Buffer.concat(job.pending);
  job.pending = []; job.pendingFrom = null;
  emitFrame(job, { type: 'data', from, to: from + buf.length, b64: buf.toString('base64') });
}

function push(job, buf) {
  if (!buf.length) return;
  if (job.pendingFrom === null) job.pendingFrom = job.out.end;
  job.out.push(buf);
  job.pending.push(buf);
  if (!job.flushTimer) job.flushTimer = setTimeout(() => flush(job), FLUSH_MS);
}

/* ---------- spawn ---------- */
function launch(job) {
  job.state = 'running';
  const env = {
    ...process.env, ...job.env,
    PATH: env_path(),
    TERM: job.pty ? 'xterm-256color' : 'dumb',
    COLORTERM: job.pty ? 'truecolor' : '',
    LRD: '1', LRD_JOB: job.id,
    HOME: HOME,
  };
  if (job.root) env.PREFIX = PREFIX;

  let child;
  try {
    if (job.pty && ptyAvailable()) {
      child = spawn('script', ptyArgs(job.cmd), { cwd: job.cwd, env, detached: true });
    } else {
      child = spawn('sh', ['-c', job.cmd], { cwd: job.cwd, env, detached: true });
    }
  } catch (e) {
    job.state = 'error';
    emitFrame(job, { type: 'error', message: String(e.message || e) });
    finish(job, 127, null);
    return;
  }

  job.child = child;
  job.pid = child.pid;

  const onData = (b) => push(job, b);
  child.stdout?.on('data', onData);
  child.stderr?.on('data', onData);

  child.on('error', (e) => { emitFrame(job, { type: 'error', message: String(e.message || e) }); });

  child.on('close', (code, signal) => {
    clearTimeout(job.killer);
    job.endedAt = Date.now();
    finish(job, code === null ? 143 : code, signal);
  });

  emitFrame(job, { type: 'start', pid: child.pid, pty: job.pty, cwd: job.cwd });

  const t = job.timeoutMs ?? DEFAULT_TIMEOUT;
  if (t > 0) {
    job.killer = setTimeout(() => {
      emitFrame(job, { type: 'error', message: `timeout after ${t}ms` });
      kill(job, 'SIGTERM');
      setTimeout(() => kill(job, 'SIGKILL'), 3000);
    }, Math.min(t, MAX_TIMEOUT));
  }
}

function env_path() {
  const extra = (process.env.PATH || '').split(':').filter(Boolean);
  const seen = new Set(SAFE_PATH.split(':'));
  return [...SAFE_PATH.split(':'), ...extra.filter((p) => !seen.has(p))].join(':');
}

function finish(job, code, signal) {
  job.code = code; job.signal = signal ?? null;
  job.state = code === 0 ? 'done' : 'failed';
  if (job.flushTimer) { clearTimeout(job.flushTimer); job.flushTimer = null; }
  flush(job);
  emitFrame(job, { type: 'exit', code: job.code, signal: job.signal, ms: (job.endedAt ?? Date.now()) - job.startedAt });
  job.child = null;
  const next = queue.shift();
  if (next) launch(next);
  setTimeout(() => { if (jobs.get(job.id) === job) jobs.delete(job.id); }, 10 * 60 * 1000).unref?.();
}

function kill(job, sig = 'SIGTERM') {
  if (!job.child?.pid) return false;
  try { process.kill(-job.child.pid, sig); return true; }
  catch { try { job.child.kill(sig); return true; } catch { return false; } }
}

/* ---------- public API ---------- */
function run(opts) {
  const job = makeJob(opts);
  jobs.set(job.id, job);
  if (jobs.size > MAX_JOBS || [...jobs.values()].filter((j) => j.state === 'running').length >= MAX_JOBS) {
    job.state = 'queued';
    queue.push(job);
    emitFrame(job, { type: 'queued', position: queue.length });
  } else {
    launch(job);
  }
  return job;
}

function list() {
  return [...jobs.values()].map((j) => ({
    id: j.id, cmd: j.cmd, state: j.state, pid: j.pid, pty: j.pty,
    startedAt: j.startedAt, endedAt: j.endedAt, code: j.code, bytes: j.out.end,
  }));
}

function sample() { return { running: list().filter((j) => j.state === 'running').length, jobs: list().slice(0, 20) }; }

/* ---------- routes ---------- */
function routes() {
  const R = [];
  const add = (m, p, fn) => R.push({ method: m, path: p, fn });
  const J = (res, o, c = 200) => { const b = Buffer.from(JSON.stringify(o)); res.writeHead(c, { 'content-type': 'application/json', 'content-length': b.length, 'cache-control': 'no-store' }); res.end(b); };
  const body = (req) => new Promise((ok) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => { try { ok(JSON.parse(Buffer.concat(c).toString() || '{}')); } catch { ok({}); } }); });

  add('POST', '/api/host/exec', async (req, res, q) => {
    const b = await body(req);
    let cmd = b.cmd || (Array.isArray(b.argv) ? b.argv.map(shq).join(' ') : null);
    if (!cmd) return J(res, { ok: false, error: 'cmd or argv required' }, 400);
    const scope = b.scope || 'read';
    const isApp = !!req.headers['x-lrd-app-id'];
    if (b.root || scope === 'root') {
      if (isApp) return J(res, { ok: false, error: 'permission denied: app cannot request root scope' }, 403);
      if (process.getuid && process.getuid() === 0) {
        // already root
      } else if (fs.existsSync('/system/bin/su') || fs.existsSync('/sbin/su')) {
        cmd = `su -c ${shq(cmd)}`;
      } else {
        // Non-root host environment without su: do not hang on interactive su password
        cmd = `sudo -n ${cmd} 2>/dev/null || ${cmd}`;
      }
    }
    if (b.cwd && !fs.existsSync(b.cwd)) return J(res, { ok: false, error: 'no such cwd' }, 400);

    const job = run({
      cmd, pty: b.pty !== false, cwd: b.cwd, env: b.env,
      timeoutMs: b.timeoutMs, root: (b.root || scope === 'root') && !isApp,
    });
    J(res, { ok: true, id: job.id, pid: job.pid, pty: job.pty, state: job.state, cmd: job.cmd, scope });
  });

  add('GET', '/api/host/exec', (req, res) => J(res, { ok: true, ...sample() }));

  add('GET', '/api/host/exec/:id', (req, res, q, params) => {
    const job = jobs.get(params.id);
    if (!job) return J(res, { ok: false, error: 'no such job' }, 404);
    J(res, {
      ok: true, id: job.id, cmd: job.cmd, state: job.state, code: job.code,
      signal: job.signal, pid: job.pid, pty: job.pty,
      startedAt: job.startedAt, endedAt: job.endedAt, bytes: job.out.end,
    });
  });

  add('GET', '/api/host/exec/:id/log', (req, res, q, params) => {
    const job = jobs.get(params.id);
    if (!job) return J(res, { ok: false, error: 'no such job' }, 404);
    const since = parseInt((q && typeof q.get === 'function' ? q.get('since') : '0') || '0', 10) || 0;
    const { buf, from } = job.out.since(since);
    J(res, {
      ok: true, id: job.id, from, to: from + buf.length, b64: buf.toString('base64'),
      state: job.state, code: job.code, truncated: since < job.out.base,
    });
  });

  add('POST', '/api/host/exec/:id/kill', async (req, res, q, params) => {
    const job = jobs.get(params.id);
    if (!job) return J(res, { ok: false, error: 'no such job' }, 404);
    const { signal = 'SIGTERM' } = await body(req);
    J(res, { ok: kill(job, signal) });
  });

  add('POST', '/api/host/exec/:id/input', async (req, res, q, params) => {
    const job = jobs.get(params.id);
    if (!job?.child?.stdin) return J(res, { ok: false, error: 'no stdin' }, 400);
    const { text, b64 } = await body(req);
    const buf = b64 ? Buffer.from(b64, 'base64') : Buffer.from(text ?? '', 'utf8');
    try { job.child.stdin.write(buf); return J(res, { ok: true, bytes: buf.length }); }
    catch (e) { return J(res, { ok: false, error: String(e.message) }, 500); }
  });

  add('POST', '/api/host/exec/kill-all', (req, res) => {
    let n = 0;
    for (const j of jobs.values()) if (j.state === 'running' && kill(j)) n++;
    J(res, { ok: true, killed: n });
  });

  // blocking convenience: run and wait, for scripts and simple callers
  add('POST', '/api/host/exec/sync', async (req, res) => {
    const b = await body(req);
    const cmd = b.cmd;
    if (!cmd) return J(res, { ok: false, error: 'cmd required' }, 400);
    const job = run({ cmd, pty: !!b.pty, cwd: b.cwd, env: b.env, timeoutMs: b.timeoutMs ?? 60_000 });
    const deadline = Date.now() + (b.timeoutMs ?? 60_000) + 5000;
    const wait = () => new Promise((ok) => {
      const poll = () => {
        if (job.state === 'done' || job.state === 'failed' || job.state === 'error') return ok();
        if (Date.now() > deadline) { kill(job, 'SIGKILL'); return ok(); }
        setTimeout(poll, 50);
      };
      poll();
    });
    await wait();
    J(res, { ok: job.code === 0, code: job.code, output: job.out.text(), truncated: job.out.base > 0 });
  });

  return R;
}

const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

module.exports = { run, list, sample, kill, routes, shq, jobs };
