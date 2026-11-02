import type { DisplayState } from './types';
import { currentAdapter } from './index';
import { caps } from './caps';
import { subscribeLive } from './live';

const FALLBACK: DisplayState = {
  brightness: 1, maxBrightness: 1, autoBrightness: null,
  refreshHz: null, external: [], docked: false, screenOn: true,
};

let state: DisplayState = FALLBACK;
const subs = new Set<(d: DisplayState) => void>();
export const display = () => state;
export const onDisplay = (f: (d: DisplayState) => void) => { subs.add(f); return () => subs.delete(f); };

function apply(d: DisplayState) {
  const wasDocked = state.docked;
  state = { ...state, ...d };
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.docked = state.docked ? '1' : '0';
    document.documentElement.dataset.hdr = state.external.length ? '1' : '0';
  }
  if (state.docked !== wasDocked) (window as any).__LRD_EVENT__?.(state.docked ? 'dock' : 'undock', {});
  for (const f of subs) f(state);
}

export async function refreshDisplay() {
  try { apply(await currentAdapter().display() as DisplayState); } catch {}
  return state;
}

export function watchDisplay() {
  return subscribeLive('display', refreshDisplay, { fastMs: 12000, slowMs: 0 });
}

export async function setBrightness(v: number) {
  const a = currentAdapter();
  const ok = await a.setBrightness?.(Math.max(0.02, Math.min(1, v)));
  if (ok) apply({ ...state, brightness: v, autoBrightness: false });
  return !!ok;
}

export async function setAutoBrightness(on: boolean) {
  try {
    const r = await fetch('/api/device/auto-brightness', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ on }),
    });
    if (r.ok) apply({ ...state, autoBrightness: on });
    return r.ok;
  } catch { return false; }
}

/** Wake lock with reference counting — several subsystems want the screen on. */
const holders = new Set<string>();
export async function holdWake(id: string, on: boolean) {
  if (on) holders.add(id); else holders.delete(id);
  const want = holders.size > 0;
  const ok = await currentAdapter().wakeLock?.(want);
  if (!ok && want) caps.get('display.wakeLock');
  return !!ok;
}

export async function setScreen(on: boolean) {
  const ok = await currentAdapter().screenOn?.(on);
  if (ok) apply({ ...state, screenOn: on });
  return !!ok;
}

export const desktopMode = () => state.docked && state.external.length > 0;
