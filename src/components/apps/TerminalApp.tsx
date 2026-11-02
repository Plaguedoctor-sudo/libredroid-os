import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VT } from '../../platform/vt';
import { AnsiTerminal } from '../../platform/react/AnsiTerminal';
import { run, type ExecHandle, list as listJobs, killAll } from '../../platform/exec';
import { useCap } from '../../platform/react/PlatformProvider';
import { registerKey } from '../../platform/input';
import type { AppIntent } from '../../types/apps';

export interface TerminalParams {
  run?: string;
  exec?: string;
  cwd?: string;
  readonly?: boolean;
  [key: string]: unknown;
}

interface Props extends Partial<AppIntent> {
  intent?: AppIntent;
  params?: TerminalParams;
  paramSeq?: number;
}

const KEYS: { label: string; send: string; wide?: boolean }[] = [
  { label: 'esc', send: '\x1b' },
  { label: 'tab', send: '\t' },
  { label: '^C', send: '\x03' },
  { label: '^D', send: '\x04' },
  { label: '^Z', send: '\x1a' },
  { label: '^L', send: '\x0c' },
  { label: '↑', send: '\x1b[A' },
  { label: '↓', send: '\x1b[B' },
  { label: '←', send: '\x1b[D' },
  { label: '→', send: '\x1b[C' },
  { label: 'home', send: '\x1b[H' },
  { label: 'end', send: '\x1b[F' },
  { label: 'pgup', send: '\x1b[5~' },
  { label: 'pgdn', send: '\x1b[6~' },
  { label: '|', send: '|' },
  { label: '-', send: '-' },
  { label: '/', send: '/' },
  { label: '~', send: '~' },
];

const QUICK: { label: string; cmd: string }[] = [
  { label: 'doctor', cmd: 'lrd-termux-doctor' },
  { label: 'recover', cmd: 'lrd-recover.sh' },
  { label: 'backup', cmd: 'lrd-backup.sh' },
  { label: 'tor status', cmd: 'sv status tor; curl -s --socks5-hostname 127.0.0.1:9050 https://check.torproject.org/api/ip' },
  { label: 'volumes', cmd: 'df -h | grep -Ev "tmpfs|overlay"' },
  { label: 'top cpu', cmd: 'ps -eo pcpu,pmem,comm --sort=-pcpu | head -12' },
  { label: 'thermal', cmd: 'for z in /sys/class/thermal/thermal_zone*; do printf "%s %s\\n" "$(cat $z/type)" "$(cat $z/temp)"; done' },
  { label: 'events', cmd: 'curl -sN "http://127.0.0.1:3001/api/events?topics=power,net" | head -40' },
];

