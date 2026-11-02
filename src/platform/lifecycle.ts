import type { Lifecycle } from './types';
import { caps } from './caps';

const K = { boot: 'lrd.bootCount', crash: 'lrd.crashCount', safe: 'lrd.safe' };

let state: Lifecycle = {
  phase: 'boot', since: Date.now(),
  bootCount: +(typeof localStorage !== 'undefined' ? localStorage.getItem(K.boot) ?? '0' : '0') + 1,
  crashCount: +(typeof localStorage !== 'undefined' ? localStorage.getItem(K.crash) ?? '0' : '0'),
  degradedReasons: [],
};
if (typeof localStorage !== 'undefined') {
  localStorage.setItem(K.boot, String(state.bootCount));
}

const subs = new Set<(s: Lifecycle) => void>();
export const lifecycle = () => state;
export const onLifecycle = (f: (s: Lifecycle) => void) => { subs.add(f); return () => subs.delete(f); };

export function setPhase(phase: Lifecycle['phase'], reason?: string) {
  if (state.phase === phase) return;
  state = { ...state, phase, since: Date.now(), safeReason: reason ?? state.safeReason };
  for (const f of subs) f(state);
}

/** Called by every subsystem that finds itself short of a capability. */
export function degrade(reason: string) {
  if (state.degradedReasons.includes(reason)) return;
  state = { ...state, degradedReasons: [...state.degradedReasons, reason] };
  if (state.phase === 'running') setPhase('degraded');
  for (const f of subs) f(state);
}

export function recover(reason: string) {
  const next = state.degradedReasons.filter((r) => r !== reason);
  state = { ...state, degradedReasons: next };
  if (next.length === 0 && state.phase === 'degraded') setPhase('running');
  for (const f of subs) f(state);
}

export function enterSafe(reason: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(K.safe, '1');
  }
  setPhase('safe', reason);
}

export function leaveSafe() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(K.safe);
    localStorage.removeItem(K.crash);
  }
  if (typeof location !== 'undefined') {
    location.href = location.pathname + '?boot=' + Date.now();
  }
}

/** The boot gate. Decides whether this is a first run, a normal run, or safe. */
export function bootGate() {
  const first = typeof localStorage !== 'undefined' && !localStorage.getItem('lrd.installed');
  const forced = typeof location !== 'undefined' && new URLSearchParams(location.search).get('safe') === '1';
  const sticky = typeof localStorage !== 'undefined' && localStorage.getItem(K.safe) === '1';

  // three crashes in a row -> safe mode, automatically
  if (state.crashCount >= 3) {
    enterSafe(`${state.crashCount} consecutive startup failures`);
    return 'safe' as const;
  }
  if (forced || sticky) { setPhase('safe', 'user requested'); return 'safe' as const; }
  if (first) { setPhase('firstrun'); return 'firstrun' as const; }

  setPhase('running');
  const b = caps.blockers();
  if (b.length) for (const x of b) degrade(x.id);
  return 'running' as const;
}

export function markHealthy() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(K.crash, '0');
    localStorage.setItem('lrd.installed', '1');
  }
}

export function markCrash() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(K.crash, String(state.crashCount + 1));
  }
}

/** shutdown / reboot / suspend, tier-honest */
export async function shutdown(kind: 'poweroff' | 'reboot' | 'reboot-recovery' | 'suspend') {
  setPhase('shutdown');
  try {
    await fetch('/api/device/power', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: kind }),
    });
  } catch {
    // browser fallback: nothing to do but close
  }
}
