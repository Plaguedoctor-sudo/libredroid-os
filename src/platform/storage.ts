import type { StorageVolume } from './types';
import { currentAdapter } from './index';
import { degrade } from './lifecycle';

let vols: StorageVolume[] = [];
const subs = new Set<(v: StorageVolume[]) => void>();
export const volumes = () => vols;
export const onVolumes = (f: (v: StorageVolume[]) => void) => { subs.add(f); return () => subs.delete(f); };

export async function refreshVolumes() {
  try { vols = await currentAdapter().volumes(); } catch { vols = []; }
  for (const f of subs) f(vols);
  return vols;
}

export function watchVolumes() {
  const t = setInterval(refreshVolumes, 30000);
  refreshVolumes();
  return () => clearInterval(t);
}

/** Reclaim space under pressure. Ordered cheapest-to-lose first. */
const RECLAIMERS: { id: string; run: () => Promise<number> }[] = [
  { id: 'icon-cache', run: async () => {
      const r = await fetch('/api/host/reclaim?what=icons', { method: 'POST' }); return r.ok ? 1 : 0; } },
  { id: 'thumb-cache', run: async () => {
      const r = await fetch('/api/host/reclaim?what=thumbs', { method: 'POST' }); return r.ok ? 1 : 0; } },
  { id: 'dispos-tmp', run: async () => {
      const r = await fetch('/api/host/reclaim?what=dispos', { method: 'POST' }); return r.ok ? 1 : 0; } },
  { id: 'logs', run: async () => {
      const r = await fetch('/api/host/reclaim?what=logs', { method: 'POST' }); return r.ok ? 1 : 0; } },
];

export async function reclaim(minFreeBytes = 512 * 1024 * 1024) {
  await refreshVolumes();
  const home = vols.find((v) => !v.removable) ?? vols[0];
  if (!home || home.free > minFreeBytes) return { reclaimed: [], free: home?.free ?? 0 };
  const reclaimed: string[] = [];
  for (const r of RECLAIMERS) {
    try { await r.run(); reclaimed.push(r.id); } catch {}
    await refreshVolumes();
    if ((vols[0]?.free ?? 0) > minFreeBytes) break;
  }
  return { reclaimed, free: vols[0]?.free ?? 0 };
}

export function watchPressure() {
  const on = async () => {
    const est = await navigator.storage?.estimate?.().catch(() => null);
    if (est?.quota && est.usage && est.usage / est.quota > 0.9) {
      degrade('storage-pressure');
      await reclaim();
    }
  };
  const t = setInterval(on, 120000);
  return () => clearInterval(t);
}

export function removablePresent() { return vols.some((v) => v.removable && v.writable); }
