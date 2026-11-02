import React, { useEffect, useState } from 'react';
import { usePlatform } from './PlatformProvider';
import { readiness } from '../readiness';
import { currentAdapter } from '../index';
import { refreshPower } from '../power';
import { refreshNet, verifyTor } from '../net';
import { refreshDisplay } from '../display';
import { refreshVolumes } from '../storage';
import { leaveSafe } from '../lifecycle';

const TIER_COLOR: Record<string, string> = {
  kernel: 'bg-emerald-500', native: 'bg-emerald-400', bridge: 'bg-amber-400',
  emulated: 'bg-orange-500', absent: 'bg-red-500',
};

export function ReadinessPanel() {
  const { safe } = usePlatform();
  const [r, setR] = useState(readiness());
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    await Promise.allSettled([refreshPower(), refreshNet(), refreshDisplay(), refreshVolumes()]);
    setR(readiness());
    setBusy(false);
  };
  useEffect(() => { refresh(); }, []);

  const badge = r.verdict === 'bare-metal' ? 'text-emerald-400'
    : r.verdict === 'hybrid' ? 'text-amber-400' : r.verdict === 'parasite' ? 'text-orange-400' : 'text-red-400';

  return (
    <div className="space-y-4 p-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-lg font-semibold ${badge}`}>{r.verdict.replace('-', ' ')}</div>
          <div className="text-neutral-400 text-xs">{r.headline}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono">{r.score}</div>
          <div className="text-[10px] text-neutral-500">bare-metal score</div>
        </div>
      </div>

      <div className="rounded border border-neutral-800 p-3 space-y-1 text-xs">
        <Row k="host" v={r.host} />
        <Row k="device" v={r.device.model || 'unknown'} />
        <Row k="sdk" v={String(r.device.sdk || '?')} />
        <Row k="abi" v={r.device.abis.join(', ') || '?'} />
        <Row k="slot" v={r.device.slot ?? 'none (no A/B)'} />
        <Row k="bootloader" v={r.device.unlocked === null ? '?' : r.device.unlocked ? 'unlocked' : 'locked'} />
      </div>

      <div>
        <div className="mb-1 text-xs uppercase tracking-wide text-neutral-500">Capabilities</div>
        <div className="max-h-72 space-y-0.5 overflow-auto font-mono text-[11px]">
          {r.blockers.length === 0 && r.fakes.length === 0 && (
            <div className="text-emerald-400">all load-bearing capabilities present</div>
          )}
          {Object.entries(r.tiers).sort((a, b) => a[1] - b[1]).map(([id, v]) => {
            const tier = v >= 0.95 ? 'native' : v >= 0.6 ? 'bridge' : v > 0 ? 'emulated' : 'absent';
            return (
              <div key={id} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${TIER_COLOR[tier]}`} />
                <span className="flex-1 truncate text-neutral-300">{id}</span>
                <span className="text-neutral-600">{tier}</span>
              </div>
            );
          })}
        </div>
      </div>

      {r.recommendations.length > 0 && (
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-neutral-500">To close the gaps</div>
          <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-neutral-400">
            {r.recommendations.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={refresh} disabled={busy} className="rounded bg-neutral-800 px-3 py-1.5 text-xs disabled:opacity-50">
          {busy ? 'probing…' : 're-probe hardware'}
        </button>
        <button onClick={() => verifyTor()} className="rounded bg-neutral-800 px-3 py-1.5 text-xs">verify tor exit</button>
        <button onClick={async () => { await fetch('/api/host/reprobe', { method: 'POST' }); setR(readiness()); }}
                className="rounded bg-neutral-800 px-3 py-1.5 text-xs">re-detect host</button>
        {safe && <button onClick={leaveSafe} className="rounded bg-emerald-700 px-3 py-1.5 text-xs">leave safe mode</button>}
      </div>

      <details className="text-[11px] text-neutral-500">
        <summary className="cursor-pointer">copy report</summary>
        <pre className="mt-2 max-h-40 overflow-auto rounded bg-neutral-900 p-2">
          {JSON.stringify({ adapter: currentAdapter().kind, ...r }, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4"><span className="text-neutral-500">{k}</span><span className="text-neutral-300">{v}</span></div>;
}
