import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Overlay } from "./Overlay";
import { usePanelOverflow } from "./usePanelOverflow";
import { summarise } from "./summarise";
import "./overlay.css";
import { usePlatform } from "../../platform/react/PlatformProvider";
import { rankedRemedies } from "../../platform/remedies";
import { caps } from "../../platform/caps";
import { openWizard } from "../../platform/react/SetupHost";

export type Blocker = { id: string; title: string; detail: string; cmd?: string };

export interface DegradedBannerProps {
  blockers?: Blocker[];
  fakes?: { id: string; title: string }[];
  onFix?: (id: string) => void;
  onIgnore?: (id: string) => void;
  onDismiss?: () => void;
  onWalkthrough?: () => void;
}

export function DegradedBanner(props: DegradedBannerProps = {}) {
  const [expanded, setExpanded] = useState(false);
  const platform = usePlatform();
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('lrd.banner.dismissed') ?? '[]'); } catch { return []; }
  });

  const defaultBlockers = useMemo(() => {
    return rankedRemedies(true).map((r) => ({
      id: r.id,
      title: r.title,
      detail: r.why,
      cmd: (r as any).remedyCmd ?? undefined,
    }));
  }, [platform?.phase]);

  const defaultFakes = useMemo(() => {
    return caps.all()
      .filter((c) => c.tier === 'emulated')
      .map((c) => ({ id: c.id, title: c.id }));
  }, [platform?.phase]);

  const blockers = (props.blockers ?? defaultBlockers).filter((b) => !dismissed.includes(b.id));
  const fakes = (props.fakes ?? defaultFakes).filter((f) => !dismissed.includes(f.id));

  const onFix = props.onFix ?? ((id: string) => openWizard({ only: [id as any] }));
  const onWalkthrough = props.onWalkthrough ?? (() => openWizard());
  const onIgnore = props.onIgnore ?? ((id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    sessionStorage.setItem('lrd.banner.dismissed', JSON.stringify(next));
  });
  const onDismiss = props.onDismiss ?? (() => setExpanded(false));

  const { headline, sub, walkLabel, canWalk } = summarise(blockers, fakes);
  const { scrollRef, overflowing } = usePanelOverflow<HTMLDivElement>();
  const stop = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  // F2 key toggles the banner
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setExpanded((x) => !x);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const total = blockers.length + fakes.length;
  if (total === 0) return null;
  if (platform?.phase === 'safe' || platform?.phase === 'firstrun') return null;

  // ---- collapsed: chip only, nothing over the dock --------------------
  if (!expanded) {
    return (
      <Overlay>
        <button
          type="button"
          className="lrd-chip"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          aria-label={`${headline}. Open details.`}
        >
          <span className="size-2 shrink-0 rounded-full bg-amber-400" aria-hidden />
          <span className="lrd-chip__label">
            {blockers.length ? `${blockers.length} blocker${blockers.length === 1 ? "" : "s"}` : `${fakes.length} faked`}
          </span>
        </button>
      </Overlay>
    );
  }

  // ---- expanded -------------------------------------------------------
  return (
    <Overlay>
      <div className="lrd-scrim" onClick={() => setExpanded(false)} aria-hidden />

      <section
        className="lrd-panel"
        data-lrd-overflowing={overflowing ? "true" : "false"}
        role="alertdialog"
        aria-modal="false"
        aria-labelledby="lrd-banner-headline"
        aria-describedby="lrd-banner-sub"
        onClick={stop}
      >
        <header className="lrd-panel__head px-4 pb-2 pt-3">
          <div className="lrd-row items-start">
            <div className="lrd-row__text">
              <h2 id="lrd-banner-headline"
                  className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                <span className="size-2.5 shrink-0 rounded-full bg-amber-400" aria-hidden />
                <span className="min-w-0 line-clamp-2">{headline}</span>
              </h2>
              <p id="lrd-banner-sub"
                 className="mt-1 line-clamp-2 text-xs leading-snug text-amber-200/65">
                {sub}
              </p>
            </div>
            <div className="lrd-row__actions self-start">
              <button type="button" onClick={() => setExpanded(false)}
                      aria-label="Collapse"
                      className="grid size-9 place-items-center rounded-full text-amber-200/80 hover:bg-white/10">
                <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor"
                        strokeWidth="1.75" strokeLinecap="round" fill="none" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="lrd-panel__scroll px-4">
          <ul className="space-y-2 pb-2">
            {blockers.map((b) => (
              <li key={b.id} className="lrd-row rounded-xl bg-white/[0.05] px-3 py-2.5">
                <div className="lrd-row__text">
                  <p className="line-clamp-2 text-xs font-medium leading-snug text-amber-50">{b.title}</p>
                  {b.cmd && (
                    <code className="mt-0.5 block truncate font-mono text-[11px] text-amber-200/55">{b.cmd}</code>
                  )}
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-amber-200/55">{b.detail}</p>
                </div>
                <div className="lrd-row__actions">
                  <button type="button" onClick={() => onFix(b.id)}
                          className="rounded-lg bg-amber-400/18 px-2.5 py-1.5 text-[11px] font-semibold text-amber-100 hover:bg-amber-400/28">
                    fix
                  </button>
                  <button type="button" onClick={() => onIgnore(b.id)}
                          aria-label={`Ignore: ${b.title}`}
                          className="grid size-7 place-items-center rounded-md text-amber-200/45 hover:bg-white/10">
                    <svg viewBox="0 0 20 20" className="size-3.5" aria-hidden>
                      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor"
                            strokeWidth="1.9" strokeLinecap="round" fill="none" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}

            {fakes.map((f) => (
              <li key={f.id} className="lrd-row rounded-xl bg-white/[0.025] px-3 py-2">
                <p className="lrd-row__text line-clamp-2 text-xs text-amber-200/65">{f.title}</p>
                <span className="lrd-row__actions rounded-md bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200/45">
                  faked
                </span>
              </li>
            ))}
          </ul>
        </div>

        <footer className="lrd-panel__foot border-t border-amber-300/10 px-4 py-3">
          <button type="button" onClick={onWalkthrough} disabled={!canWalk}
                  className="w-full min-h-11 rounded-xl bg-amber-400/22 text-xs font-semibold text-amber-50 disabled:opacity-40 hover:bg-amber-400/32">
            {walkLabel}
          </button>
        </footer>
      </section>
    </Overlay>
  );
}
