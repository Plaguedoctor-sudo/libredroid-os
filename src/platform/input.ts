import { currentAdapter } from './index';
import { caps } from './caps';
import { degrade } from './lifecycle';

export type BackPriority = 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90;
interface Handler { id: string; priority: BackPriority; fn: () => boolean | void; once?: boolean }

const handlers: Handler[] = [];
export function registerBack(id: string, priority: BackPriority, fn: () => boolean | void, once = false) {
  handlers.push({ id, priority, fn, once });
  return () => { const i = handlers.findIndex((h) => h.id === id); if (i >= 0) handlers.splice(i, 1); };
}

/** Returns true if something consumed it. */
export function dispatchBack(): boolean {
  const sorted = [...handlers].sort((a, b) => b.priority - a.priority);
  for (const h of sorted) {
    if (h.fn() === true) {
      if (h.once) {
        const i = handlers.findIndex((x) => x.id === h.id);
        if (i >= 0) handlers.splice(i, 1);
      }
      return true;
    }
  }
  return false;
}

type KeyHandler = (e: KeyboardEvent) => boolean | void;
const keys = new Map<string, KeyHandler>();
export function registerKey(combo: string, fn: KeyHandler) {
  keys.set(combo, fn);
  return () => { keys.delete(combo); };
}

const comboOf = (e: KeyboardEvent) => {
  const p: string[] = [];
  if (e.ctrlKey) p.push('ctrl');
  if (e.altKey) p.push('alt');
  if (e.metaKey) p.push('meta');
  if (e.shiftKey) p.push('shift');
  p.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  return p.join('+');
};

const DEFAULT_KEYS: Record<string, string> = {
  'Escape': 'back',
  'ctrl+alt+Backspace': 'restart-ui',
  'ctrl+alt+t': 'terminal',
  'ctrl+alt+l': 'lock',
  'meta+Tab': 'recents',
  'F11': 'fullscreen',
  'ctrl+alt+Delete': 'power-menu',
  'PrintScreen': 'screenshot',
};

export function installInput() {
  const adapter = currentAdapter();

  // 1. hardware keyboard (Linux kiosk: real evdev keys arrive as DOM events)
  const onKey = (e: KeyboardEvent) => {
    const combo = comboOf(e);
    const h = keys.get(combo);
    if (h?.(e) === true) { e.preventDefault(); return; }
    const action = DEFAULT_KEYS[combo];
    if (!action) return;
    if (action === 'back') { if (dispatchBack()) e.preventDefault(); }
    else { e.preventDefault(); (window as any).__LRD_SYS__?.(action); }
  };
  addEventListener('keydown', onKey);

  // 2. Android hardware back / browser back gesture
  const push = () => history.pushState({ lrd: 1, d: Date.now() }, '');
  push();
  const onPop = () => { push(); if (!dispatchBack()) (window as any).__LRD_SYS__?.('home'); };
  addEventListener('popstate', onPop);

  // 3. Capacitor native back
  const cap = (window as any).Capacitor;
  let capOff: (() => void) | undefined;
  if (cap?.Plugins?.App?.addListener) {
    cap.Plugins.App.addListener('backButton', () => { if (!dispatchBack()) cap.Plugins.App.exitApp?.(); })
      .then((h: any) => { capOff = () => h?.remove?.(); });
  }

  // 4. gamepad poll (only if the shell asks for it)
  let gp = 0;
  const pollGamepad = () => {
    gp = requestAnimationFrame(pollGamepad);
    for (const g of navigator.getGamepads?.() ?? []) {
      if (!g) continue;
      if (g.buttons[0]?.pressed) dispatchBack();
      if (g.buttons[9]?.pressed) (window as any).__LRD_SYS__?.('power-menu');
    }
  };
  if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') gp = requestAnimationFrame(pollGamepad);

  // 5. stylus / pen
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === 'pen') {
      document.documentElement.dataset.pen = '1';
      if (e.button === 5) dispatchBack();      // pen barrel button = back
    }
  };
  addEventListener('pointerdown', onPointer);

  if (!caps.has('input.back')) degrade('input.back');

  return () => {
    removeEventListener('keydown', onKey);
    removeEventListener('popstate', onPop);
    removeEventListener('pointerdown', onPointer);
    cancelAnimationFrame(gp);
    capOff?.();
  };
}

/** Attach the shell's own system actions. */
export function bindSystemActions(fn: (a: string) => void) { (window as any).__LRD_SYS__ = fn; }
