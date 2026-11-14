/**
 * updateService — OTA update service.
 * Polls /api/ota/status, downloads update manifest, verifies cosign signature,
 * triggers A/B slot swap. Emits events via systemBus.
 */

import { systemBus } from './systemBus';

/* ─────────────────────────── Types ─────────────────────────── */

export type UpdateChannel = 'stable' | 'beta' | 'nightly';

export interface UpdateManifest {
  version: string;
  buildDate: string;
  channel: UpdateChannel;
  size: number;          // bytes
  sha256: string;
  cosignSignature: string;
  cosignPublicKey: string;
  downloadUrl: string;
  changelogUrl: string;
  changelog: string;
  slot: 'a' | 'b';
  rollbackSlot: 'a' | 'b';
  minOsVersion: string;
  critical: boolean;
}

export type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'verifying'
  | 'ready'
  | 'applying'
  | 'done'
  | 'error'
  | 'up-to-date';

export interface UpdateStatus {
  phase: UpdatePhase;
  manifest: UpdateManifest | null;
  progress: number;        // 0–100 during download
  errorMessage: string | null;
  currentVersion: string;
  currentSlot: 'a' | 'b' | null;
  lastChecked: number | null;
}

/* ─────────────────────────── Constants ─────────────────────────── */

const OTA_STATUS_URL = '/api/ota/status';
const OTA_MANIFEST_URL = '/api/ota/manifest';
const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION ?? '1.0.0';
const POLL_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

/* ─────────────────────────── Cosign verification ─────────────────── */

async function verifyCosignSignature(
  manifest: UpdateManifest,
): Promise<boolean> {
  try {
    // Import the cosign public key (ECDSA P-256 / SPKI PEM stripped)
    const keyData = pemToBuffer(manifest.cosignPublicKey);
    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      keyData,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );

    // Canonical payload: version + sha256 + size + buildDate
    const payload = `${manifest.version}|${manifest.sha256}|${manifest.size}|${manifest.buildDate}`;
    const enc = new TextEncoder().encode(payload);

    const sigBuffer = hexToBuffer(manifest.cosignSignature);
    const valid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      cryptoKey,
      sigBuffer,
      enc,
    );
    return valid;
  } catch (err) {
    console.error('[updateService] cosign verify error', err);
    return false;
  }
}

function pemToBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [];
  return new Uint8Array(bytes).buffer;
}

/* ─────────────────────────── Service state ─────────────────────── */

let _status: UpdateStatus = {
  phase: 'idle',
  manifest: null,
  progress: 0,
  errorMessage: null,
  currentVersion: CURRENT_VERSION,
  currentSlot: null,
  lastChecked: null,
};

type StatusListener = (status: UpdateStatus) => void;
const _listeners = new Set<StatusListener>();

function emitStatus(patch: Partial<UpdateStatus>) {
  _status = { ..._status, ...patch };
  systemBus.emit('system.update.status', _status, 'updateService');
  _listeners.forEach((l) => l(_status));
}

/* ─────────────────────────── Public API ─────────────────────────── */

export function getUpdateStatus(): UpdateStatus {
  return { ..._status };
}

export function onUpdateStatus(cb: StatusListener): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

export async function checkForUpdates(): Promise<UpdateManifest | null> {
  if (_status.phase === 'checking' || _status.phase === 'downloading') {
    return _status.manifest;
  }

  emitStatus({ phase: 'checking', errorMessage: null, lastChecked: Date.now() });

  try {
    const res = await fetch(OTA_STATUS_URL, {
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { updateAvailable: boolean; latestVersion: string; currentSlot: 'a' | 'b' };

    emitStatus({ currentSlot: data.currentSlot });

    if (!data.updateAvailable || data.latestVersion === CURRENT_VERSION) {
      emitStatus({ phase: 'up-to-date' });
      return null;
    }

    // Fetch the full manifest
    const mRes = await fetch(OTA_MANIFEST_URL, { signal: AbortSignal.timeout(10_000) });
    if (!mRes.ok) throw new Error(`manifest HTTP ${mRes.status}`);
    const manifest = await mRes.json() as UpdateManifest;

    emitStatus({ phase: 'available', manifest });
    systemBus.emit('system.update.available', manifest, 'updateService');
    return manifest;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emitStatus({ phase: 'error', errorMessage: msg });
    return null;
  }
}

export async function applyUpdate(manifest: UpdateManifest): Promise<boolean> {
  emitStatus({ phase: 'downloading', progress: 0 });

  try {
    // Stream download with progress tracking
    const res = await fetch(manifest.downloadUrl, { signal: AbortSignal.timeout(300_000) });
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.byteLength;
        const progress = Math.min(99, Math.round((received / manifest.size) * 100));
        emitStatus({ progress });
      }
    }

    emitStatus({ phase: 'verifying', progress: 100 });

    // SHA-256 verification
    const allData = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      allData.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', allData);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (hashHex !== manifest.sha256) {
      throw new Error('SHA-256 checksum mismatch — update rejected');
    }

    // Cosign signature verification
    const sigValid = await verifyCosignSignature(manifest);
    if (!sigValid) {
      throw new Error('Cosign signature invalid — update rejected');
    }

    emitStatus({ phase: 'applying' });
    systemBus.emit('system.update.applying', manifest, 'updateService');

    // Trigger A/B slot swap via backend
    const swapRes = await fetch('/api/ota/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: manifest.version, slot: manifest.slot }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!swapRes.ok) throw new Error(`Slot swap failed: HTTP ${swapRes.status}`);

    emitStatus({ phase: 'done' });
    systemBus.emit('system.update.done', manifest, 'updateService');
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emitStatus({ phase: 'error', errorMessage: msg });
    systemBus.emit('system.update.error', { message: msg }, 'updateService');
    return false;
  }
}

/* ─────────────────────────── Background polling ─────────────────── */

let _pollTimer: ReturnType<typeof setInterval> | null = null;

export function startUpdatePolling(): void {
  if (_pollTimer) return;
  checkForUpdates();
  _pollTimer = setInterval(checkForUpdates, POLL_INTERVAL_MS);
}

export function stopUpdatePolling(): void {
  if (_pollTimer) {
    clearInterval(_pollTimer);
    _pollTimer = null;
  }
}
