import type { PowerState } from './types';
import { currentAdapter } from './index';
import { degrade, recover } from './lifecycle';
import { subscribeLive } from './live';

const FALLBACK: PowerState = {
  present: false, percent: 100, charging: false, ac: false, usb: false,
  currentMa: null, voltageMv: null, tempC: null, health: null, cycles: null,
  thermal: 0, throttling: false, hottestZone: null, mode: 'balanced',
};

let state: PowerState = FALLBACK;
const subs = new Set<(p: PowerState) => void>();
export const power = () => state;
export const onPower = (f: (p: PowerState) => void) => { subs.add(f); return () => subs.delete(f); };

/** Consumers register what they cost, and the governor cuts them when hot. */
interface Consumer { id: string; weight: number; pause: (on: boolean) => void; minMode?: PowerState['mode'][] }
const consumers = new Map<string, Consumer>();
export function registerConsumer(c: Consumer) { consumers.set(c.id, c); return () => consumers.delete(c.id); }

function derive(p: PowerState): PowerState['mode'] {
  if (p.charging) return 'charging';
  if (p.percent <= 5) return 'critical';
  if (p.percent <= 20 || p.thermal > 0.8) return 'saver';
  if (p.thermal > 0.6) return 'balanced';
  return 'performance';
}

function apply(p: PowerState) {
  const mode = derive(p);
  const changed = mode !== state.mode;
  state = { ...p, mode };
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.power = mode;
    document.documentElement.dataset.thermal = p.throttling ? 'throttle' : 'ok';
  }

  for (const c of consumers.values()) {
    const allowed = !c.minMode || c.minMode.includes(mode);
    try { c.pause(!allowed); } catch {}
  }

  if (p.throttling) degrade('thermal-throttle'); else recover('thermal-throttle');
  if (p.percent <= 5 && !p.charging) degrade('battery-critical'); else recover('battery-critical');

  if (changed) (window as any).__LRD_EVENT__?.('power:mode', { from: state.mode, to: mode });
  for (const f of subs) f(state);
}

export async function refreshPower() {
  try {
    const p = await currentAdapter().power();
    apply({ ...FALLBACK, ...state, ...p });
  } catch { /* keep last known */ }
  return state;
}

export function watchPower() {
  return subscribeLive('power', refreshPower, { fastMs: 15000, slowMs: 60000 });
}

// thermal is its own topic so a hot device updates fast even when the stream is slow
export function watchThermal(onHot: (z: { name: string; c: number }[]) => void) {
  return subscribeLive('thermal', async () => {
    const z = await currentAdapter().thermalZones?.().catch(() => []);
    if (z?.length) onHot(z);
  }, { fastMs: 5000, slowMs: 20000 });
}

export async function setGovernor(mode: 'performance' | 'balanced' | 'saver') {
  try {
    await fetch('/api/device/governor', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode }),
    });
    return true;
  } catch { return false; }
}
