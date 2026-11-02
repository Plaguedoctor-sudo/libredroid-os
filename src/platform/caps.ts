import type { Cap, CapId, Tier } from './types';

const TIER_VALUE: Record<Tier, number> = {
  kernel: 1, native: 1, bridge: 0.85, emulated: 0.5, absent: 0,
};

/** Weight = how much this capability matters for calling yourself an OS. */
const WEIGHT: Partial<Record<CapId, number>> = {
  'device.profile': 5, 'device.abi': 4, 'device.sdk': 3, 'device.model': 2,
  'device.bootloader': 3, 'device.slot': 3, 'device.verity': 3, 'device.posture': 2,
  'power.battery': 4, 'power.thermal': 3, 'power.governor': 3, 'power.suspend': 4,
  'display.brightness': 3, 'display.refresh': 3, 'display.external': 2,
  'display.wakeLock': 4, 'display.orientation': 2, 'display.screenOff': 3,
  'input.back': 5, 'input.keys': 3, 'input.gamepad': 1, 'input.stylus': 1,
  'input.multitouch': 2, 'input.pointer': 1, 'input.haptics': 2,
  'storage.volumes': 4, 'storage.external': 3, 'storage.permissions': 3, 'storage.pressure': 2,
  'net.status': 4, 'net.metered': 2, 'net.proxy': 2, 'net.tor': 4, 'net.queue': 2,
  'audio.output': 3, 'audio.volume': 2, 'audio.mic': 2,
  'cam.devices': 2, 'sensors.list': 2, 'sensors.gps': 2, 'radio.bt': 2, 'radio.nfc': 1, 'usb.otg': 1,
  'app.install': 4, 'app.launch': 4, 'app.notify': 3, 'app.share': 3, 'app.intents': 3,
  'os.serviceManager': 4, 'os.namespaces': 4, 'os.cgroups': 3, 'os.firewall': 3,
  'os.update': 3, 'os.rollback': 3, 'os.safeMode': 5, 'os.hostname': 1,
  'os.exec': 4, 'os.pty': 3,
  'ai.webgpu': 3, 'ai.sovereignEngine': 4,
};

const WHY: Partial<Record<CapId, string>> = {
  'input.back': 'without a hardware back route the OS traps the user',
  'display.wakeLock': 'without a wake lock the OS sleeps mid-task',
  'os.safeMode': 'without safe mode a bad adapter is unrecoverable on device',
  'os.namespaces': 'without netns the "domains" are just directories',
  'os.firewall': 'without nft the Tor domain cannot be enforced',
  'net.tor': 'without a verified Tor exit the privacy claim is decoration',
  'power.suspend': 'without suspend the device drains in a pocket',
  'device.slot': 'without slot awareness an update can brick you',
  'os.rollback': 'without rollback an update is one-way',
  'app.install': 'without install the store is a browser',
  'storage.volumes': 'without volumes files are a fixed directory',
  'ai.sovereignEngine': 'zero-weight sovereign intent engine (0 MB weights, zero battery penalty)',
};

class CapRegistry {
  private caps = new Map<CapId, Cap>();
  private listeners = new Set<(c: Map<CapId, Cap>) => void>();

  replace(caps: Partial<Record<CapId, Omit<Cap, 'id'>>>) {
    this.caps.clear();
    for (const [id, c] of Object.entries(caps)) {
      this.caps.set(id as CapId, { id: id as CapId, tier: c!.tier, detail: c!.detail, why: WHY[id as CapId] });
    }
    for (const l of this.listeners) l(this.caps);
  }

  set(id: CapId, tier: Tier, detail?: string) {
    this.caps.set(id, { id, tier, detail, why: WHY[id] });
    for (const l of this.listeners) l(this.caps);
  }

  get(id: CapId): Cap {
    return this.caps.get(id) ?? { id, tier: 'absent', why: WHY[id] };
  }
  has(id: CapId) { return this.get(id).tier !== 'absent'; }
  tier(id: CapId): Tier { return this.get(id).tier; }
  /** true when present but not real */
  degraded(id: CapId) {
    const t = this.tier(id);
    return t === 'emulated' || t === 'bridge';
  }
  all() { return [...this.caps.values()]; }
  subscribe(fn: (c: Map<CapId, Cap>) => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  /** 0..100 */
  score() {
    let got = 0, max = 0;
    for (const [id, w] of Object.entries(WEIGHT) as [CapId, number][]) {
      max += w;
      got += w * TIER_VALUE[this.get(id).tier];
    }
    return max ? Math.round((got / max) * 100) : 0;
  }

  /** capabilities that are absent and load-bearing */
  blockers() {
    return (Object.entries(WEIGHT) as [CapId, number][])
      .filter(([id, w]) => w >= 3 && this.get(id).tier === 'absent')
      .map(([id]) => ({ id, why: WHY[id] ?? id }));
  }

  /** present but faked — the honesty list */
  fakes() {
    return this.all().filter((c) => c.tier === 'emulated');
  }

  verdict(): 'bare-metal' | 'hybrid' | 'parasite' | 'browser' {
    const s = this.score();
    if (s >= 85 && this.blockers().length === 0) return 'bare-metal';
    if (s >= 70) return 'hybrid';
    if (s >= 45) return 'parasite';
    return 'browser';
  }

  /** serialisable, for the readiness report / bug reports */
  report() {
    return {
      score: this.score(), verdict: this.verdict(),
      blockers: this.blockers(), fakes: this.fakes(),
      caps: this.all().sort((a, b) => (WEIGHT[b.id] ?? 0) - (WEIGHT[a.id] ?? 0)),
    };
  }
}

export const caps = new CapRegistry();
