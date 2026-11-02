import type { DeviceProfile } from './types';
import { currentAdapter } from './index';
import { readInsets, detectNotch } from './detect';

export const FALLBACK: DeviceProfile = {
  model: 'Unknown', manufacturer: '', product: '', device: '', sdk: 0, abis: [], kernel: '',
  hostname: typeof location !== 'undefined' ? location.host : 'localhost',
  unlocked: null, slot: null, verifiedBoot: null, verity: null,
  dynamicPartitions: false,
  cssWidth: typeof innerWidth !== 'undefined' ? innerWidth : 390,
  cssHeight: typeof innerHeight !== 'undefined' ? innerHeight : 844,
  physicalWidth: typeof innerWidth !== 'undefined' ? Math.round(innerWidth * (devicePixelRatio || 1)) : 390,
  physicalHeight: typeof innerHeight !== 'undefined' ? Math.round(innerHeight * (devicePixelRatio || 1)) : 844,
  dpr: typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1,
  diagonalInches: null, refreshHz: null, hdr: false,
  insets: { top: 0, right: 0, bottom: 0, left: 0 }, notch: false, posture: 'unknown',
  locale: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  reducedMotion: typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  darkMode: typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)').matches : false,
  touch: typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches ? 'coarse' : 'none',
  pointer: typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches ? 'fine' : 'coarse',
};

let profile: DeviceProfile = FALLBACK;
const subs = new Set<(p: DeviceProfile) => void>();
export const device = () => profile;
export const onDevice = (f: (p: DeviceProfile) => void) => { subs.add(f); return () => subs.delete(f); };

/** Live metrics that change without a bridge round-trip. */
function live(): Partial<DeviceProfile> {
  return {
    cssWidth: innerWidth, cssHeight: innerHeight,
    physicalWidth: Math.round(innerWidth * devicePixelRatio),
    physicalHeight: Math.round(innerHeight * devicePixelRatio),
    dpr: devicePixelRatio,
    insets: readInsets(), notch: detectNotch(),
    posture: (navigator as any).devicePosture?.type ?? profile.posture,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    darkMode: matchMedia('(prefers-color-scheme: dark)').matches,
    touch: matchMedia('(pointer: coarse)').matches ? 'coarse' : 'none',
    pointer: matchMedia('(pointer: fine)').matches ? 'fine' : 'coarse',
  };
}

export function publish(p: Partial<DeviceProfile>) {
  profile = { ...profile, ...live(), ...p };
  // density class drives the Tailwind/theme scale tokens
  const diag = Math.hypot(profile.cssWidth, profile.cssHeight);
  const cls = diag < 600 ? 'lrd-compact' : diag < 1000 ? 'lrd-medium' : 'lrd-expanded';
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('lrd-compact', 'lrd-medium', 'lrd-expanded');
    document.documentElement.classList.add(cls);
    document.documentElement.style.setProperty('--lrd-dpr', String(profile.dpr));
    document.documentElement.style.setProperty('--lrd-inset-top', `${profile.insets.top}px`);
    document.documentElement.style.setProperty('--lrd-inset-bottom', `${profile.insets.bottom}px`);
  }
  for (const f of subs) f(profile);
}

export async function loadDevice() {
  publish(live());
  try { publish(await currentAdapter().device()); } catch {}
  return profile;
}

export function watchDevice() {
  const on = () => publish(live());
  addEventListener('resize', on, { passive: true });
  addEventListener('orientationchange', on, { passive: true });
  (navigator as any).devicePosture?.addEventListener?.('change', on);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', on);
  matchMedia('(pointer: coarse)').addEventListener('change', on);
  return () => {
    removeEventListener('resize', on);
    removeEventListener('orientationchange', on);
  };
}
