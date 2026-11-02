import { webAdapter } from './adapters/web';
import { androidAdapter } from './adapters/android';
import { linuxAdapter } from './adapters/linux';
import { detectHost } from './detect';
import { caps } from './caps';
import type { PlatformAdapter } from './types';

const SAFE = typeof location !== 'undefined' && (
  new URLSearchParams(location.search).get('safe') === '1'
  || localStorage.getItem('lrd.safe') === '1'
);

let adapter: PlatformAdapter = webAdapter;

export function currentAdapter() { return adapter; }
export const safeMode = () => SAFE;

export function selectAdapter(): PlatformAdapter {
  if (SAFE) return webAdapter;
  switch (detectHost()) {
    case 'android-native': return androidAdapter((window as any).__LRD_BRIDGE__ ?? '');
    case 'android-pwa':    return androidAdapter();
    case 'linux-kiosk':
    case 'linux-desktop':  return linuxAdapter();
    default:               return webAdapter;
  }
}

/** Run once, before React mounts. Fails soft into safe mode. */
export async function bootPlatform() {
  adapter = selectAdapter();
  try {
    const { caps: probed } = await adapter.probe();
    caps.replace(probed);
  } catch (e) {
    // the probe itself failed — that is exactly what safe mode is for
    localStorage.setItem('lrd.safe', '1');
    console.error('[platform] probe failed, entering safe mode', e);
    (window as any).__LRD_SAFE_REASON__ = String(e);
    adapter = webAdapter;
    const { caps: c } = await webAdapter.probe();
    caps.replace(c);
  }
  (window as any).__LRD_HOST__ = adapter.kind;
  return { adapter, verdict: caps.verdict(), score: caps.score() };
}

/** Re-run the probe. Used by remedies and the readiness panel. */
export async function reprobePlatform() {
  const a = selectAdapter();
  adapter = a;
  try {
    const { caps: probed } = await a.probe();
    caps.replace(probed);
  } catch { /* keep last known */ }
  return caps.report();
}
