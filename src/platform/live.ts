import { onEvent, streamHealthy, onStreamState, startStream, watchStream } from './sse';

let started = false;
export function ensureStream() {
  if (started) return;
  started = true;
  startStream();
  watchStream();
}

/**
 * @param topic   SSE topic
 * @param refresh full re-read (used on connect, on topic event, and on the slow fallback)
 * @param fastMs  poll interval while the stream is dead
 * @param slowMs  poll interval while the stream is healthy (0 = none)
 */
export function subscribeLive(
  topic: string,
  refresh: () => any | Promise<any>,
  { fastMs = 15000, slowMs = 0, immediate = true }: { fastMs?: number; slowMs?: number; immediate?: boolean } = {},
) {
  ensureStream();
  let poll: number | null = null;

  const arm = () => {
    if (poll !== null) { clearInterval(poll); poll = null; }
    const ms = streamHealthy() ? slowMs : fastMs;
    if (ms > 0) poll = window.setInterval(refresh, ms);
  };

  const offEvent = onEvent((t) => { if (t === topic) refresh(); });
  const offState = onStreamState((s) => {
    // on every transition to healthy, force a full resync — we may have missed frames
    if (s.ok) refresh();
    arm();
  });

  if (immediate) refresh();
  arm();

  return () => { offEvent(); offState(); if (poll !== null) clearInterval(poll); };
}
