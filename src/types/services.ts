/**
 * src/types/services.ts
 * Shared TypeScript types for all LibreDroid OS system services.
 * @module types/services
 */

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationPriority = 'polite' | 'assertive';

export interface INotification {
  id: string;
  title: string;
  body: string;
  appId: string;
  priority: NotificationPriority;
  timestamp: number;
  read: boolean;
  actions?: { label: string; actionId: string }[];
  icon?: string;
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export type PermissionName =
  | 'camera' | 'microphone' | 'location' | 'contacts'
  | 'storage' | 'notifications' | 'bluetooth' | 'nfc';

export type PermissionState = 'granted' | 'denied' | 'prompt';

export interface IPermission {
  name: PermissionName;
  state: PermissionState;
  grantedAt?: number;
  revokedAt?: number;
}

// ─── Diagnostics ──────────────────────────────────────────────────────────────

export interface IMemoryStats {
  totalMb: number;
  usedMb: number;
  freeMb: number;
  cachedMb: number;
}

export interface ICpuStats {
  usagePercent: number;
  coreCount: number;
  model: string;
  frequencyMhz: number;
}

export interface IBatteryStats {
  level: number;        // 0–100
  charging: boolean;
  chargingType: 'none' | 'wired' | 'wireless';
  temperatureCelsius: number;
  timeToFullSec?: number;
  timeToEmptySec?: number;
}

export interface IThermalState {
  zone: string;
  temperatureCelsius: number;
  throttled: boolean;
}

export interface IStorageSmart {
  device: string;
  healthPercent: number;
  reallocatedSectors: number;
  powerOnHours: number;
  temperature: number;
}

export interface IDiagnostics {
  timestamp: number;
  memory: IMemoryStats;
  cpu: ICpuStats;
  battery: IBatteryStats;
  thermals: IThermalState[];
  networkLatencyMs: number;
  storageSmart: IStorageSmart[];
}

export interface IHealthCheck {
  passed: boolean;
  issues: { severity: 'warn' | 'error'; message: string }[];
  score: number; // 0–100
}

// ─── Backup ───────────────────────────────────────────────────────────────────

export interface IBackupEntry {
  path: string;
  hash: string;
  sizeBytes: number;
  mtime: number;
}

export interface IBackupManifest {
  id: string;
  createdAt: number;
  deviceId: string;
  version: string;
  targets: string[];
  entries: IBackupEntry[];
  encryptionAlgo: 'AES-256-GCM';
  ivHex: string;
  saltHex: string;
  differential: boolean;
  baseManifestId?: string;
}

// ─── Theming ──────────────────────────────────────────────────────────────────

export interface IColorPalette {
  primary: string;
  secondary: string;
  tertiary: string;
  surface: string;
  background: string;
  onPrimary: string;
  onSurface: string;
  error: string;
}

export interface IThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  oledMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  palette?: Partial<IColorPalette>;
  wallpaperUrl?: string;
  fontScale: number; // 0.8 – 2.0
}

// ─── Sync / CRDT ──────────────────────────────────────────────────────────────

export interface ISyncRecord<T = unknown> {
  key: string;
  value: T;
  timestamp: number;    // HLC or Unix ms for LWW
  deviceId: string;
  vectorClock?: Record<string, number>;
}

export interface ISyncPeer {
  id: string;
  matrixUserId?: string;
  endpoint?: string;    // wss:// Matrix homeserver or WebRTC signal URL
  lastSeen?: number;
}

// ─── Federated Identity / DID ─────────────────────────────────────────────────

export interface IDIDDocument {
  '@context': string[];
  id: string;           // e.g. did:key:z6Mk...
  verificationMethod: IVerificationMethod[];
  authentication: string[];
  assertionMethod?: string[];
  keyAgreement?: string[];
  service?: IDIDService[];
}

export interface IVerificationMethod {
  id: string;
  type: string;         // e.g. 'Ed25519VerificationKey2020'
  controller: string;
  publicKeyMultibase?: string;
  publicKeyJwk?: Record<string, string>;
}

export interface IDIDService {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface IVerifiableCredential {
  '@context': string[];
  id?: string;
  type: string[];
  issuer: string;       // DID
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: { id: string; [claim: string]: unknown };
  proof?: ICredentialProof;
}

export interface ICredentialProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  jws?: string;
  proofValue?: string;
}

// ─── AI / ML ──────────────────────────────────────────────────────────────────

export type ModelFormat = 'onnx' | 'gguf' | 'tflite' | 'openvino';

export interface IModel {
  id: string;
  name: string;
  format: ModelFormat;
  path: string;
  sizeBytes: number;
  loadedAt?: number;
  accelerator: 'webgpu' | 'wasm' | 'cpu';
  capabilities: ('text' | 'image' | 'audio' | 'embedding')[];
}

export interface IInferInput {
  type: 'text' | 'image' | 'audio' | 'embedding';
  data: string | Float32Array | ArrayBuffer;
  options?: Record<string, unknown>;
}

export interface IInferOutput {
  type: string;
  data: unknown;
  latencyMs: number;
  tokensPerSec?: number;
}

// ─── XR / Spatial ─────────────────────────────────────────────────────────────

export interface IXRSession {
  mode: 'inline' | 'immersive-vr' | 'immersive-ar';
  active: boolean;
  frameRate?: number;
  referenceSpace?: string;
}

export interface IDeviceOrientation {
  alpha: number;        // yaw  0–360
  beta: number;         // pitch −180 to 180
  gamma: number;        // roll −90 to 90
  absolute: boolean;
}

export interface IHandTrackingJoint {
  name: string;
  position: [number, number, number];
  radius: number;
}

// ─── Mesh / P2P ───────────────────────────────────────────────────────────────

export type PeerTransport = 'webrtc' | 'ble' | 'lan';

export interface IMeshPeer {
  id: string;
  displayName?: string;
  transport: PeerTransport;
  rssi?: number;
  connected: boolean;
  discoveredAt: number;
}

// ─── Post-Quantum Crypto ──────────────────────────────────────────────────────

export interface IKEMResult {
  ciphertext: Uint8Array;
  sharedSecret: Uint8Array;
}

export interface ISignResult {
  signature: Uint8Array;
  algorithm: 'dilithium3' | 'ed25519';
}
