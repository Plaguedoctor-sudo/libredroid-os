import React, { useEffect, useMemo, useState } from 'react';
import type { CapId } from '../types';
import { remedyFor, rankedRemedies, residualLimitations, pasteableScript, type Remedy } from '../remedies';
import { caps } from '../caps';
import { setPhase } from '../lifecycle';
import { usePlatform } from './PlatformProvider';
import { InlineTerminal, type InlineResult } from './InlineTerminal';
import { Overlay, OverlayHost } from './Overlay';

type StepState = 'idle' | 'running' | 'ok' | 'failed' | 'skipped';

interface Props {
  only?: CapId[];
  onDone?: () => void;
}

export function FirstRunWizard({ only, onDone }: Props) {
  const { phase } = usePlatform();
  const [steps, setSteps] = useState<Remedy[]>(() =>
    only ? only.map(remedyFor).filter((r): r is Remedy => !!r) : rankedRemedies(true).slice(0, 3));
  const [i, setI] = useState(0);
  const [state, setState] = useState<StepState>('idle');
  const [note, setNote] = useState<string | null>(null);
  const [result, setResult] = useState<InlineResult | null>(null);
  const [inlineAutoRun, setInlineAutoRun] = useState(false);
  const [done, setDone] = useState(false);

  const step = steps[i];
  const total = steps.length;

  useEffect(() => {
    setState('idle');
    setNote(null);
    setResult(null);
    setInlineAutoRun(false);
  }, [i]);

  const finish = () => {
    localStorage.setItem('lrd.setup.done', '1');
    const left = rankedRemedies(true).length;
    setPhase(left ? 'degraded' : 'running');
    setDone(true);
    onDone?.();
  };

  if (done) return null;

  const onInlineResult = async (r: InlineResult) => {
    setResult(r);
    if (r.code === 0) {
      setState('running');
      for (let n = 0; n < 6; n++) {
        if (await step.verify().catch(() => false)) {
          setState('ok');
          return;
        }
        await new Promise((res) => setTimeout(res, 3000));
      }
      setState('failed');
      setNote(step.ifFails ?? 'command finished, but capability verification failed');
    } else {
      setState('failed');
      setNote(`command exited ${r.code}`);
    }
  };

  const runStep = async () => {
    if (!step) return;

    if (step.exec && state === 'idle') {
      setState('running');
      setNote(null);
      setInlineAutoRun(true);
      return;
    }

    setState('running');
    setNote(null);

    // local fixes are synchronous and can't fail meaningfully
    if (step.kind === 'local' && step.run) {
      await step.run();
      const ok = await step.verify();
      setState(ok ? 'ok' : 'failed');
      if (!ok) setNote(step.ifFails ?? null);
      return;
    }

    if (step.kind === 'auto' && step.run) {
      const ran = await step.run().catch(() => false);
      if (!ran) { setState('failed'); setNote(step.ifFails ?? 'the bridge refused the request'); return; }
      // verify with retries — tor takes a while to bootstrap
      for (let n = 0; n < 8; n++) {
        if (await step.verify().catch(() => false)) { setState('ok'); return; }
        await new Promise((r) => setTimeout(r, n < 2 ? 1500 : 5000));
      }
      setState('failed');
      setNote(step.ifFails ?? 'ran, but the capability still reads as absent');
      return;
    }

    // guided / info: user does it, we verify
    const ok = await step.verify().catch(() => false);
    setState(ok ? 'ok' : 'failed');
    if (!ok) setNote(step.ifFails ?? null);
  };

  const next = () => {
    if (i + 1 < total) setI(i + 1);
    else finish();
  };

  const skip = () => { setState('skipped'); next(); };

  if (done) return <WizardDone />;
  if (!step) return <WizardDone />;

  return (
    <Shell title={phase === 'firstrun' ? 'Setting up LibreDroid' : 'Closing a gap'}>
      <Progress i={i} total={total} />

      <div className="px-5 py-4">
        <div className="mb-1 flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-neutral-100">{step.title}</h2>
          <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase ${
            step.effort === 'trivial' || step.effort === 'one-tap' ? 'bg-emerald-900 text-emerald-300'
            : step.effort === 'command' ? 'bg-amber-900 text-amber-300' : 'bg-neutral-800 text-neutral-400'
          }`}>{step.effort}</span>
        </div>
        <p className="text-sm leading-relaxed text-neutral-300">{step.why}</p>

        {step.exec ? (
          <div className="mt-3">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">
              run in-place
            </div>
            <InlineTerminal
              key={`${step.id}-${i}`}
              command={step.exec}
              pty={step.pty}
              requiresRoot={step.requiresRoot}
              autoRun={inlineAutoRun}
              onResult={onInlineResult}
            />
          </div>
        ) : step.command ? (
          <div className="mt-3">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">
              {step.kind === 'info' ? 'what you can do' : 'paste into Termux'}
            </div>
            <div className="flex items-start gap-2">
              <pre className="flex-1 overflow-x-auto rounded bg-black/60 p-2 font-mono text-[11px] text-emerald-300">{step.command}</pre>
              <button
                onClick={() => navigator.clipboard?.writeText(step.command!)}
                className="rounded bg-neutral-800 px-2 py-1 text-[10px]"
              >copy</button>
            </div>
          </div>
        ) : null}

        {step.link && (
          <a href={step.link.href} target="_blank" rel="noreferrer"
             className="mt-3 inline-block text-[11px] text-sky-400 underline">{step.link.label}</a>
        )}

        {state === 'running' && (
          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
            working…
          </div>
        )}
        {state === 'ok' && (
          <div className="mt-3 rounded border border-emerald-800 bg-emerald-950/50 px-3 py-2 text-xs text-emerald-300">
            Verified — this capability is now real.
          </div>
        )}
        {state === 'failed' && (
          <div className="mt-3 rounded border border-amber-800 bg-amber-950/40 px-3 py-2 text-xs text-amber-300">
            Not verified yet. {note}
          </div>
        )}
        {state === 'skipped' && <div className="mt-3 text-xs text-neutral-500">Skipped — it stays on the list.</div>}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-neutral-800 px-5 py-3">
        <button onClick={skip} className="text-[11px] text-neutral-500 hover:text-neutral-300">skip</button>
        <div className="flex gap-2">
          {state !== 'ok' && step.kind !== 'info' && (
            <button onClick={runStep} disabled={state === 'running'}
                    className="rounded bg-amber-600 px-4 py-1.5 text-xs font-medium text-black disabled:opacity-50">
              {step.kind === 'auto' ? 'do it' : step.kind === 'local' ? 'enable' : (step.exec && state === 'idle' ? 'run it here' : 'verify')}
            </button>
          )}
          {step.kind === 'info' && state !== 'ok' && (
            <button onClick={() => { setState('ok'); }} className="rounded bg-neutral-800 px-4 py-1.5 text-xs">
              got it
            </button>
          )}
          <button onClick={next}
                  className={`rounded px-4 py-1.5 text-xs font-medium ${
                    state === 'ok' || step.kind === 'info' ? 'bg-emerald-700 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}>
            {i + 1 < total ? 'next' : 'finish'}
          </button>
        </div>
      </div>
    </Shell>
  );
}

/* ---------- the summary screen ---------- */
function WizardDone() {
  const [copied, setCopied] = useState(false);
  const residual = useMemo(residualLimitations, []);
  const score = caps.score();

  return (
    <Shell title="Setup complete">
      <div className="px-5 py-4">
        <div className="mb-4 flex items-center gap-4">
          <div className="text-4xl font-mono text-emerald-400">{score}</div>
          <div>
            <div className="text-sm font-medium text-neutral-200">{caps.verdict().replace('-', ' ')}</div>
            <div className="text-[11px] text-neutral-500">bare-metal score</div>
          </div>
        </div>

        {residual.length > 0 && (
          <>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">
              Still not real — and why
            </div>
            <ul className="mb-4 space-y-1.5">
              {residual.map((r) => (
                <li key={r.id} className="flex gap-2 text-[11px] leading-snug">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-600" />
                  <span className="text-neutral-400"><span className="font-mono text-neutral-500">{r.id}</span> — {r.why}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="rounded border border-neutral-800 bg-neutral-900/60 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">keep this for later</div>
          <pre className="max-h-32 overflow-auto font-mono text-[10px] text-neutral-400">{pasteableScript()}</pre>
          <button
            onClick={() => { navigator.clipboard?.writeText(pasteableScript()); setCopied(true); }}
            className="mt-2 rounded bg-neutral-800 px-3 py-1 text-[10px]"
          >{copied ? 'copied' : 'copy setup script'}</button>
        </div>
      </div>
    </Shell>
  );
}

/* ---------- chrome ---------- */
function Shell({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  if (!open) return null;
  return (
    <Overlay open={open}>
      <div className="lrd-scrim" />
      <div
        className="absolute inset-x-0 flex justify-center px-3"
        style={{
          top: 'var(--lrd-overlay-top)',
          bottom: 'var(--lrd-overlay-bottom)',
        }}
      >
        <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl pointer-events-auto">
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-2.5">
            <span className="text-[11px] uppercase tracking-wide text-neutral-500">{title}</span>
            <span className="font-mono text-[10px] text-neutral-600">libredroid setup</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </div>
      </div>
    </Overlay>
  );
}

function Progress({ i, total }: { i: number; total: number }) {
  return (
    <div className="flex gap-1 px-5 pt-3">
      {Array.from({ length: total }).map((_, n) => (
        <div key={n} className={`h-0.5 flex-1 rounded-full ${n <= i ? 'bg-amber-500' : 'bg-neutral-800'}`} />
      ))}
    </div>
  );
}
