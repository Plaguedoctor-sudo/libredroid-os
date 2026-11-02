import React, { useEffect, useRef, useState } from 'react';
import { VT } from '../vt';
import { AnsiTerminal } from './AnsiTerminal';
import { run, type ExecHandle } from '../exec';
import { useCap } from './PlatformProvider';
import { useWindow } from '../../context/WindowContext';

export interface InlineResult { code: number; output: string; ms: number }

export function InlineTerminal({
  command, autoRun = false, pty = false, requiresRoot = false, maxHeight = 200,
  onResult, label,
}: {
  command: string;
  autoRun?: boolean;
  pty?: boolean;
  requiresRoot?: boolean;
  maxHeight?: number;
  onResult?: (r: InlineResult) => void;
  label?: string;
}) {
  const execCap = useCap('os.exec');
  let windowCtx: ReturnType<typeof useWindow> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    windowCtx = useWindow();
  } catch {}

  const [vt] = useState(() => new VT(90, 10));
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'failed'>('idle');
  const [ms, setMs] = useState(0);
  const [, tick] = useState(0);
  const handle = useRef<ExecHandle | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const ran = useRef(false);

  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 80); return () => clearInterval(t); }, []);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [vt.version]);

  const exec = async () => {
    if (state === 'running') return;
    setState('running');
    vt.write(`\x1b[90m$ ${requiresRoot ? 'su -c ' : ''}${command}\x1b[0m\r\n`);
    const started = Date.now();
    try {
      const h = await run(command, {
        pty, root: requiresRoot, timeoutMs: 600_000,
        onData: (c) => vt.write(new TextDecoder().decode(c)),
      });
      handle.current = h;
      const { code } = await h.done;
      const elapsed = Date.now() - started;
      setMs(elapsed);
      setState(code === 0 ? 'done' : 'failed');
      vt.write(`\r\n\x1b[${code === 0 ? '32' : '31'}m[exit ${code} in ${(elapsed / 1000).toFixed(1)}s]\x1b[0m\r\n`);
      onResult?.({ code, output: vt.text(true), ms: elapsed });
    } catch (e: any) {
      setState('failed');
      vt.write(`\r\n\x1b[31m${e?.message ?? 'exec failed'}\x1b[0m\r\n`);
      onResult?.({ code: -1, output: vt.text(true), ms: Date.now() - started });
    }
  };

  useEffect(() => {
    if (autoRun && !ran.current && execCap.ok) { ran.current = true; void exec(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, execCap.ok]);

  if (!execCap.ok) {
    return (
      <div className="rounded border border-neutral-800 bg-black/40 p-2">
        <div className="mb-1 font-mono text-[11px] text-neutral-400">{command}</div>
        <div className="text-[10px] text-neutral-500">
          no exec bridge — run this in Termux manually
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-neutral-800">
      <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-900/80 px-2 py-1">
        <span className={`h-1.5 w-1.5 rounded-full ${
          state === 'running' ? 'animate-pulse bg-amber-400'
          : state === 'done' ? 'bg-emerald-400' : state === 'failed' ? 'bg-red-500' : 'bg-neutral-600'}`} />
        <span className="flex-1 truncate font-mono text-[10px] text-neutral-500">
          {label ?? (requiresRoot ? `su -c ${command}` : command)}
        </span>
        {state === 'failed' && <span className="text-[10px] text-red-400">exit {ms}ms</span>}
        {state === 'done' && <span className="text-[10px] text-emerald-500">ok</span>}
        {state === 'running' && handle.current && (
          <button onClick={() => handle.current?.kill('SIGINT')} className="rounded bg-red-900/60 px-1.5 text-[10px] text-red-200">^C</button>
        )}
        <button
          onClick={() => {
            if (windowCtx) {
              windowCtx.openApp('terminal', 'Terminal', 'workstation-debian', { run: command, cwd: undefined });
            }
          }}
          className="rounded px-1.5 text-[10px] text-neutral-500 hover:text-neutral-300"
        >open</button>
      </div>
      <div ref={scroller} className="max-h-[200px] overflow-auto" style={{ maxHeight }}>
        <AnsiTerminal vt={vt} fontSize={10.5} lineHeight={1.2} />
      </div>
      {(state === 'idle' || state === 'failed') && (
        <button onClick={exec}
                className="w-full border-t border-neutral-800 bg-neutral-900 py-1 text-[10px] text-neutral-300 hover:bg-neutral-800">
          {state === 'failed' ? 'run again' : 'run'}
        </button>
      )}
    </div>
  );
}
