import { useEffect, useRef, useState } from 'react';
import { OverlayHost } from './Overlay';

/**
 * A magnifier for the shell's own UI. Chromium cannot be zoomed per-region, so we
 * scale the content layer with a CSS transform and pan it by dragging.
 * Overlays are rendered outside through OverlayHost so they are not scaled.
 */
export function Magnifier() {
  const [on, setOn] = useState(false);
  const [scale, setScale] = useState(2);
  const [origin, setOrigin] = useState({ x: 0.5, y: 0.5 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/events');
    const h = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.topic === 'a11y') {
          const d = payload.data;
          if (typeof d.magnifier === 'boolean') setOn(d.magnifier);
          if (typeof d.scale === 'number') setScale(1 + d.scale * 0.4);
        }
      } catch {}
    };
    es.addEventListener('a11y', h as any);
    return () => es.close();
  }, []);

  useEffect(() => {
    // transform `.lrd-content`, NOT the fixed-ancestor chain
    const target = document.querySelector<HTMLElement>('.lrd-content');
    if (!target) return;
    if (!on) { target.style.transform = ''; target.style.transformOrigin = ''; return; }
    target.style.transformOrigin = `${origin.x * 100}% ${origin.y * 100}%`;
    target.style.transform = `scale(${scale})`;
    target.style.transition = 'transform 120ms ease-out';
    return () => { target.style.transform = ''; target.style.transition = ''; };
  }, [on, scale, origin]);

  // HUD
  if (!on) return null;

  return (
    <OverlayHost>
      <div
        className="absolute inset-0 z-[9996]"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dx = (e.clientX - drag.current.x) / window.innerWidth;
          const dy = (e.clientY - drag.current.y) / window.innerHeight;
          setOrigin((o) => ({
            x: Math.min(1, Math.max(0, o.x - dx * 1.5)),
            y: Math.min(1, Math.max(0, o.y - dy * 1.5)),
          }));
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <div
          className="absolute right-3 flex gap-1 rounded-lg bg-black/70 px-2 py-1 text-[10px] text-white/85"
          style={{ bottom: 'var(--lrd-overlay-bottom)' }}
        >
          <button onClick={() => setScale((s) => Math.max(1.5, s - 0.5))}>-</button>
          <span>{scale.toFixed(1)}x</span>
          <button onClick={() => setScale((s) => Math.min(6, s + 0.5))}>+</button>
          <button onClick={() => setOrigin({ x: 0.5, y: 0.5 })}>centre</button>
          <button onClick={() => setOn(false)}>off</button>
        </div>
      </div>
    </OverlayHost>
  );
}