export const TerminalApp: React.FC<Props> = ({ intent, params, paramSeq }) => {
  const effectiveParams: TerminalParams | undefined = params || (intent?.params as any);
  const execCap = useCap('os.exec');
  const [vt] = useState(() => new VT(100, 30));
  const [, tick] = useState(0);
  const [input, setInput] = useState('');
  const [handle, setHandle] = useState<ExecHandle | null>(null);
  const [state, setState] = useState<'idle' | 'running' | 'exited'>('idle');
  const [code, setCode] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('lrd.term.history') ?? '[]'); } catch { return []; }
  });
  const [hIdx, setHIdx] = useState(-1);
  const [follow, setFollow] = useState(true);
  const [showJobs, setShowJobs] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cols = useRef(100);
  const rows = useRef(30);

  /* resize the VT to the container */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const c = Math.max(40, Math.floor(el.clientWidth / 7.2));
      const r = Math.max(10, Math.floor(el.clientHeight / 15));
      if (c !== cols.current || r !== rows.current) {
        cols.current = c; rows.current = r;
        vt.resize(c, r);
        handle?.write(`\x1b[8;${r};${c}t`);   // tell the remote
        tick((n) => n + 1);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [vt, handle]);

  useEffect(() => {
    if (follow && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [vt.version, follow]);

  const start = async (cmd: string) => {
    if (!cmd.trim()) return;
    vt.write(`\x1b[90m$ ${cmd}\x1b[0m\r\n`);
    setState('running'); setCode(null);
    try {
      const h = await run(cmd, {
        pty: true, cwd: effectiveParams?.cwd,
        onData: (c) => vt.write(new TextDecoder().decode(c)),
      });
      setHandle(h);
      h.onExit((c) => { setState('exited'); setCode(c); setHandle(null); });
      const next = [cmd, ...history.filter((x) => x !== cmd)].slice(0, 200);
      setHistory(next);
      localStorage.setItem('lrd.term.history', JSON.stringify(next));
      setHIdx(-1);
    } catch (err: any) {
      vt.write(`\x1b[31mError launching job: ${err?.message || err}\x1b[0m\r\n`);
      setState('exited');
      setCode(1);
    }
  };

  useEffect(() => {
    const cmdToRun = effectiveParams?.run || effectiveParams?.exec;
    if (cmdToRun) void start(cmdToRun);
    else {
      vt.write('\x1b[1mlibredroid terminal\x1b[0m\r\n');
      vt.write(`\x1b[90mhost ${typeof navigator !== 'undefined' && navigator.userAgent.includes('Android') ? 'android' : 'linux'} · pty · bridge /api/host/exec\x1b[0m\r\n\r\n`);
      if (!execCap.ok) vt.write('\x1b[33mbridge exec unavailable — read-only log view\x1b[0m\r\n');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => registerKey('ctrl+shift+k', () => { vt.reset(); tick((n) => n + 1); return true; }), [vt]);
  useEffect(() => registerKey('ctrl+shift+c', () => { navigator.clipboard?.writeText(vt.text(true)); return true; }), [vt]);

  const sendKey = (s: string) => { handle?.write(s); inputRef.current?.focus(); };

  const submit = () => {
    const cmd = input;
    setInput('');
    if (handle) { void handle.write(cmd + '\r'); return; }
    void start(cmd);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); return; }
    if (e.key === 'ArrowUp' && (input === '' || hIdx >= 0)) {
      e.preventDefault();
      const n = Math.min(history.length - 1, hIdx + 1);
      if (n >= 0) { setHIdx(n); setInput(history[n]); }
      return;
    }
    if (e.key === 'ArrowDown' && hIdx >= 0) {
      e.preventDefault();
      const n = hIdx - 1;
      setHIdx(n);
      setInput(n < 0 ? '' : history[n]);
      return;
    }
    if (e.key === 'ArrowLeft' && handle && input === '') { e.preventDefault(); void handle.write('\x1b[D'); return; }
    if (e.key === 'ArrowRight' && handle && input === '') { e.preventDefault(); void handle.write('\x1b[C'); return; }
    if (e.ctrlKey && e.key === 'c' && handle) { e.preventDefault(); void handle.write('\x03'); return; }
    if (e.ctrlKey && e.key === 'd' && handle) { e.preventDefault(); void handle.write('\x04'); return; }
    if (e.ctrlKey && e.key === 'l') { e.preventDefault(); vt.reset(); return; }
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); setInput(''); return; }
  };

  const refreshJobs = async () => setJobs(await listJobs());
  useEffect(() => { if (!showJobs) return; void refreshJobs(); const t = setInterval(refreshJobs, 2000); return () => clearInterval(t); }, [showJobs]);

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a] text-neutral-200 select-text"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* toolbar */}
      <div className="flex items-center gap-2 border-b border-neutral-800 px-2 py-1 text-[10px]">
        <span className={`h-1.5 w-1.5 rounded-full ${state === 'running' ? 'animate-pulse bg-emerald-400' : state === 'exited' && code === 0 ? 'bg-neutral-500' : state === 'exited' ? 'bg-red-500' : 'bg-neutral-600'}`} />
        <span className="text-neutral-500">{handle?.pty ? 'pty' : 'pipe'}</span>
        {state === 'exited' && <span className={code === 0 ? 'text-emerald-500' : 'text-red-400'}>exit {code}</span>}
        <span className="flex-1" />
        <button onClick={() => setFollow((f) => !f)} className={`rounded px-1.5 py-0.5 ${follow ? 'bg-neutral-800 text-neutral-300' : 'text-neutral-500'}`}>follow</button>
        <button onClick={() => setShowJobs((s) => !s)} className={`rounded px-1.5 py-0.5 ${showJobs ? 'bg-neutral-800' : 'text-neutral-500'}`}>jobs</button>
        <button onClick={() => { vt.reset(); tick((n) => n + 1); }} className="rounded px-1.5 py-0.5 text-neutral-500">clear</button>
        {handle && <button onClick={() => handle.kill('SIGINT')} className="rounded bg-red-900/60 px-1.5 py-0.5 text-red-200">^C</button>}
        <button onClick={async () => { await killAll(); await refreshJobs(); }} className="rounded bg-neutral-800 px-1.5 py-0.5">kill all</button>
      </div>

      {showJobs && (
        <div className="max-h-32 overflow-auto border-b border-neutral-800 bg-neutral-900/60 px-2 py-1 font-mono text-[10px]">
          {jobs.length === 0 && <div className="text-neutral-500">no jobs</div>}
          {jobs.map((j) => (
            <div key={j.id} className="flex gap-2">
              <span className={j.state === 'running' ? 'text-emerald-400' : 'text-neutral-500'}>{j.state}</span>
              <span className="text-neutral-600">{j.id}</span>
              <span className="flex-1 truncate text-neutral-400">{j.cmd}</span>
              <span className="text-neutral-600">{(j.bytes / 1024).toFixed(0)}K</span>
            </div>
          ))}
        </div>
      )}

      {/* output */}
      <div ref={scrollRef}
           onScroll={(e) => {
             const el = e.currentTarget;
             setFollow(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
           }}
           className="min-h-0 flex-1 overflow-auto px-1.5 py-1"
           onClick={() => inputRef.current?.focus()}>
        <AnsiTerminal vt={vt} showCursor showScrollback />
      </div>

      {/* quick commands */}
      <div className="flex gap-1 overflow-x-auto border-t border-neutral-800 px-1.5 py-1">
        {QUICK.map((q) => (
          <button key={q.label} onClick={() => void start(q.cmd)}
                  className="shrink-0 rounded bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-400 hover:text-neutral-200">
            {q.label}
          </button>
        ))}
      </div>

      {/* key bar */}
      <div className="flex gap-1 overflow-x-auto border-t border-neutral-800 px-1.5 py-1">
        {KEYS.map((k) => (
          <button key={k.label} onClick={() => sendKey(k.send)}
                  className="shrink-0 rounded bg-neutral-900 px-2 py-1 font-mono text-[10px] text-neutral-400 active:bg-neutral-700">
            {k.label}
          </button>
        ))}
      </div>

      {/* input */}
      <div className="flex items-center gap-1.5 border-t border-neutral-800 px-1.5 py-1.5">
        <span className="font-mono text-[11px] text-emerald-500">{handle ? '»' : '$'}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          placeholder={handle ? 'stdin (enter to send)' : 'command'}
          className="min-w-0 flex-1 bg-transparent font-mono text-[12px] outline-none placeholder:text-neutral-600"
        />
        {input && <button onClick={() => { setInput(''); }} className="text-[10px] text-neutral-500">clear</button>}
        <button onClick={submit} className="rounded bg-neutral-800 px-2.5 py-1 text-[11px]">run</button>
      </div>
    </div>
  );
};

export default TerminalApp;
