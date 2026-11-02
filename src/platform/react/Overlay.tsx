import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";
import "../../styles/overlay.css";

const ROOT_ID = "lrd-overlay-root";

export function ensureHost() {
  let el = document.getElementById(ROOT_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = ROOT_ID;
    // must be a body child: any transformed ancestor redefines position: fixed
    document.body.appendChild(el);
  } else if (el.parentElement !== document.body) {
    document.body.appendChild(el);
  }
  return el;
}

export function runDomCheck() {
  const failures: string[] = [];
  const overlayRoot = document.getElementById(ROOT_ID);
  if (!overlayRoot || overlayRoot.parentElement !== document.body) {
    failures.push("overlay root is not a direct child of document.body");
  }

  const dock = document.querySelector<HTMLElement>("[data-lrd-dock]");
  if (!dock) {
    failures.push("no [data-lrd-dock] marker — dock inset will fall back to the floor");
  }

  const panel = document.querySelector<HTMLElement>(".lrd-panel");
  if (panel && dock) {
    const pb = panel.getBoundingClientRect();
    const db = dock.getBoundingClientRect();
    if (pb.bottom > db.top + 1) {
      failures.push(`panel bottom ${pb.bottom} overlaps dock top ${db.top}`);
    }
  }

  const clipped = panel?.querySelectorAll<HTMLElement>(".lrd-row__actions button");
  clipped?.forEach((btn) => {
    if (btn.getBoundingClientRect().width < btn.scrollWidth - 1) {
      failures.push(`row action clipped: ${btn.textContent?.trim()}`);
    }
  });

  const dockButtons = document.querySelectorAll<HTMLElement>("[data-lrd-dock] button");
  dockButtons.forEach((btn) => {
    const r = btn.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (hit && !btn.contains(hit)) {
      failures.push(`dock icon blocked by ${(hit as HTMLElement).className || hit.tagName}`);
    }
  });

  // the overlay root must not be interactive when nothing is open
  const rootEl = document.getElementById(ROOT_ID);
  if (rootEl && rootEl.childElementCount === 0 &&
      getComputedStyle(rootEl).pointerEvents !== "none") {
    failures.push("empty overlay root is hit-testable");
  }

  const ok = failures.length === 0;
  (window as any).__lrdOverlayOk = (overlayRoot?.parentElement === document.body);
  (window as any).__lrdDomFailures = failures;

  try {
    fetch('/api/shell/dom-check', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        overlayRootIsBodyChild: overlayRoot?.parentElement === document.body,
        failures,
        dockMarkerPresent: !!dock,
        noOverlap: !panel || !dock || (panel.getBoundingClientRect().bottom <= dock.getBoundingClientRect().top + 1),
        noClipping: !clipped || Array.from(clipped).every((b) => b.getBoundingClientRect().width >= b.scrollWidth - 1),
        dockAccessible: dockButtons.length === 0 || Array.from(dockButtons).every((btn) => {
          const r = btn.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return true;
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return !hit || btn.contains(hit);
        }),
      }),
    }).catch(() => {});
  } catch {}

  return { ok, failures };
}

export function Overlay({ children, open = true }: { children: ReactNode; open?: boolean }) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const h = ensureHost();
    setHost(h);
    runDomCheck();
    const t = setTimeout(runDomCheck, 600);
    return () => clearTimeout(t);
  }, []);

  if (!host || !open || !children) return null;
  return createPortal(children, host);
}

export const OverlayHost = Overlay;
