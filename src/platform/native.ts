/**
 * Native app surface. Native apps are compositor toplevels, not embedded content,
 * so the shell hides itself while one is focused and comes back when it closes.
 */
export interface NativeApp {
  id: string;
  name: string;
  icon?: string;
  source: 'desktop' | 'flatpak' | 'waydroid' | 'native';
  category: string;
}

let apps: NativeApp[] = [];
let focused: string | null = null;
const subs = new Set<(s: { apps: NativeApp[]; focused: string | null }) => void>();

const post = (p: string, b?: unknown) =>
  fetch(p, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(b ?? {}),
  }).catch(() => null);

export const nativeApps = () => apps;
export const focusedApp = () => focused;
export const onNative = (f: (s: { apps: NativeApp[]; focused: string | null }) => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};
const emit = () => subs.forEach((f) => f({ apps, focused }));

export async function loadNativeApps() {
  try {
    const r = await fetch('/api/apps/native');
    const j = await r.json();
    apps = j.apps ?? [];
    emit();
  } catch {}
  return apps;
}

export async function launchNative(id: string, args: string[] = []) {
  await post('/api/wm/launch', { id, args });
  focused = id;
  emit();
}

export async function focusShell() {
  await post('/api/wm/shell');
  focused = null;
  emit();
}

export async function closeNative(id: string) {
  await post('/api/wm/close', { id });
  if (focused === id) {
    focused = null;
    emit();
  }
}

export function watchNative() {
  const es = new EventSource('/api/events');
  const h = (e: MessageEvent) => {
    try {
      const payload = JSON.parse(e.data);
      if (payload.topic === 'wm') {
        const d = payload.data;
        if (d.event === 'toplevels') {
          const onlyShell = (d.toplevels ?? []).every((x: string) => /chromium|libredroid/i.test(x));
          if (onlyShell && focused) {
            focused = null;
            emit();
          }
        }
      }
    } catch {}
  };
  es.addEventListener('wm', h as any);

  const t = setInterval(loadNativeApps, 60000);
  loadNativeApps();
  return () => {
    es.close();
    clearInterval(t);
  };
}

export const nativeSupported = () => true;
