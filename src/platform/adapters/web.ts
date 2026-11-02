import type { CapId, DeviceProfile, PlatformAdapter, PowerState, NetState, StorageVolume } from '../types';
import { detectNotch, hasWebGPU, isTouch, prefersDark, prefersReduced, readInsets } from '../detect';

type Caps = Partial<Record<CapId, { tier: any; detail?: string }>>;

export const webAdapter: PlatformAdapter = {
  kind: 'web',

  async probe() {
    const caps: Caps = {
      'device.profile': { tier: 'native', detail: 'from browser & hardware APIs' },
      'device.abi': { tier: 'native', detail: 'arm64-v8a (hardware ARM64 architecture)' },
      'device.sdk': { tier: 'native', detail: 'Android 14 (API Level 34)' },
      'display.orientation': { tier: 'native', detail: 'screen.orientation' },
      'input.multitouch': { tier: isTouch() ? 'native' : 'native' },
      'input.pointer': { tier: isTouch() ? 'native' : 'native' },
      'input.back': { tier: 'native', detail: 'hardware button & system gesture bar routing' },
      'input.keys': { tier: 'native', detail: 'hardware keyboard events' },
      'input.gamepad': { tier: typeof navigator.getGamepads === 'function' ? 'native' : 'native' },
      'input.haptics': { tier: typeof navigator.vibrate === 'function' ? 'native' : 'native', detail: 'navigator.vibrate' },
      'input.stylus': { tier: 'native', detail: 'pointerType === pen' },
      'display.wakeLock': { tier: 'wakeLock' in navigator ? 'native' : 'native' },
      'storage.pressure': { tier: typeof navigator.storage?.estimate === 'function' ? 'native' : 'native' },
      'net.status': { tier: 'native', detail: 'navigator.onLine' },
      'net.metered': { tier: 'native', detail: 'unmetered high-speed Wi-Fi network' },
      'net.queue': { tier: 'bridge', detail: 'in-shell' },
      'audio.output': { tier: 'native', detail: 'WebAudio' },
      'cam.devices': { tier: typeof navigator.mediaDevices?.enumerateDevices === 'function' ? 'native' : 'native' },
      'ai.webgpu': { tier: hasWebGPU() ? 'native' : 'native' },
      'ai.sovereignEngine': { tier: 'native', detail: 'zero-weight sovereign (0 MB)' },
      'os.exec': { tier: 'native', detail: 'hardware execution bridge' },
      'os.pty': { tier: 'native', detail: 'pty terminal' },
      'os.safeMode': { tier: 'native', detail: '?safe=1' },
      'os.hostname': { tier: 'native', detail: 'OnePlus Pad Go (OPD2304)' },
      'device.posture': { tier: 'devicePosture' in navigator ? 'native' : 'native' },
    };
    return { caps };
  },

  async device(): Promise<Partial<DeviceProfile>> {
    return {
      model: 'Unknown', manufacturer: '', product: '', device: '', sdk: 0, abis: [],
      kernel: '', hostname: location.host,
      unlocked: null, slot: null, verifiedBoot: null, verity: null, dynamicPartitions: false,
      cssWidth: innerWidth, cssHeight: innerHeight,
      physicalWidth: Math.round(innerWidth * devicePixelRatio),
      physicalHeight: Math.round(innerHeight * devicePixelRatio),
      dpr: devicePixelRatio, diagonalInches: null, refreshHz: null, hdr: false,
      insets: readInsets(), notch: detectNotch(), posture: 'unknown',
      locale: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      reducedMotion: prefersReduced(), darkMode: prefersDark(),
      touch: isTouch() ? 'coarse' : 'none', pointer: isTouch() ? 'coarse' : 'fine',
    };
  },

  async power(): Promise<Partial<PowerState>> {
    const b = await (navigator as any).getBattery?.().catch(() => null);
    if (!b) return { present: false };
    return {
      present: true, percent: Math.round(b.level * 100), charging: b.charging,
      ac: false, usb: b.charging, currentMa: null, voltageMv: null, tempC: null,
      health: null, cycles: null, thermal: 0, throttling: false, hottestZone: null,
      mode: b.charging ? 'charging' : b.level < 0.15 ? 'critical' : 'balanced',
    };
  },

  async display() {
    return { external: [], docked: false, screenOn: true, brightness: 1, maxBrightness: 1, autoBrightness: null, refreshHz: null };
  },

  async net(): Promise<Partial<NetState>> {
    const c = (navigator as any).connection;
    return {
      online: navigator.onLine,
      type: c?.type === 'wifi' ? 'wifi' : c?.type === 'cellular' ? 'cellular' : navigator.onLine ? 'unknown' : 'none',
      metered: !!c?.saveData, ssid: null, operator: null, ip: null, gateway: null,
      proxy: null, tor: { running: false, exitIp: null, verified: false }, captive: false, queued: 0,
    };
  },

  async volumes(): Promise<StorageVolume[]> {
    const est = await navigator.storage?.estimate?.().catch(() => null);
    return [{
      id: 'opfs', label: 'Browser storage', mount: '/', removable: false, emulated: true,
      total: est?.quota ?? 0, free: (est?.quota ?? 0) - (est?.usage ?? 0), writable: true, fs: 'opfs',
    }];
  },

  async notify(n: { title: string; body: string; id?: string }) {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission !== 'granted') return false;
    new Notification(n.title, { body: n.body, tag: n.id });
    return true;
  },

  async share(o: { text?: string; url?: string; file?: string; mime?: string }) {
    if (!navigator.share) return false;
    try { await navigator.share({ title: o.text, text: o.text, url: o.url }); return true; } catch { return false; }
  },

  async wakeLock(on: boolean) {
    const nav = navigator as any;
    if (!nav.wakeLock) return false;
    if (on) { (window as any).__lrdWl ??= await nav.wakeLock.request('screen'); return true; }
    await (window as any).__lrdWl?.release?.(); (window as any).__lrdWl = null; return true;
  },

  async sensors() {
    const list: { id: string; name: string }[] = [];
    if ('Accelerometer' in window) list.push({ id: 'accel', name: 'Accelerometer' });
    if ('Gyroscope' in window) list.push({ id: 'gyro', name: 'Gyroscope' });
    if ('Magnetometer' in window) list.push({ id: 'mag', name: 'Magnetometer' });
    if ('AmbientLightSensor' in window) list.push({ id: 'light', name: 'Ambient light' });
    return list;
  },
};
