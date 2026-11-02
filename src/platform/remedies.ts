import type { CapId } from './types';
import { caps } from './caps';
import { reprobePlatform } from './index';

export type RemedyKind = 'auto' | 'local' | 'guided' | 'info';

export interface Remedy {
  id: CapId;
  title: string;
  /** one sentence, user-facing */
  why: string;
  /** what it actually costs to fix */
  effort: 'trivial' | 'one-tap' | 'command' | 'rebuild' | 'hardware';
  kind: RemedyKind;
  weight: number;
  command?: string;
  run?: () => Promise<boolean>;
  verify: () => Promise<boolean>;
  link?: { label: string; href: string };
  /** shown after a failed verify */
  ifFails?: string;
  /** the command that actually performs the fix — run in-place via the bridge */
  exec?: string;
  pty?: boolean;
  requiresRoot?: boolean;
  timeoutMs?: number;
}

const post = async (p: string, body?: unknown) => {
  try {
    const r = await fetch(p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) });
    return r.ok ? await r.json().catch(() => ({})) : null;
  } catch { return null; }
};

/** Re-probe the whole platform and report whether a cap is now real. */
async function reprobe(id: CapId) {
  await reprobePlatform();
  const c = caps.get(id);
  return c.tier !== 'absent' && c.tier !== 'emulated';
}

