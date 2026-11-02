import type { NetState } from './types';
import { currentAdapter } from './index';
import { degrade, recover } from './lifecycle';
import { subscribeLive } from './live';

const FALLBACK: NetState = {
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  type: 'unknown', metered: false, ssid: null, operator: null,
  ip: null, gateway: null, proxy: null,
  tor: { running: false, exitIp: null, verified: false }, captive: false, queued: 0,
};

let state: NetState = FALLBACK;
const subs = new Set<(n: NetState) => void>();
export const net = () => state;
export const onNet = (f: (n: NetState) => void) => { subs.add(f); return () => subs.delete(f); };

function apply(n: NetState) {
  const was = state.online;
  state = { ...state, ...n };
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.net = state.online ? state.type : 'offline';
    if (state.tor.verified) document.documentElement.dataset.tor = '1'; else delete document.documentElement.dataset.tor;
  }
  if (!state.online) degrade('offline'); else recover('offline');
  if (state.metered && !state.online) { /* nothing */ }
  if (was !== state.online) {
    (window as any).__LRD_EVENT__?.(state.online ? 'net:up' : 'net:down', { type: state.type });
    if (state.online) flushQueue();
  }
  for (const f of subs) f(state);
}

export async function refreshNet() {
  try { apply(await currentAdapter().net() as NetState); } catch {}
  return state;
}

export function watchNet() {
  addEventListener('online', refreshNet);
  addEventListener('offline', refreshNet);
  const off = subscribeLive('net', refreshNet, { fastMs: 10000, slowMs: 120000 });
  return () => { removeEventListener('online', refreshNet); removeEventListener('offline', refreshNet); off(); };
}

/* ---------- offline queue: nothing is lost when the tunnel drops ---------- */
interface Job { id: string; url: string; init: RequestInit; tries: number; at: number }
const QKEY = 'lrd.net.queue';
let queue: Job[] = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(QKEY) ?? '[]') : [];
const saveQ = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(QKEY, JSON.stringify(queue));
  }
  apply({ ...state, queued: queue.length });
};

export async function request(url: string, init: RequestInit = {}, { queue: useQueue = true } = {}) {
  if (state.online) {
    try { return await fetch(url, init); } catch { /* fall through to queue */ }
  }
  if (!useQueue) throw new Error('offline');
  queue.push({ id: crypto.randomUUID(), url, init, tries: 0, at: Date.now() });
  saveQ();
  return new Response(JSON.stringify({ queued: true }), { status: 202, headers: { 'content-type': 'application/json' } });
}

export async function flushQueue() {
  if (!state.online || !queue.length) return;
  const keep: Job[] = [];
  for (const j of queue) {
    try { await fetch(j.url, j.init); }
    catch { j.tries++; if (j.tries < 8) keep.push(j); }
  }
  queue = keep; saveQ();
}

/* ---------- route everything through Tor when asked ---------- */
export async function setTorRoute(on: boolean) {
  try {
    const r = await fetch('/api/device/route', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tor: on }),
    });
    if (r.ok) await refreshNet();
    return r.ok;
  } catch { return false; }
}

export async function verifyTor() {
  try {
    const r = await fetch('/api/device/tor/verify', { method: 'POST' });
    const j = await r.json();
    apply({ ...state, tor: { running: true, exitIp: j.exitIp ?? null, verified: !!j.isTor } });
    return !!j.isTor;
  } catch { return false; }
}

export const isTor = () => state.tor.verified;
export const isMetered = () => state.metered;
