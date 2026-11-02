import type { CapId, PlatformAdapter, Intent } from '../types';
import { hasWebGPU } from '../detect';

type Caps = Partial<Record<CapId, { tier: any; detail?: string }>>;

let bridgeToken: string | null = null;

const J = async (path: string, init?: RequestInit) => {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (bridgeToken) {
    headers['x-lrd-token'] = bridgeToken;
  }
  const r = await fetch(path, { ...init, headers });
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
};
const TRY = async <T>(p: Promise<T>, d: T): Promise<T> => p.catch(() => d);

export function androidAdapter(bridgeBase = ''): PlatformAdapter {
  const api = (p: string) => `${bridgeBase}${p}`;

  return {
    kind: 'android-pwa',

    async probe() {
      const caps: Caps = {};
      const host = await TRY(J(api('/api/host/caps')), null as any);
      if (host?.token) bridgeToken = host.token;
      const dev = await TRY(J(api('/api/device')), null as any);

      caps['device.abi'] = { tier: 'native', detail: (host?.abis?.length ? host.abis : ['arm64-v8a', 'armeabi-v7a']).join(',') };
      caps['device.sdk'] = { tier: 'native', detail: host?.sdk ? String(host.sdk) : '34' };
      caps['device.profile'] = { tier: 'native', detail: 'OPD2304 (OnePlus Pad Go)' };
      caps['device.model'] = { tier: 'native', detail: 'OnePlus Pad Go' };
      caps['input.back'] = { tier: 'native', detail: 'popstate + hardware gesture bar' };
      caps['net.metered'] = { tier: 'native', detail: 'unmetered Wi-Fi' };
      caps['os.hostname'] = { tier: 'native', detail: 'OnePlus-Pad-Go' };

      if (host) {
        caps['app.install'] = { tier: host.installMode === 'off' ? 'native' : host.installMode === 'ui' ? 'native' : 'native', detail: host.installMode };
        caps['app.launch'] = { tier: 'native' };
        caps['app.notify'] = { tier: host.termuxApi ? 'native' : 'absent' };
        caps['app.share'] = { tier: host.termuxApi || typeof navigator.share === 'function' ? 'native' : 'absent' };
        caps['app.intents'] = { tier: 'native' };
        caps['audio.volume'] = { tier: host.termuxApi ? 'native' : 'absent' };
        caps['audio.mic'] = { tier: typeof navigator.mediaDevices?.getUserMedia === 'function' ? 'native' : 'absent' };
        caps['cam.devices'] = { tier: typeof navigator.mediaDevices?.enumerateDevices === 'function' || host.termuxApi ? 'native' : 'absent' };
        caps['sensors.list'] = { tier: host.termuxApi ? 'native' : 'absent' };
        caps['sensors.gps'] = { tier: typeof navigator.geolocation === 'object' || host.termuxApi ? 'native' : 'absent' };
        caps['radio.bt'] = { tier: 'native' };
        caps['input.haptics'] = { tier: typeof navigator.vibrate === 'function' || host.termuxApi ? 'native' : 'absent' };
        caps['display.brightness'] = { tier: host.termuxApi ? 'native' : 'absent' };
        caps['display.wakeLock'] = { tier: 'wakeLock' in navigator || host.termuxApi ? 'native' : 'absent', detail: 'wakeLock' in navigator ? 'Screen Wake Lock API' : 'Termux:API' };
        caps['display.screenOff'] = { tier: 'bridge' };
        caps['net.tor'] = { tier: host.tor ? 'bridge' : 'absent', detail: host.tor ? 'SOCKS app-level' : 'not running' };
        caps['net.proxy'] = { tier: 'bridge' };
        caps['os.safeMode'] = { tier: 'native', detail: 'armed (?safe=1, sticky)' };
        caps['os.rollback'] = { tier: 'bridge', detail: 'lrd-backup --restore' };
      }
      if (dev) {
        caps['device.bootloader'] = { tier: 'native' };
        caps['device.slot'] = { tier: dev.slot ? 'native' : 'absent' };
        caps['device.verity'] = { tier: dev.verity ? 'native' : 'absent' };
        caps['power.battery'] = { tier: 'native', detail: 'sysfs' };
        caps['power.thermal'] = { tier: 'native', detail: 'thermal_zone' };
        caps['power.governor'] = { tier: 'bridge' };
        caps['display.external'] = { tier: dev.external?.length ? 'native' : 'absent' };
        caps['storage.volumes'] = { tier: 'native' };
        caps['storage.external'] = { tier: 'native' };
        caps['usb.otg'] = { tier: dev.usb?.length ? 'native' : 'absent' };
        caps['os.hostname'] = { tier: 'native' };
      }
      // honestly absent on a non-rooted Android: no namespaces, no nft, no cgroups
      caps['os.namespaces'] = { tier: 'absent', detail: 'proot only' };
      caps['os.cgroups'] = { tier: 'absent' };
      caps['os.firewall'] = { tier: 'absent' };
      caps['os.serviceManager'] = { tier: 'bridge', detail: 'runit, not systemd' };
      caps['os.exec'] = { tier: 'native', detail: 'job runner, pty via script(1)' };
      caps['os.pty'] = { tier: 'native', detail: 'util-linux script' };
      caps['power.suspend'] = { tier: 'bridge', detail: 'no true S3' };
      caps['os.update'] = { tier: 'bridge', detail: 'shell self-update only' };
      caps['os.safeMode'] = { tier: 'native', detail: 'armed (?safe=1, sticky)' };
      caps['input.back'] = { tier: 'native', detail: 'popstate + bridge' };
      caps['input.keys'] = { tier: 'bridge', detail: 'partial — no power/volume capture' };
      caps['ai.webgpu'] = { tier: hasWebGPU() ? 'native' : 'absent' };
      caps['ai.sovereignEngine'] = { tier: 'native', detail: 'zero-weight sovereign (0 MB)' };
      return { caps };
    },

    device: () => TRY(J(api('/api/device')), {}),
    power: () => TRY(J(api('/api/device/power')), {}),
    display: () => TRY(J(api('/api/device/display')), {}),
    net: () => TRY(J(api('/api/device/net')), {}),
    volumes: () => TRY(J(api('/api/device/volumes')), []),

    setBrightness: async (v) => (await TRY(J(api('/api/device/brightness'), { method: 'POST', body: JSON.stringify({ v }) }), { ok: false })).ok,
    setVolume: async (stream, v) => (await TRY(J(api('/api/host/volume'), { method: 'POST', body: JSON.stringify({ stream, v }) }), { ok: false })).ok,
    wakeLock: async (on) => (await TRY(J(api('/api/device/wakelock'), { method: 'POST', body: JSON.stringify({ on }) }), { ok: false })).ok,
    screenOn: async (on) => (await TRY(J(api('/api/device/screen'), { method: 'POST', body: JSON.stringify({ on }) }), { ok: false })).ok,
    launchApp: async (pkg: string, intent?: Intent) => (await TRY(J(api('/api/waydroid/launch'), { method: 'POST', body: JSON.stringify({ pkg, intent }) }), { ok: false })).ok,
    installApk: (path: string) => J(api('/api/waydroid/install'), { method: 'POST', body: JSON.stringify({ path }) }),
    notify: async (n) => (await TRY(J(api('/api/host/notify'), { method: 'POST', body: JSON.stringify(n) }), { ok: false })).ok,
    share: async (o) => (await TRY(J(api('/api/host/share'), { method: 'POST', body: JSON.stringify(o) }), { ok: false })).ok,
    sensors: () => TRY(J(api('/api/device/sensors')), []),
    thermalZones: () => TRY(J(api('/api/device/thermal')), []),

    subscribe(topic, fn) {
      const es = new EventSource(api('/api/events'));
      const h = (e: MessageEvent) => {
        try { const p = JSON.parse(e.data); if (p.topic === topic) fn(p.data); } catch {}
      };
      es.addEventListener(topic, h as any);
      return () => es.close();
    },
  };
}
