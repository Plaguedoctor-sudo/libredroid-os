/**
 * src/types/platform.ts
 * Platform capability and device information types for LibreDroid OS.
 * @module types/platform
 */

import type { IPermission } from './services';

// ─── Capability Map ───────────────────────────────────────────────────────────

export interface ICapabilityMap {
  // Input
  touchscreen: boolean;
  multiTouch: boolean;
  stylus: boolean;
  keyboard: boolean;
  mouse: boolean;
  gamepad: boolean;
  // Sensors
  gps: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
  barometer: boolean;
  ambientLight: boolean;
  proximity: boolean;
  // Connectivity
  wifi: boolean;
  bluetooth: boolean;
  bluetoothLE: boolean;
  nfc: boolean;
  cellular: boolean;
  cellular5g: boolean;
  ethernet: boolean;
  // Media
  camera: boolean;
  cameraCount: number;
  microphone: boolean;
  speaker: boolean;
  headphone: boolean;
  // Security
  tee: boolean;         // Trusted Execution Environment
  se: boolean;          // Secure Element
  fingerprint: boolean;
  faceUnlock: boolean;
  // Compute
  webgpu: boolean;
  webAssembly: boolean;
  sharedArrayBuffer: boolean;
  // XR
  webxr: boolean;
  // Battery
  battery: boolean;
}

// ─── Platform Info ────────────────────────────────────────────────────────────

export type PlatformArch = 'x86_64' | 'aarch64' | 'riscv64' | 'unknown';
export type PlatformKernel = 'linux' | 'wasm' | 'unknown';
export type PlatformFormFactor = 'phone' | 'tablet' | 'foldable' | 'desktop' | 'tv' | 'watch';

export interface IPlatformInfo {
  os: 'LibreDroid OS';
  version: string;
  build: string;
  arch: PlatformArch;
  kernel: PlatformKernel;
  formFactor: PlatformFormFactor;
  screenWidthPx: number;
  screenHeightPx: number;
  dpi: number;
  capabilities: ICapabilityMap;
  permissions: Record<string, IPermission>;
}

// ─── Network Info ─────────────────────────────────────────────────────────────

export type NetworkType = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';
export type NetworkGeneration = '2g' | '3g' | '4g' | '5g' | null;

export interface INetworkInfo {
  online: boolean;
  type: NetworkType;
  generation?: NetworkGeneration;
  ssid?: string;
  signalStrength?: number;  // dBm
  ipv4?: string;
  ipv6?: string;
  dnsPrimary?: string;
  metered: boolean;
  captivePortal: boolean;
  latencyMs?: number;
}

// ─── Biometric ────────────────────────────────────────────────────────────────

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'hybrid';
export type BiometricStrength = 'strong' | 'weak' | 'convenience';

export interface IBiometric {
  type: BiometricType;
  strength: BiometricStrength;
  enrolled: boolean;
  lockedOut: boolean;
  hardwareBacked: boolean;
}

// ─── Voice / STT / TTS ────────────────────────────────────────────────────────

export interface IVoiceResult {
  transcript: string;
  confidence: number;   // 0.0 – 1.0
  isFinal: boolean;
  language: string;     // BCP-47 tag e.g. 'en-US'
  alternatives?: { transcript: string; confidence: number }[];
  backend: 'webspeech' | 'whisper';
  latencyMs: number;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export type StorageType = 'emmc' | 'ufs' | 'nvme' | 'sd' | 'usb' | 'unknown';

export interface IStorageVolume {
  id: string;
  label: string;
  type: StorageType;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  mountPoint: string;
  removable: boolean;
  encrypted: boolean;
}
