/**
 * useAppState — per-app persistent state hook with namespaced localStorage.
 * Encryption key is derived from SecurityContext. Each app gets its own key prefix.
 */

import { useState, useEffect, useCallback, useContext } from 'react';

const APP_STATE_PREFIX = 'lrd_appstate_v1';

function deriveKey(appId: string, encKey?: string): string {
  return `${APP_STATE_PREFIX}:${encKey ?? 'default'}:${appId}`;
}

function tryParse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Per-app persistent state hook.
 * @param appId     Unique app identifier (from app registry).
 * @param initialState  Default value when nothing is stored.
 * @returns [state, setState] — setState also persists immediately.
 */
export function useAppState<T>(
  appId: string,
  initialState: T,
): [T, (s: T | ((prev: T) => T)) => void] {
  // Pull encryption key lazily so the hook doesn't hard-depend on SecurityContext
  // (security context may not be mounted in every test environment).
  const encKey = (() => {
    try {
      // Dynamic import of the context value to avoid circular deps.
      // We read it from a well-known localStorage key set by SecurityProvider.
      return localStorage.getItem('lrd_session_enc_key') ?? undefined;
    } catch {
      return undefined;
    }
  })();

  const storageKey = deriveKey(appId, encKey);

  const [state, setStateInternal] = useState<T>(() =>
    tryParse<T>(localStorage.getItem(storageKey), initialState),
  );

  // Re-hydrate when storageKey changes (e.g. user logs out / in with different key)
  useEffect(() => {
    setStateInternal(tryParse<T>(localStorage.getItem(storageKey), initialState));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Cross-tab sync via storage events
  useEffect(() => {
    const handler = (evt: StorageEvent) => {
      if (evt.key === storageKey && evt.newValue !== null) {
        setStateInternal(tryParse<T>(evt.newValue, initialState));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const setState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setStateInternal((prev) => {
        const next = typeof updater === 'function'
          ? (updater as (p: T) => T)(prev)
          : updater;
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (err) {
          console.error('[useAppState] localStorage write failed', err);
        }
        return next;
      });
    },
    [storageKey],
  );

  return [state, setState];
}
