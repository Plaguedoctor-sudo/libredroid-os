import React, { useEffect, useRef, useState } from 'react';
import { usePlatform } from './PlatformProvider';
import { dispatchBack, registerBack } from '../input';
import { enterSafe } from '../lifecycle';

/* ---------- SafeArea: real insets, no CSS guessing ---------- */
export function SafeArea({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { device } = usePlatform();
  return (
    <div className={className} style={{
      paddingTop: `max(${device.insets.top}px, env(safe-area-inset-top))`,
      paddingBottom: `max(${device.insets.bottom}px, env(safe-area-inset-bottom))`,
      paddingLeft: `max(${device.insets.left}px, env(safe-area-inset-left))`,
      paddingRight: `max(${device.insets.right}px, env(safe-area-inset-right))`,
    }}>{children}</div>
  );
}

/* ---------- Kiosk: turn the page into a machine ---------- */
export function Kiosk({ children }: { children: React.ReactNode }) {
  const { host, safe } = usePlatform();
  const [chromeHidden, setHidden] = useState(false);

  useEffect(() => {
    const kiosk = new URLSearchParams(location.search).get('kiosk') === '1'
      || host === 'linux-kiosk';
    const root = document.documentElement;
    root.classList.toggle('lrd-kiosk', kiosk);

    const css = document.createElement('style');
    css.id = 'lrd-kiosk-css';
    css.textContent = `
      html.lrd-kiosk, html.lrd-kiosk body { overscroll-behavior: none; height: 100%; }
      html.lrd-kiosk body { height: 100dvh; overflow: hidden;
        -webkit-user-select: none; user-select: none;
        -webkit-touch-callout: none; touch-action: manipulation; }
      html.lrd-kiosk input, html.lrd-kiosk textarea { -webkit-user-select: text; user-select: text; }
      html.lrd-kiosk * { -webkit-tap-highlight-color: transparent; }
      html.lrd-kiosk ::-webkit-scrollbar { width: 6px; height: 6px; }
      @media (prefers-reduced-motion: reduce) { html.lrd-kiosk * { animation-duration: .01ms !important; } }
      html[data-thermal="throttle"] .lrd-expensive { animation: none !important; }
      html[data-power="saver"] .lrd-expensive, html[data-power="critical"] .lrd-expensive { display: none; }
      html.lrd-kiosk.lrd-nosel * { user-select: none; }
      .lrd-corner-tr { position: fixed; top: 0; right: 0; width: 44px; height: 44px; z-index: 9998; }
    `;
    document.head.appendChild(css);
    return () => css.remove();
  }, [host]);

  // escape hatch: 4 taps in the top-right corner toggles the status bar / enters safe mode on 6
  const taps = useRef<{ n: number; t: number }>({ n: 0, t: 0 });
  const onCorner = () => {
    const now = Date.now();
    if (now - taps.current.t > 800) taps.current.n = 0;
    taps.current = { n: taps.current.n + 1, t: now };
    if (taps.current.n === 4) { setHidden((h) => !h); taps.current.n = 0; }
    if (taps.current.n === 6) enterSafe('corner gesture');
  };

  return (
    <>
      <div className="lrd-corner-tr" onClick={onCorner} />
      {!safe && chromeHidden && <div className="fixed top-0 left-0 right-0 h-6 z-[9999] bg-black/40 backdrop-blur text-[10px] text-white/70 flex items-center px-2">libredroid</div>}
      {children}
    </>
  );
}

/* ---------- SystemGestureBar: bottom edge = Android gesture nav ---------- */
export function SystemGestureBar({ onHome, onRecents }: { onHome: () => void; onRecents: () => void }) {
  const { device, host } = usePlatform();
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const show = host === 'android-pwa' || host === 'android-native' || device.touch !== 'none';

  useEffect(() => {
    const off1 = registerBack('gesture-bar', 10, () => { onHome(); return true; });
    return off1;
  }, [onHome]);

  if (!show) return null;

  const h = Math.max(20, device.insets.bottom + 12);

  return (
    <div
      data-lrd-gesture
      className="lrd-gesture-bar fixed bottom-0 left-0 right-0 z-[9997]"
      style={{ height: h, paddingBottom: device.insets.bottom }}
      onPointerDown={(e) => { start.current = { x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => { if (start.current) setDx(e.clientX - start.current.x); }}
      onPointerUp={() => {
        const d = dx; setDx(0);
        if (d < -60) dispatchBack();          // swipe from right = back
        else if (d > 60) onRecents();          // swipe right = recents
        else onHome();                          // tap = home
        start.current = null;
      }}
    >
      <div className="mx-auto mt-1 h-1 w-28 rounded-full bg-white/40 transition-transform"
           style={{ transform: `translateX(${dx / 4}px) scaleX(${1 + Math.min(Math.abs(dx) / 300, 0.6)})` }} />
    </div>
  );
}

/* ---------- BackButton host: wires the shell's own priority chain ---------- */
export function BackButtonHost({ handlers }: { handlers: { id: string; priority: number; fn: () => boolean | void }[] }) {
  useEffect(() => {
    const offs = handlers.map((h) => registerBack(h.id, h.priority as any, h.fn));
    return () => offs.forEach((f) => f());
  }, [handlers]);
  return null;
}
