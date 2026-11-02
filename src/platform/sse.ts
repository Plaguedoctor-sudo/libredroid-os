type Handler = (topic: string, data: unknown) => void;

const TOPIC_SET = ['power', 'thermal', 'net', 'display', 'input', 'lifecycle', 'apps', 'storage', 'tor', 'exec'];

interface StreamState {
  ok: boolean;
  failures: number;
  lastEvent: number;
  reconnects: number;
}

let es: EventSource | null = null;
let state: StreamState = { ok: false, failures: 0, lastEvent: 0, reconnects: 0 };
let backoff = 1000;
let timer: number | null = null;
const handlers = new Set<Handler>();
const stateSubs = new Set<(s: StreamState) => void>();

export const streamState = () => ({ ...state });
export const onStreamState = (f: (s: StreamState) => void) => { stateSubs.add(f); return () => stateSubs.delete(f); };

const setState = (p: Partial<StreamState>) => {
  state = { ...state, ...p };
  for (const f of stateSubs) f(state);
};

function connect() {
  if (es) { try { es.close(); } catch {} es = null; }
  const url = `/api/events?topics=${TOPIC_SET.join(',')}`;
  try { es = new EventSource(url); } catch { scheduleRetry(); return; }

  es.onopen = () => { backoff = 1000; setState({ ok: true, failures: 0 }); };

  for (const t of TOPIC_SET) {
    es.addEventListener(t, (e) => {
      setState({ lastEvent: Date.now() });
      try {
        const payload = JSON.parse((e as MessageEvent).data);
        const data = payload?.data ?? payload;
        for (const h of handlers) { try { h(t, data); } catch {} }
      } catch {}
    });
  }

  // a server-side heartbeat proves liveness even when nothing changes
  es.addEventListener('ping', () => setState({ lastEvent: Date.now() }));

  es.onerror = () => {
    setState({ ok: false, failures: state.failures + 1 });
    scheduleRetry();
  };
}

function scheduleRetry() {
  if (timer !== null) return;
  const jitter = Math.random() * 400;
  timer = window.setTimeout(() => {
    timer = null;
    setState({ reconnects: state.reconnects + 1 });
    connect();
  }, backoff + jitter);
  backoff = Math.min(backoff * 1.8, 30000);
}

/** Liveness watchdog: a stream that opens but never speaks is dead. */
export function watchStream() {
  const t = setInterval(() => {
    if (!state.ok) return;
    if (Date.now() - state.lastEvent > 45000) {
      setState({ ok: false, failures: state.failures + 1 });
      connect();
    }
  }, 15000);
  return () => clearInterval(t);
}

export function onEvent(h: Handler) {
  handlers.add(h);
  if (!es) connect();
  return () => handlers.delete(h);
}

export function startStream() {
  if (!es) connect();
  const onVis = () => { if (document.visibilityState === 'visible' && !state.ok) connect(); };
  document.addEventListener('visibilitychange', onVis);
  return () => {
    document.removeEventListener('visibilitychange', onVis);
    if (es) es.close();
    es = null;
    if (timer !== null) clearTimeout(timer);
  };
}

export const streamHealthy = () => state.ok;
