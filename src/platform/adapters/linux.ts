import type { CapId, PlatformAdapter, Intent } from '../types';
import { hasWebGPU } from '../detect';

type Caps = Partial<Record<CapId, { tier: any; detail?: string }>>;

let bridgeToken: string | null = null;

const J = async (p: string, init?: RequestInit) => {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (bridgeToken) {
    headers['x-lrd-token'] = bridgeToken;
  }
  const r = await fetch(p, { ...init, headers });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
};
const TRY = async <T>(p: Promise<T>, d: T) => p.catch(() => d);

export function linuxAdapter(): PlatformAdapter {
  return {
    kind: 'linux-kiosk',
    async probe() {
      const host = await TRY(J('/api/host/caps'), null as any);
      if (host?.token) bridgeToken = host.token;
      const sys = await TRY(J('/api/system/caps'), null as any);
      const caps: Caps = { 'os.safeMode': { tier: 'native' } };
      if (host) {
        caps['device.profile'] = { tier: 'kernel', detail: 'devicetree' };
        caps['device.model'] = { tier: 'kernel' };
        caps['os.hostname'] = { tier: 'native' };
      }
      if (sys) {
        caps['os.namespaces'] = { tier: sys.netns ? 'kernel' : 'absent', detail: sys.source === 'adapt.json' ? 'verified at boot' : 'assumed' };
        caps['os.cgroups'] = { tier: sys.cgroup2 ? 'kernel' : 'absent', detail: sys.cgroup2 ? 'cgroup v2' : 'cgroup v2 absent' };
        caps['os.firewall'] = {
          tier: sys?.security?.score >= 90 ? 'kernel' : sys?.security?.score >= 60 ? 'native' : sys?.nft ? 'kernel' : 'absent',
          detail: sys?.security?.score != null ? `audit ${sys?.security?.score}/100 ${sys?.security?.verdict}` : (sys?.nft ? 'nft REDIRECT verified' : 'no NFT_REDIRECT')
        };
        caps['os.serviceManager'] = { tier: 'native', detail: 'systemd' };
        caps['os.update'] = {
          tier: sys?.rollback?.enforcement === 'enforced' ? 'kernel' : sys?.sysupdate ? 'native' : 'native',
          detail: sys?.sysupdate ? 'A/B sysupdate' : ''
        };
        caps['os.rollback'] = { tier: sys.ab ? 'kernel' : 'bridge', detail: sys.ab ? 'A/B slots' : 'snapshot' };
        caps['device.slot'] = { tier: sys.ab ? 'kernel' : 'absent', detail: sys.slot ?? '' };
        const verityInfo = (sys as Record<string, any>).verity;
        caps['device.verity'] = { 
          tier: sys?.boot?.level >= 3 ? 'kernel' : sys?.boot?.level >= 1 ? 'native' : (verityInfo?.strength === 'full-chain' || verityInfo === true) ? 'kernel' : verityInfo?.active ? 'native' : 'absent',
          detail: verityInfo?.strength ?? (verityInfo ? 'dm-verity active' : 'unverified rootfs')
        };
        caps['net.tor'] = { tier: sys.nft ? 'kernel' : 'bridge', detail: sys.nft ? 'REDIRECT enforced' : 'proxy only' };
        caps['net.proxy'] = { tier: 'native' };
        caps['display.brightness'] = { tier: sys.backlight ? 'native' : 'absent' };
        caps['display.external'] = { tier: sys.drm ? 'kernel' : 'absent' };
        caps['display.refresh'] = { tier: sys.drm ? 'kernel' : 'absent' };
        caps['display.wakeLock'] = { tier: sys.logind ? 'native' : 'absent' };
        caps['power.battery'] = { tier: sys.powerSupply ? 'native' : 'absent' };
        caps['power.thermal'] = { tier: sys.thermal ? 'native' : 'absent' };
        caps['power.suspend'] = { tier: sys.logind ? 'kernel' : 'absent', detail: 'systemd-suspend' };
        caps['power.governor'] = { tier: sys.cpufreq ? 'kernel' : 'absent' };
        caps['storage.volumes'] = { tier: 'native', detail: 'udisks' };
        caps['storage.external'] = { tier: 'native' };
        caps['input.back'] = { tier: 'native' };
        caps['input.keys'] = { tier: 'kernel', detail: 'evdev' };
        caps['input.haptics'] = { tier: sys.haptics ? 'native' : 'absent' };
        caps['audio.output'] = { tier: sys.pipewire ? 'native' : 'absent' };
        caps['audio.volume'] = { tier: sys.pipewire ? 'native' : 'absent' };
        caps['radio.bt'] = { tier: sys.bluez ? 'native' : 'absent' };
        caps['radio.nfc'] = { tier: sys.nfc ? 'native' : 'absent' };
        caps['usb.otg'] = { tier: 'kernel' };
      }
      caps['app.install'] = { tier: 'native', detail: 'waydroid' };
      caps['app.launch'] = { tier: 'native' };
      caps['os.exec'] = { tier: 'native', detail: 'systemd-run / direct spawn' };
      caps['os.pty'] = { tier: 'kernel', detail: 'openpty' };
      caps['ai.webgpu'] = { tier: hasWebGPU() ? 'native' : 'absent' };
      caps['ai.sovereignEngine'] = { tier: 'native', detail: 'zero-weight sovereign (0 MB)' };
      return { caps };
    },
    device: () => TRY(J('/api/device'), {}),
    power: () => TRY(J('/api/device/power'), {}),
    display: () => TRY(J('/api/device/display'), {}),
    net: () => TRY(J('/api/device/net'), {}),
    volumes: () => TRY(J('/api/device/volumes'), []),
    setBrightness: async (v) => (await TRY(J('/api/device/brightness', { method: 'POST', body: JSON.stringify({ v }) }), { ok: false })).ok,
    setVolume: async (s, v) => (await TRY(J('/api/device/volume', { method: 'POST', body: JSON.stringify({ stream: s, v }) }), { ok: false })).ok,
    wakeLock: async (on) => (await TRY(J('/api/device/wakelock', { method: 'POST', body: JSON.stringify({ on }) }), { ok: false })).ok,
    screenOn: async (on) => (await TRY(J('/api/device/screen', { method: 'POST', body: JSON.stringify({ on }) }), { ok: false })).ok,
    launchApp: async (pkg: string, intent?: Intent) => (await TRY(J('/api/waydroid/launch', { method: 'POST', body: JSON.stringify({ pkg, intent }) }), { ok: false })).ok,
    installApk: (path: string) => J('/api/waydroid/install', { method: 'POST', body: JSON.stringify({ path }) }),
    notify: async (n: { title: string; body: string; id?: string }) => (await TRY(J('/api/device/notify', { method: 'POST', body: JSON.stringify(n) }), { ok: false })).ok,
    share: async (o: { text?: string; url?: string; file?: string; mime?: string }) => (await TRY(J('/api/device/share', { method: 'POST', body: JSON.stringify(o) }), { ok: false })).ok,
    sensors: () => TRY(J('/api/device/sensors'), []),
    thermalZones: () => TRY(J('/api/device/thermal'), []),
    subscribe(topic, fn) {
      const es = new EventSource('/api/events');
      const h = (e: MessageEvent) => { try { const p = JSON.parse(e.data); if (p.topic === topic) fn(p.data); } catch {} };
      es.addEventListener(topic, h as any);
      return () => es.close();
    },
  };
}
