import React, { useEffect, useState } from 'react';
import type { CapId } from '../types';
import { usePlatform } from './PlatformProvider';
import { DegradedBanner } from './DegradedBanner';
import { FirstRunWizard } from './FirstRunWizard';
import { SafeMode } from './SafeMode';
import { ensureStream } from '../live';
import { useDockInsets } from './useDockInsets';
import { OverlayHost } from './Overlay';

interface OpenOpts { only?: CapId[] }
let opener: ((o?: OpenOpts) => void) | null = null;
export function openWizard(o?: OpenOpts) { opener?.(o); }

export function SetupHost({ children }: { children: React.ReactNode }) {
  const { phase, ready, safe } = usePlatform();
  const [wizard, setWizard] = useState<OpenOpts | null>(null);

  useDockInsets();

  useEffect(() => { opener = (o) => setWizard(o ?? {}); return () => { opener = null; }; }, []);
  useEffect(() => { if (ready && !safe) ensureStream(); }, [ready, safe]);

  // first run: open automatically, once
  useEffect(() => {
    if (phase !== 'firstrun') return;
    if (localStorage.getItem('lrd.setup.seen') === '1') return;
    localStorage.setItem('lrd.setup.seen', '1');
    setWizard({});
  }, [phase]);

  // F2 / Ctrl+Alt+S opens setup from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); setWizard({}); }
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 's') { e.preventDefault(); setWizard({}); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  if (!ready) return <BootSplash />;
  if (safe) return <SafeMode />;

  return (
    <>
      {children}
      <OverlayHost>{null}</OverlayHost>
      <DegradedBanner />
      {wizard && <FirstRunWizard only={wizard.only} onDone={() => setWizard(null)} />}
    </>
  );
}

function BootSplash() {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 2500); return () => clearTimeout(t); }, []);
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-neutral-950 text-neutral-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-neutral-300" />
      <div className="text-xs">probing hardware…</div>
      {slow && <div className="max-w-xs text-center text-[10px] text-neutral-600">
        still probing. if this hangs, append <code>?safe=1</code> to the URL.
      </div>}
    </div>
  );
}
