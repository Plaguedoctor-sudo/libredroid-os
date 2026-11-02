import { caps } from './caps';
import { device } from './device';
import { currentAdapter } from './index';

export interface ReadinessReport {
  score: number;
  verdict: ReturnType<typeof caps.verdict>;
  headline: string;
  blockers: { id: string; why: string }[];
  fakes: { id: string; detail?: string }[];
  host: string;
  device: { model: string; sdk: number; abis: string[]; slot: string | null; unlocked: boolean | null };
  tiers: Record<string, number>;
  recommendations: string[];
}

const RECS: Record<string, string> = {
  'os.namespaces': 'Boot the Debian/nspawn image for real namespace isolation, or accept proot.',
  'os.firewall': 'Enable nft REDIRECT on a kernel build with CONFIG_NFT_REDIRECT.',
  'net.tor': 'Start the tor service and verify the exit IP differs from the direct IP.',
  'power.suspend': 'Without true suspend the device drains ~4%/h in a pocket.',
  'device.slot': 'No A/B slots — every update is one-way. Keep lrd-backup running.',
  'os.rollback': 'No rollback path. Snapshot state before each update.',
  'display.wakeLock': 'Screen will sleep mid-task. Install Termux:API or enable the Screen Wake Lock API.',
  'input.back': 'Hardware back will exit the OS. Add the popstate handler.',
  'app.install': 'Store installs will need a manual tap per package.',
  'storage.volumes': 'Files are a single fixed directory — no SD/USB.',
  'ai.sovereignEngine': 'Zero-weight sovereign intent engine active (0 MB RAM overhead).',
  'os.safeMode': 'A bad adapter is unrecoverable on device without safe mode.',
};

export function readiness(): ReadinessReport {
  const d = device();
  const r = caps.report();
  const tiers: Record<string, number> = {};
  for (const c of r.caps) tiers[c.id] = { kernel: 1, native: 0.95, bridge: 0.6, emulated: 0.3, absent: 0 }[c.tier] ?? 0;

  const headline =
    r.verdict === 'bare-metal' ? 'This device can run LibreDroid as an OS.'
    : r.verdict === 'hybrid' ? 'Mostly real. A few subsystems are userspace-only.'
    : r.verdict === 'parasite' ? 'Running as a guest on Android. The host is still in charge.'
    : 'Browser only — nothing below the page is yours.';

  const recommendations = [
    ...r.blockers.map((b) => RECS[b.id] ?? `Missing: ${b.id}`),
    ...r.fakes.filter((f) => f.tier === 'emulated').map((f) => `Faked: ${f.id}${f.detail ? ` (${f.detail})` : ''} — treat as unreliable.`),
  ];

  return {
    score: r.score, verdict: r.verdict, headline,
    blockers: r.blockers, fakes: r.fakes.map((f) => ({ id: f.id, detail: f.detail })),
    host: currentAdapter().kind,
    device: { model: d.model, sdk: d.sdk, abis: d.abis, slot: d.slot, unlocked: d.unlocked },
    tiers, recommendations,
  };
}

/** Compact one-liner for the status bar. */
export function readinessBadge() {
  const r = caps.report();
  const n = r.blockers.length;
  return {
    label: r.verdict.replace('-', ' '),
    score: r.score,
    warn: n > 0 || r.fakes.length > 0,
    title: n ? `${n} blocking gap${n > 1 ? 's' : ''}` : r.fakes.length ? `${r.fakes.length} faked capability` : 'all green',
  };
}
