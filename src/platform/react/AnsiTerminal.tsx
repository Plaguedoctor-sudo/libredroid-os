import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VT, type Cell } from '../vt';

const cellStyle = (c: Cell): React.CSSProperties => {
  const s: React.CSSProperties = {};
  let fg = c.fg, bg = c.bg;
  if (c.inverse) { const t = fg; fg = bg ?? '#0a0a0a'; bg = t ?? '#e4e4e4'; }
  if (fg) s.color = fg;
  if (bg) s.background = bg;
  if (c.bold) s.fontWeight = 700;
  if (c.dim) s.opacity = 0.65;
  if (c.italic) s.fontStyle = 'italic';
  if (c.underline) s.textDecoration = 'underline';
  return s;
};

/** Renders a VT grid. Memoised per row so a fast stream does not thrash React. */
export const AnsiTerminal = React.memo(function AnsiTerminal({
  vt, showCursor, showScrollback, fontSize = 12, lineHeight = 1.25,
}: { vt: VT; showCursor?: boolean; showScrollback?: boolean; fontSize?: number; lineHeight?: number }) {
  const [, tick] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const bump = () => {
      if (raf.current !== null) return;
      raf.current = requestAnimationFrame(() => { raf.current = null; tick((n) => n + 1); });
    };
    const id = setInterval(bump, 60);
    return () => { clearInterval(id); if (raf.current !== null) cancelAnimationFrame(raf.current); };
  }, []);

  const rows = useMemo(() => {
    const grid = showScrollback ? [...vt.getScrollback(), ...vt.getGrid()] : vt.getGrid();
    return grid;
  }, [vt, vt.version, showScrollback]);

  const cur = vt.getCursor();
  const scrollOffset = showScrollback ? vt.getScrollback().length : 0;

  return (
    <div className="overflow-auto font-mono whitespace-pre"
         style={{ fontSize, lineHeight, background: '#0a0a0a', color: '#d4d4d4' }}>
      {rows.map((row, r) => (
        <div key={r} className="flex">
          {row.map((cell, c) => {
            const isCur = showCursor && cur.visible && r === cur.r + scrollOffset && c === cur.c;
            if (cell.ch === ' ' && !cell.bg && !cell.inverse && !isCur) {
              return <span key={c} className="inline-block" style={{ width: `${fontSize * 0.6}px` }}> </span>;
            }
            return (
              <span key={c} style={{ ...cellStyle(cell), ...(isCur ? { background: '#d4d4d4', color: '#0a0a0a' } : {}) }}>
                {cell.ch}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
});
