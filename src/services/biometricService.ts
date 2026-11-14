/**
 * biometricService — WebAuthn + fingerprint bridge.
 * Wraps navigator.credentials, bridges to os/account/lrd-lock.
 */

import { systemBus } from './systemBus';

/* ─────────────────────────── Types ─────────────────────────── */

export interface BiometricEnrollment {
  credentialId: string;
  publicKey: string;        // base64url COSE key
  enrolledAt: number;
  algorithm: number;        // COSE algorithm id (e.g., -7 = ES256)
}

export interface AuthResult {
  success: boolean;
  credentialId?: string;
  error?: string;
}

/* ─────────────────────────── Storage ─────────────────────────── */

const STORAGE_KEY = 'lrd_biometric_enrollment_v1';
const RP_ID = window.location.hostname || 'localhost';
const RP_NAME = 'LibreDroid OS';

function saveEnrollment(enrollment: BiometricEnrollment): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(enrollment));
}

function loadEnrollment(): BiometricEnrollment | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BiometricEnrollment) : null;
  } catch {
    return null;
  }
}

function bufToBase64Url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlToBuf(str: string): ArrayBuffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

/* ─────────────────────────── Feature detection ─────────────────── */

async function isWebAuthnAvailable(): Promise<boolean> {
  return (
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials?.create === 'function'
  );
}

/* ─────────────────────────── Public API ─────────────────────────── */

export async function isEnrolled(): Promise<boolean> {
  return loadEnrollment() !== null;
}

export async function enroll(): Promise<BiometricEnrollment> {
  if (!(await isWebAuthnAvailable())) {
    throw new Error('WebAuthn is not available on this platform');
  }

  const userId = crypto.getRandomValues(new Uint8Array(16));
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const credential = (await navigator.credentials.create({
    publicKey: {
      rp: { id: RP_ID, name: RP_NAME },
      user: {
        id: userId,
        name: 'libredroid_user',
        displayName: 'LibreDroid User',
      },
      challenge,
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        userVerification: 'required',
      },
      timeout: 60_000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error('Enrollment cancelled');

  const response = credential.response as AuthenticatorAttestationResponse;
  const credentialId = bufToBase64Url(credential.rawId);

  // Extract public key from attestation object
  const publicKeyBytes = response.getPublicKey?.();
  const publicKey = publicKeyBytes ? bufToBase64Url(publicKeyBytes) : '';
  const algorithm = response.getPublicKeyAlgorithm?.() ?? -7;

  const enrollment: BiometricEnrollment = {
    credentialId,
    publicKey,
    enrolledAt: Date.now(),
    algorithm,
  };

  saveEnrollment(enrollment);
  systemBus.emit('system.biometric.enrolled', { credentialId }, 'biometricService');

  // Notify native bridge (lrd-lock)
  try {
    await fetch('/api/account/biometric/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialId, publicKey, algorithm }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // bridge unavailable — local enrollment still valid
  }

  return enrollment;
}

export async function authenticate(): Promise<AuthResult> {
  if (!(await isWebAuthnAvailable())) {
    return { success: false, error: 'WebAuthn not available' };
  }

  const enrollment = loadEnrollment();
  if (!enrollment) {
    return { success: false, error: 'No biometric enrollment found' };
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  try {
    const assertion = (await navigator.credentials.get({
      publicKey: {
        rpId: RP_ID,
        challenge,
        allowCredentials: [
          {
            type: 'public-key',
            id: base64UrlToBuf(enrollment.credentialId),
          },
        ],
        userVerification: 'required',
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;

    if (!assertion) return { success: false, error: 'Authentication cancelled' };

    systemBus.emit('system.biometric.authenticated', { credentialId: enrollment.credentialId }, 'biometricService');
    return { success: true, credentialId: enrollment.credentialId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function revoke(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  systemBus.emit('system.biometric.revoked', {}, 'biometricService');

  try {
    await fetch('/api/account/biometric/revoke', {
      method: 'POST',
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // bridge may be down — local revoke is sufficient
  }
}
