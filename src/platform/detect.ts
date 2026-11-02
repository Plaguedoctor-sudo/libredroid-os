import type { HostKind } from './types';

/** Best-effort host classification. Never authoritative — adapters re-verify. */
export function detectHost(): HostKind {
  const w = window as any;
  if (w.Capacitor?.isNativePlatform?.()) return 'android-native';

  const ua = navigator.userAgent;
  const android = /Android/i.test(ua);
  const standalone =
    (w.matchMedia?.('(display-mode: fullscreen)')?.matches ?? false) ||
    (w.matchMedia?.('(display-mode: standalone)')?.matches ?? false) ||
    w.navigator?.standalone === true;

  // the bridge injects this so we don't have to guess
  const hinted = w.__LRD_HOST__ as HostKind | undefined;
  if (hinted) return hinted;

  // a cage/kiosk session has no window chrome and a tiny inner==outer delta
  const chromeGap = window.outerHeight - window.innerHeight;
  const kioskish = standalone && chromeGap < 8;

  if (!android) return kioskish ? 'linux-kiosk' : 'linux-desktop';
  return standalone ? 'android-pwa' : 'android-pwa';
}

export const isAndroid = () => /Android/i.test(navigator.userAgent);
export const isTouch = () => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
export const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const prefersDark = () => matchMedia('(prefers-color-scheme: dark)').matches;

/** Read env(safe-area-inset-*) for real, in CSS px. */
export function readInsets() {
  const d = document.createElement('div');
  d.style.cssText =
    'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.appendChild(d);
  const cs = getComputedStyle(d);
  const out = {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  };
  d.remove();
  return out;
}

/** Corner-radius probe — tells us whether the panel has a notch/rounded corners. */
export function detectNotch() {
  const i = readInsets();
  return i.top > 24 || i.left > 0 || i.right > 0;
}

export function hasWebGPU() {
  return typeof (navigator as any).gpu?.requestAdapter === 'function';
}

export async function gpuAdapterInfo() {
  try {
    const a = await (navigator as any).gpu?.requestAdapter?.({ powerPreference: 'high-performance' });
    if (!a) return null;
    const i = a.info ?? (a.requestAdapterInfo ? await a.requestAdapterInfo() : null);
    return i ? { vendor: i.vendor, architecture: i.architecture, device: i.device } : null;
  } catch { return null; }
}
