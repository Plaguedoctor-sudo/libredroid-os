/**
 * crashReporter — Privacy-preserving crash reporter.
 * Catches uncaught errors, strips PII, signs report with device key,
 * queues for local-only storage (no cloud).
 */

import { systemBus } from './systemBus';

/* ─────────────────────────── Types ─────────────────────────── */

export interface CrashReport {
  id: string;
  timestamp: number;
  errorType: string;
  message: string;
  stack: string[];
  context: Record<string, unknown>;
  osVersion: string;
  buildId: string;
  signature: string | null;
  deviceId: string;
}

export interface CrashContext {
  appId?: string;
  route?: string;
  action?: string;
  extra?: Record<string, unknown>;
}

/* ─────────────────────────── PII scrubber ─────────────────────── */

// Patterns to redact from crash reports
const PII_PATTERNS: Array<[RegExp, string]> = [
  [/\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/gi, '[email]'],
  [/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '[ip]'],
  [/(?:password|passwd|pwd|secret|token|key|auth)\s*[:=]\s*\S+/gi, '[redacted]'],
  [/\b[0-9]{13,19}\b/g, '[card]'],          // credit card-ish numbers
  [/Bearer\s+\S+/gi, 'Bearer [token]'],
  [/\/home\/[^/\s]+/g, '/home/[user]'],      // home paths
  [/\bC:\\Users\\[^\\]+/gi, 'C:\\Users\\[user]'],
];

function scrubbedMessage(raw: string): string {
  let s = raw;
  for (const [pat, rep] of PII_PATTERNS) {
    s = s.replace(pat, rep);
  }
  return s;
}

function scrubbedStack(stack: string | undefined): string[] {
  if (!stack) return [];
  return stack
    .split('\n')
    .map((line) => scrubbedMessage(line.trim()))
    .filter(Boolean)
    .slice(0, 30); // cap stack depth
}

/* ─────────────────────────── Device identity ─────────────────── */

async function getDeviceId(): Promise<string> {
  const cached = localStorage.getItem('lrd_device_id');
  if (cached) return cached;
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const id = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem('lrd_device_id', id);
  return id;
}

/* ─────────────────────────── Signing ─────────────────────────── */

async function getOrCreateSigningKey(): Promise<CryptoKey> {
  const rawKey = localStorage.getItem('lrd_crash_signing_key');
  if (rawKey) {
    const keyData = Uint8Array.from(atob(rawKey), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
  }
  const key = await crypto.subtle.generateKey(
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign'],
  );
  const exported = await crypto.subtle.exportKey('raw', key);
  localStorage.setItem('lrd_crash_signing_key', btoa(String.fromCharCode(...new Uint8Array(exported))));
  return key;
}

async function signReport(report: Omit<CrashReport, 'signature'>): Promise<string | null> {
  try {
    const key = await getOrCreateSigningKey();
    const payload = JSON.stringify({
      id: report.id,
      timestamp: report.timestamp,
      message: report.message,
      deviceId: report.deviceId,
    });
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
  } catch {
    return null;
  }
}

/* ─────────────────────────── Queue ─────────────────────────── */

const QUEUE_KEY = 'lrd_crash_queue_v1';
const MAX_QUEUE = 50;

function loadQueue(): CrashReport[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as CrashReport[];
  } catch {
    return [];
  }
}

function saveQueue(queue: CrashReport[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)));
  } catch {
    // quota — evict oldest
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-10)));
    } catch {
      // give up
    }
  }
}

function enqueue(report: CrashReport): void {
  const q = loadQueue();
  q.push(report);
  saveQueue(q);
  systemBus.emit('system.crash.reported', { id: report.id, message: report.message }, 'crashReporter');
}

/* ─────────────────────────── Public API ─────────────────────────── */

export function getCrashQueue(): CrashReport[] {
  return loadQueue();
}

export function clearCrashQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

export async function reportCrash(error: unknown, context: CrashContext = {}): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  const deviceId = await getDeviceId();

  const partial: Omit<CrashReport, 'signature'> = {
    id: `crash_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    errorType: err.name ?? 'UnknownError',
    message: scrubbedMessage(err.message),
    stack: scrubbedStack(err.stack),
    context: {
      appId: context.appId,
      route: context.route,
      action: context.action,
      userAgent: navigator.userAgent.replace(/\(.*?\)/g, '(...)'), // strip platform details
      ...Object.fromEntries(
        Object.entries(context.extra ?? {}).map(([k, v]) => [k, typeof v === 'string' ? scrubbedMessage(v) : v]),
      ),
    },
    osVersion: import.meta.env.VITE_APP_VERSION ?? 'unknown',
    buildId: import.meta.env.VITE_BUILD_ID ?? 'dev',
    deviceId,
  };

  const signature = await signReport(partial);
  enqueue({ ...partial, signature });
}

/* ─────────────────────────── Global error handlers ─────────────────── */

let _initialized = false;

export function initCrashReporter(): void {
  if (_initialized) return;
  _initialized = true;

  window.addEventListener('error', (evt) => {
    reportCrash(evt.error ?? new Error(evt.message), {
      route: window.location.pathname,
      action: 'uncaughtError',
    }).catch(console.error);
  });

  window.addEventListener('unhandledrejection', (evt) => {
    const reason = evt.reason instanceof Error ? evt.reason : new Error(String(evt.reason));
    reportCrash(reason, {
      route: window.location.pathname,
      action: 'unhandledRejection',
    }).catch(console.error);
  });
}