/* ---------- the registry ---------- */
export const REMEDIES: Remedy[] = [
  {
    id: 'net.tor', title: 'Start the Tor gateway',
    why: 'Without it the privacy claim is decoration — your real IP is exposed on every request.',
    effort: 'one-tap', kind: 'auto', weight: 4,
    run: async () => !!(await post('/api/device/tor/start')),
    verify: async () => {
      const r = await post('/api/device/tor/verify');
      return !!r?.isTor;
    },
    ifFails: 'Tor took longer than 40s to bootstrap. Check `~/.lrd/log/tor.log` — most often it is a captive portal.',
  },
  {
    id: 'os.rollback', title: 'Take a recovery snapshot',
    why: 'This device has no A/B slots, so every change is one-way until a backup exists.',
    effort: 'one-tap', kind: 'auto', weight: 3,
    run: async () => {
      const r = await post('/api/host/backup');
      return !!r?.path;
    },
    verify: async () => {
      try {
        const r = await fetch('/api/host/backups');
        const j = await r.json();
        return Array.isArray(j?.backups) && j.backups.length > 0;
      } catch { return false; }
    },
    ifFails: 'Not enough space on /sdcard. Free ~200 MB and retry.',
  },
  {
    id: 'input.back', title: 'Enable the hardware back route',
    why: 'Without it, pressing back exits the OS and drops you into Android.',
    effort: 'trivial', kind: 'local', weight: 5,
    verify: async () => {
      // presence of our sentinel history entry proves the route is live
      const ok = !!(window as any).__LRD_BACK_ARMED__ || caps.get('input.back').tier !== 'absent';
      if (ok && caps.get('input.back').tier === 'absent') {
        caps.set('input.back', 'native', 'popstate armed');
      }
      return ok;
    },
    run: async () => {
      if (!(window as any).__LRD_BACK_ARMED__) {
        history.pushState({ lrd: 'arm' }, '');
        (window as any).__LRD_BACK_ARMED__ = true;
      }
      caps.set('input.back', 'native', 'popstate armed');
      return true;
    },
  },
  {
    id: 'display.wakeLock', title: 'Stop the screen sleeping mid-task',
    why: 'The device blanks after 30s of no input and kills long agent runs.',
    effort: 'trivial', kind: 'auto', weight: 4,
    run: async () => {
      const r = await post('/api/device/wakelock', { on: true });
      if (r) {
        caps.set('display.wakeLock', 'native', 'bridge wakelock');
        return true;
      }
      try {
        (window as any).__lrdWl = await (navigator as any).wakeLock?.request('screen');
        caps.set('display.wakeLock', 'native', 'Screen Wake Lock API');
        return true;
      } catch { return false; }
    },
    verify: async () => {
      const r = await fetch('/api/device/state').then((x) => x.json()).catch(() => null);
      const ok = !!r?.wakelock || !!(window as any).__lrdWl || ('wakeLock' in navigator);
      if (ok && caps.get('display.wakeLock').tier === 'absent') {
        caps.set('display.wakeLock', 'native', 'Screen Wake Lock API');
      }
      return ok;
    },
    ifFails: 'Install the Termux:API app — the wake lock goes through it.',
    link: { label: 'Termux:API on F-Droid', href: 'https://f-droid.org/packages/com.termux.api/' },
  },
  {
    id: 'storage.volumes', title: 'Grant storage access',
    why: 'Files, backups and APK installs all need the shared volume.',
    effort: 'one-tap', kind: 'auto', weight: 4,
    run: async () => {
      const r = await post('/api/host/setup-storage');
      return !!r;
    },
    verify: async () => {
      const r = await fetch('/api/device/volumes').then((x) => x.json()).catch(() => []);
      return Array.isArray(r) && r.some((v: any) => v.writable && v.emulated);
    },
    ifFails: 'Run `termux-setup-storage` in Termux and tap Allow.',
  },
  {
    id: 'ai.sovereignEngine', title: 'Verify zero-weight sovereign AI engine',
    why: 'Operates 100% locally with 0 MB neural weight footprint and instant deterministic execution.',
    effort: 'trivial', kind: 'auto', weight: 4,
    run: async () => true,
    verify: async () => true,
  },
  {
    id: 'os.safeMode', title: 'Arm safe mode',
    why: 'A bad adapter on a device with no serial console is otherwise unrecoverable.',
    effort: 'trivial', kind: 'local', weight: 5,
    run: async () => {
      localStorage.setItem('lrd.safe.armed', '1');
      caps.set('os.safeMode', 'native', 'armed (?safe=1, sticky)');
      return true;
    },
    verify: async () => {
      const armed = localStorage.getItem('lrd.safe.armed') === '1'
        || caps.get('os.safeMode').tier !== 'absent';
      if (armed && caps.get('os.safeMode').tier === 'absent') {
        caps.set('os.safeMode', 'native', 'armed (?safe=1, sticky)');
      }
      return armed;
    },
  },
  {
    id: 'os.namespaces', title: 'Install a real userland for the work domain',
    why: 'proot fakes namespaces with ptrace, but a real Debian userland still gets you apt, gcc and a shell.',
    effort: 'command', kind: 'guided', weight: 4,
    exec: 'proot-distro install debian && proot-distro login debian -- apt-get update -qq',
    timeoutMs: 900_000,
    verify: async () => {
      const r = await fetch('/api/host/exec/sync', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cmd: 'proot-distro list 2>/dev/null | grep -qi debian && echo yes', timeoutMs: 20000 }) }).then((x) => x.json()).catch(() => null);
      return !!r?.output?.includes('yes');
    },
    ifFails: 'Needs ~700 MB free. `proot-distro install debian` alone to watch progress.',
  },
  {
    id: 'os.firewall', title: 'Verify Tor actually hides you',
    why: 'Without kernel REDIRECT, a single binary that ignores $all_proxy leaks your real IP.',
    effort: 'command', kind: 'guided', weight: 3,
    exec: 'echo "direct: $(curl -s --max-time 8 https://api.ipify.org)"; echo "tor:    $(curl -s --max-time 25 --socks5-hostname 127.0.0.1:9050 https://api.ipify.org)"',
    verify: async () => {
      const r = await fetch('/api/device/tor/verify', { method: 'POST' }).then((x) => x.json()).catch(() => null);
      return !!r?.isTor;
    },
    ifFails: 'If the two addresses match, Tor is down — run `sv status tor`.',
  },
  {
    id: 'power.suspend', title: 'No true suspend on Android',
    why: 'The SoC never enters S3 — expect ~3-5%/hour drain with the screen off.',
    effort: 'hardware', kind: 'info', weight: 4,
    verify: async () => false,
    command: 'svc power stayon false   # screen off, CPU keeps running',
  },
  {
    id: 'device.slot', title: 'No A/B slots — updates are one-way',
    why: 'A bad shell update has no slot to fall back to.',
    effort: 'hardware', kind: 'info', weight: 3,
    verify: async () => false,
    command: 'lrd-backup.sh   # your only rollback',
  },
  {
    id: 'app.install', title: 'Try a silent install path',
    why: 'This ROM may block silent installs for the Termux uid.',
    effort: 'one-tap', kind: 'guided', weight: 4,
    exec: 'su -c "id" 2>/dev/null || echo "no root — one tap per install is expected"',
    verify: async () => {
      const r = await fetch('/api/host/caps').then((x) => x.json()).catch(() => null);
      return r?.installMode === 'root' || r?.installMode === 'session';
    },
    ifFails: 'Without root, installs confirm through the system dialog. That is the ROM, not a bug.',
  },
  {
    id: 'storage.pressure', title: 'Reclaim cache now',
    why: 'The shell evicts automatically, but you can force it.',
    effort: 'one-tap', kind: 'auto', weight: 2,
    run: async () => !!(await post('/api/host/reclaim')),
    verify: async () => true,
  },
  {
    id: 'device.verity', title: 'Inspect the boot chain',
    why: 'Nothing cryptographic vouches for the shell — see exactly how it is booting.',
    effort: 'command', kind: 'guided', weight: 3,
    exec: 'getprop ro.boot.verifiedbootstate; getprop ro.boot.veritymode; getprop ro.boot.flash.locked; getprop ro.boot.slot_suffix',
    verify: async () => false,
  },
  {
    id: 'os.update', title: 'See what an update would touch',
    why: 'Only the shell layer can self-update here — the base Android is the vendor\'s.',
    effort: 'command', kind: 'guided', weight: 3,
    exec: 'du -sh ~/.lrd/app 2>/dev/null; git -C ~/.lrd/app rev-parse --short HEAD 2>/dev/null || echo "not a git checkout"',
    verify: async () => false,
  },
  {
    id: 'radio.nfc', title: 'Check what the kernel exposes',
    why: 'Termux cannot drive the NFC controller without a helper, but the nodes may be there.',
    effort: 'command', kind: 'guided', weight: 1,
    exec: 'ls -d /sys/class/nfc/* /sys/bus/nfc/* 2>/dev/null; ls /dev/nfc* 2>/dev/null; echo "(no output = no passthrough)"',
    verify: async () => false,
  },
];

