import React, { useState } from 'react';
import { caps } from '../caps';
import { leaveSafe, lifecycle } from '../lifecycle';
import { readiness } from '../readiness';
import { reprobePlatform } from '../index';

export function SafeMode() {
  const [report, setReport] = useState(() => JSON.stringify({
    reason: lifecycle().safeReason, ...readiness(),
  }, null, 2));
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-neutral-950 p-4 text-sm text-neutral-300"
         style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      <div className="mx-auto max-w-xl space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-amber-500">safe mode</div>
          <h1 className="text-lg font-semibold text-neutral-100">The shell booted with adapters off</h1>
          <p className="mt-1 text-xs leading-relaxed text-neutral-400">
            {lifecycle().safeReason ?? 'requested manually'}. Nothing here touches the bridge, so a broken
            adapter cannot take the display with it.
          </p>
        </div>

        <div className="rounded border border-neutral-800 bg-neutral-900 p-3 text-xs">
          <Row k="host" v={(window as any).__LRD_HOST__ ?? 'web'} />
          <Row k="boot count" v={String(lifecycle().bootCount)} />
          <Row k="crash count" v={String(lifecycle().crashCount)} />
          <Row k="caps probed" v={String(caps.all().length)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={async () => {
              setBusy(true);
              await reprobePlatform();
              setReport(JSON.stringify({ reason: lifecycle().safeReason, ...readiness() }, null, 2));
              setBusy(false);
            }}
            className="rounded bg-neutral-800 px-3 py-1.5 text-xs"
          >{busy ? 'probing…' : 're-probe'}</button>
          <button onClick={leaveSafe} className="rounded bg-emerald-700 px-3 py-1.5 text-xs text-white">
            boot normally
          </button>
          <button
            onClick={() => { localStorage.removeItem('lrd.safe'); localStorage.setItem('lrd.crashCount', '0'); }}
            className="rounded bg-neutral-800 px-3 py-1.5 text-xs"
          >clear crash counter</button>
          <button
            onClick={() => { navigator.clipboard?.writeText(report); }}
            className="rounded bg-neutral-800 px-3 py-1.5 text-xs"
          >copy report</button>
        </div>

        <details open className="text-[11px]">
          <summary className="cursor-pointer text-neutral-500">report</summary>
          <pre className="mt-2 max-h-72 overflow-auto rounded bg-black/60 p-2 font-mono text-[10px] text-neutral-400">{report}</pre>
        </details>

        <div className="rounded border border-neutral-800 p-3 text-[11px] leading-relaxed text-neutral-400">
          <div className="mb-1 font-medium text-neutral-300">if it keeps landing here</div>
          <ul className="list-disc space-y-1 pl-4">
            <li><code className="text-emerald-400">lrd-recover.sh</code> on the device restarts the bridge and rotates the log.</li>
            <li><code className="text-emerald-400">lrd-backup.sh --restore latest</code> rolls state back.</li>
            <li>In a browser: append <code className="text-emerald-400">?safe=0</code> to skip the sticky flag once.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-neutral-500">{k}</span><span className="font-mono">{v}</span></div>;
}
