import { onEvent, streamHealthy } from './sse';

export interface ExecHandle {
  id: string;
  cmd: string;
  pid: number | null;
  pty: boolean;
  onData: (fn: (chunk: Uint8Array) => void) => () => void;
  onExit: (fn: (code: number, signal: string | null) => void) => () => void;
  onState: (fn: (state: string) => void) => () => void;
  write: (text: string) => Promise<boolean>;
  kill: (signal?: string) => Promise<boolean>;
  status: () => Promise<{ state: string; code: number | null }>;
  done: Promise<{ code: number; signal: string | null; ms: number }>;
}

export interface RunOpts {
  pty?: boolean;
  root?: boolean;
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  onData?: (chunk: Uint8Array) => void;
}

const dec = () => new TextDecoder('utf-8');

export async function run(cmd: string, opts: RunOpts = {}): Promise<ExecHandle> {
  const r = await fetch('/api/host/exec', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      cmd, pty: opts.pty !== false, root: opts.root, cwd: opts.cwd,
      env: opts.env, timeoutMs: opts.timeoutMs,
    }),
  });
  if (!r.ok) throw new Error(`exec failed: ${r.status}`);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error ?? 'exec refused');

  const dataFns = new Set<(c: Uint8Array) => void>();
  const exitFns = new Set<(c: number, s: string | null) => void>();
  const stateFns = new Set<(s: string) => void>();
  let nextOffset = 0;
  let settled = false;
  let resolveDone!: (v: { code: number; signal: string | null; ms: number }) => void;
  const done = new Promise<{ code: number; signal: string | null; ms: number }>((ok) => { resolveDone = ok; });

  const deliver = (bytes: Uint8Array) => { for (const f of dataFns) { try { f(bytes); } catch {} } opts.onData?.(bytes); };

  // offset-addressed replay: closes any gap after a reconnect or a dropped frame
  let replaying = false;
  const catchUp = async () => {
    if (replaying || settled) return;
    replaying = true;
    try {
      const r2 = await fetch(`/api/host/exec/${j.id}/log?since=${nextOffset}`);
      const l = await r2.json();
      if (l.ok && l.to > nextOffset) {
        const bytes = Uint8Array.from(atob(l.b64), (c) => c.charCodeAt(0));
        nextOffset = l.to;
        deliver(bytes);
      }
      if (l.state === 'done' || l.state === 'failed' || l.state === 'error') await pollStatus();
    } catch { /* retry on next tick */ }
    replaying = false;
  };

  const pollStatus = async () => {
    if (settled) return;
    try {
      const r2 = await fetch(`/api/host/exec/${j.id}`);
      const s = await r2.json();
      if (!s.ok) return;
      for (const f of stateFns) f(s.state);
      if (['done', 'failed', 'error'].includes(s.state)) {
        await catchUp();
        settle(s.code ?? (s.state === 'done' ? 0 : 1), s.signal ?? null, (s.endedAt ?? Date.now()) - (s.startedAt ?? Date.now()));
      }
    } catch {}
  };

  const settle = (code: number, signal: string | null, ms: number) => {
    if (settled) return;
    settled = true;
    clearInterval(poll);
    offEvent();
    for (const f of exitFns) { try { f(code, signal); } catch {} }
    resolveDone({ code, signal, ms });
  };

  const offEvent = onEvent((topic, data: any) => {
    if (topic !== 'exec' || data?.jobId !== j.id) return;
    if (data.type === 'start') for (const f of stateFns) f('running');
    else if (data.type === 'data') {
      if (data.from > nextOffset) void catchUp();
      else {
        const bytes = Uint8Array.from(atob(data.b64), (c) => c.charCodeAt(0));
        nextOffset = data.to;
        deliver(bytes);
      }
    } else if (data.type === 'exit') settle(data.code ?? 0, data.signal ?? null, data.ms ?? 0);
    else if (data.type === 'error') for (const f of stateFns) f('error');
  });

  // safety net: 1s status poll while the stream is unhealthy, 5s otherwise
  let poll = window.setInterval(pollStatus, streamHealthy() ? 5000 : 1000);
  if (streamHealthy()) void catchUp();

  return {
    id: j.id, cmd: j.cmd, pid: j.pid ?? null, pty: !!j.pty,
    onData: (fn) => { dataFns.add(fn); return () => dataFns.delete(fn); },
    onExit: (fn) => { exitFns.add(fn); return () => exitFns.delete(fn); },
    onState: (fn) => { stateFns.add(fn); return () => stateFns.delete(fn); },
    write: async (text) => {
      const r2 = await fetch(`/api/host/exec/${j.id}/input`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }),
      }).catch(() => null);
      return !!r2?.ok;
    },
    kill: async (signal = 'SIGTERM') => {
      const r2 = await fetch(`/api/host/exec/${j.id}/kill`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ signal }),
      }).catch(() => null);
      return !!r2?.ok;
    },
    status: async () => {
      const r2 = await fetch(`/api/host/exec/${j.id}`).then((x) => x.json()).catch(() => null);
      return { state: r2?.state ?? 'unknown', code: r2?.code ?? null };
    },
    done,
  };
}

/** Run and collect. Used by remedies and the wizard. */
export async function runAndWait(cmd: string, opts: RunOpts & { maxBytes?: number } = {}) {
  const h = await run(cmd, { ...opts, pty: opts.pty ?? false });
  const chunks: Uint8Array[] = [];
  let n = 0;
  const max = opts.maxBytes ?? 256 * 1024;
  h.onData((c) => { if (n < max) { chunks.push(c); n += c.length; } });
  const { code, ms } = await h.done;
  const all = new Uint8Array(n);
  let o = 0;
  for (const c of chunks) { all.set(c.subarray(0, Math.min(c.length, n - o)), o); o += c.length; if (o >= n) break; }
  return { code, ms, output: dec().decode(all), truncated: n >= max };
}

export const available = async () => {
  try { const r = await fetch('/api/host/exec'); return r.ok; } catch { return false; }
};

export async function list() {
  const r = await fetch('/api/host/exec').then((x) => x.json()).catch(() => null);
  return r?.jobs ?? [];
}

export async function killAll() {
  await fetch('/api/host/exec/kill-all', { method: 'POST' }).catch(() => {});
}