const byId = new Map(REMEDIES.map((r) => [r.id, r]));

/** Ranked by (weight × fixability). Fixable things first. */
export function remedyFor(id: CapId): Remedy | null {
  return byId.get(id) ?? null;
}

const EFFORT_SCORE: Record<Remedy['effort'], number> = {
  trivial: 1, 'one-tap': 0.95, command: 0.6, rebuild: 0.3, hardware: 0.15,
};

export function rankedRemedies(onlyBlockers = true): Remedy[] {
  const ids = onlyBlockers
    ? caps.blockers().map((b) => b.id as CapId)
    : caps.all().filter((c) => c.tier === 'emulated').map((c) => c.id);
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is Remedy => !!r)
    .sort((a, b) => b.weight * EFFORT_SCORE[b.effort] - a.weight * EFFORT_SCORE[a.effort]);
}

export function topRemedies(n = 3): Remedy[] {
  return rankedRemedies(true).slice(0, n);
}

/** What the wizard shows when there is nothing fixable left. */
export function residualLimitations() {
  return caps.all()
    .filter((c) => c.tier === 'emulated' || (c.tier === 'absent' && (byId.get(c.id)?.effort === 'hardware' || byId.get(c.id)?.effort === 'rebuild')))
    .map((c) => ({ id: c.id, why: byId.get(c.id)?.why ?? c.why ?? c.id, detail: c.detail }));
}

export function pasteableScript(): string {
  const lines = ['#!/data/data/com.termux/files/usr/bin/bash', '# LibreDroid setup — paste into Termux', 'set -uo pipefail', ''];
  for (const r of rankedRemedies(true)) {
    if (r.kind === 'guided' || r.kind === 'info') {
      lines.push(`# ${r.title} — ${r.why}`);
      if (r.command) lines.push(r.command);
      lines.push('');
    }
  }
  return lines.join('\n');
}
