/**
 * LibreDroid platform layer — types.
 *
 * Rule: nothing in the shell may claim a hardware capability directly.
 * It asks the capability registry, which knows the *tier* of what it found.
 */

export type HostKind =
  | 'web'            // plain browser, no bridge
  | 'android-pwa'    // Termux + Chrome PWA (I1)
  | 'android-native' // Capacitor shell
  | 'linux-kiosk'    // cage/pmOS/Droidian fullscreen
  | 'linux-desktop'; // cage on a dev box / QEMU

/** How real a capability is. This is the anti-lying mechanism. */
export type Tier =
  | 'kernel'   // enforced by the kernel (netns, cgroup, drm)
  | 'native'   // real OS API (pm, sysfs, systemd)
  | 'bridge'   // our own daemon, honest but userspace
  | 'emulated' // faked in JS — works until it doesn't
  | 'absent';

export type CapId =
  // identity / boot
  | 'device.profile' | 'device.abi' | 'device.sdk' | 'device.model'
  | 'device.bootloader' | 'device.slot' | 'device.verity' | 'device.posture'
  // power
  | 'power.battery' | 'power.thermal' | 'power.governor' | 'power.suspend'
  // display
  | 'display.brightness' | 'display.refresh' | 'display.external'
  | 'display.wakeLock' | 'display.orientation' | 'display.screenOff'
  // input
  | 'input.back' | 'input.keys' | 'input.gamepad' | 'input.stylus'
  | 'input.multitouch' | 'input.pointer' | 'input.haptics'
  // storage
  | 'storage.volumes' | 'storage.external' | 'storage.permissions' | 'storage.pressure'
  // network
  | 'net.status' | 'net.metered' | 'net.proxy' | 'net.tor' | 'net.queue'
  // media / io
  | 'audio.output' | 'audio.volume' | 'audio.mic'
  | 'cam.devices' | 'sensors.list' | 'sensors.gps' | 'radio.bt' | 'radio.nfc' | 'usb.otg'
  // apps
  | 'app.install' | 'app.launch' | 'app.notify' | 'app.share' | 'app.intents'
  // os
  | 'os.serviceManager' | 'os.namespaces' | 'os.cgroups' | 'os.firewall'
  | 'os.update' | 'os.rollback' | 'os.safeMode' | 'os.hostname'
  | 'os.exec' | 'os.pty'
  // ai
  | 'ai.webgpu' | 'ai.sovereignEngine';

export interface Cap {
  id: CapId;
  tier: Tier;
  detail?: string;
  /** one line for the readiness report */
  why?: string;
}

export interface DeviceProfile {
  model: string;
  manufacturer: string;
  product: string;
  device: string;
  sdk: number;
  abis: string[];
  kernel: string;
  hostname: string;
  /** boot chain */
  unlocked: boolean | null;
  slot: string | null;
  verifiedBoot: string | null;
  verity: string | null;
  dynamicPartitions: boolean;
  /** panel */
  cssWidth: number;
  cssHeight: number;
  physicalWidth: number;
  physicalHeight: number;
  dpr: number;
  diagonalInches: number | null;
  refreshHz: number | null;
  hdr: boolean;
  /** insets, in CSS px, read live from env() */
  insets: { top: number; right: number; bottom: number; left: number };
  notch: boolean;
  posture: 'flat' | 'half-open' | 'folded' | 'unknown';
  /** runtime */
  locale: string;
  timezone: string;
  reducedMotion: boolean;
  darkMode: boolean;
  touch: 'none' | 'coarse' | 'fine';
  pointer: 'none' | 'coarse' | 'fine';
}

export interface PowerState {
  present: boolean;
  percent: number;
  charging: boolean;
  ac: boolean;
  usb: boolean;
  currentMa: number | null;
  voltageMv: number | null;
  tempC: number | null;
  health: string | null;
  cycles: number | null;
  /** 0..1 thermal pressure across all zones */
  thermal: number;
  throttling: boolean;
  hottestZone: { name: string; c: number } | null;
  /** derived */
  mode: 'performance' | 'balanced' | 'saver' | 'critical' | 'charging';
}

export interface DisplayState {
  brightness: number;       // 0..1 of max
  maxBrightness: number;
  autoBrightness: boolean | null;
  refreshHz: number | null;
  external: { name: string; connected: boolean; modes: string[] }[];
  docked: boolean;
  screenOn: boolean;
}

export interface NetState {
  online: boolean;
  type: 'none' | 'wifi' | 'cellular' | 'ethernet' | 'vpn' | 'bt' | 'unknown';
  metered: boolean;
  ssid: string | null;
  operator: string | null;
  ip: string | null;
  gateway: string | null;
  proxy: string | null;
  tor: { running: boolean; exitIp: string | null; verified: boolean };
  captive: boolean;
  queued: number;
}

export interface StorageVolume {
  id: string;
  label: string;
  mount: string;
  removable: boolean;
  emulated: boolean;
  total: number;
  free: number;
  writable: boolean;
  fs: string;
}

export interface Lifecycle {
  phase: 'boot' | 'firstrun' | 'running' | 'degraded' | 'safe' | 'updating' | 'shutdown';
  since: number;
  bootCount: number;
  crashCount: number;
  safeReason?: string;
  degradedReasons: string[];
}

export interface PlatformAdapter {
  kind: HostKind;
  /** probe everything this adapter can see; never throws */
  probe(): Promise<{ caps: Partial<Record<CapId, Omit<Cap, 'id'>>>; device?: Partial<DeviceProfile> }>;
  device(): Promise<Partial<DeviceProfile>>;
  power(): Promise<Partial<PowerState>>;
  display(): Promise<Partial<DisplayState>>;
  net(): Promise<Partial<NetState>>;
  volumes(): Promise<StorageVolume[]>;
  /** optional, tier-honest implementations */
  setBrightness?(v: number): Promise<boolean>;
  setVolume?(stream: 'media' | 'ring' | 'alarm' | 'call', v: number): Promise<boolean>;
  wakeLock?(on: boolean): Promise<boolean>;
  screenOn?(on: boolean): Promise<boolean>;
  launchApp?(pkg: string, intent?: Intent): Promise<boolean>;
  installApk?(path: string): Promise<{ ok: boolean; mode: string }>;
  notify?(n: { title: string; body: string; id?: string; action?: string }): Promise<boolean>;
  share?(opts: { text?: string; url?: string; file?: string; mime?: string }): Promise<boolean>;
  sensors?(): Promise<{ id: string; name: string }[]>;
  thermalZones?(): Promise<{ name: string; c: number }[]>;
  subscribe?(topic: 'power' | 'net' | 'display' | 'input' | 'lifecycle', fn: (p: unknown) => void): () => void;
}

export interface Intent {
  action?: string;
  data?: string;
  mime?: string;
  pkg?: string;
  component?: string;
  extras?: Record<string, string | number | boolean>;
  flags?: number;
}
