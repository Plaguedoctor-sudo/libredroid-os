/**
 * usePermissions — OS-level permission management hook.
 * Bridges to platform/caps.ts for real permission state,
 * and SecurityContext for killswitch enforcement.
 */

import { useState, useEffect, useCallback } from 'react';
import { caps } from '../platform/caps';

export type PermissionId =
  | 'camera'
  | 'microphone'
  | 'location'
  | 'contacts'
  | 'storage'
  | 'notifications';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unavailable';

export interface PermissionStatus {
  granted: Record<PermissionId, PermissionState>;
  request: (permission: PermissionId) => Promise<PermissionState>;
  revoke: (permission: PermissionId) => void;
  isGranted: (permission: PermissionId) => boolean;
}

const PERMISSION_STORAGE_KEY = 'lrd_permissions_v1';

function loadPersistedPermissions(): Partial<Record<PermissionId, PermissionState>> {
  try {
    const raw = localStorage.getItem(PERMISSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistPermissions(perms: Partial<Record<PermissionId, PermissionState>>) {
  try {
    localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(perms));
  } catch {
    // quota exceeded — not fatal
  }
}

const DEFAULT_STATE: Record<PermissionId, PermissionState> = {
  camera: 'prompt',
  microphone: 'prompt',
  location: 'prompt',
  contacts: 'prompt',
  storage: 'prompt',
  notifications: 'prompt',
};

/** Map PermissionId → W3C PermissionDescriptor name */
const W3C_MAP: Partial<Record<PermissionId, PermissionName>> = {
  camera: 'camera' as PermissionName,
  microphone: 'microphone' as PermissionName,
  location: 'geolocation' as PermissionName,
  notifications: 'notifications' as PermissionName,
};

async function queryW3CPermission(id: PermissionId): Promise<PermissionState> {
  const name = W3C_MAP[id];
  if (!name || !navigator.permissions) return 'prompt';
  try {
    const status = await navigator.permissions.query({ name });
    return status.state as PermissionState;
  } catch {
    return 'prompt';
  }
}

async function requestW3CPermission(id: PermissionId): Promise<PermissionState> {
  try {
    switch (id) {
      case 'camera': {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        return 'granted';
      }
      case 'microphone': {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        return 'granted';
      }
      case 'location': {
        return new Promise<PermissionState>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve('granted'),
            () => resolve('denied'),
            { timeout: 5000 },
          );
        });
      }
      case 'notifications': {
        if (!('Notification' in window)) return 'unavailable';
        const result = await Notification.requestPermission();
        return result === 'granted' ? 'granted' : 'denied';
      }
      case 'storage':
        // Storage access is implicit in browser; we model it as always granted
        return 'granted';
      case 'contacts':
        // No W3C contact picker permission API yet; return prompt
        return 'prompt';
      default:
        return 'prompt';
    }
  } catch {
    return 'denied';
  }
}

export function usePermissions(appId: string): PermissionStatus {
  const [granted, setGranted] = useState<Record<PermissionId, PermissionState>>(() => ({
    ...DEFAULT_STATE,
    ...loadPersistedPermissions(),
  }));

  // On mount, query real browser permission states
  useEffect(() => {
    const ids: PermissionId[] = ['camera', 'microphone', 'location', 'notifications'];
    let cancelled = false;
    Promise.all(ids.map((id) => queryW3CPermission(id).then((state) => ({ id, state })))).then(
      (results) => {
        if (cancelled) return;
        setGranted((prev) => {
          const next = { ...prev };
          results.forEach(({ id, state }) => {
            next[id] = state;
          });
          return next;
        });
      },
    );
    return () => { cancelled = true; };
  }, [appId]);

  const request = useCallback(async (permission: PermissionId): Promise<PermissionState> => {
    // Check killswitches via caps registry
    if (permission === 'camera' && caps.get('cam.devices').tier === 'absent') {
      setGranted((p) => ({ ...p, camera: 'unavailable' }));
      persistPermissions({ ...granted, camera: 'unavailable' });
      return 'unavailable';
    }
    if (permission === 'microphone' && caps.get('audio.mic').tier === 'absent') {
      setGranted((p) => ({ ...p, microphone: 'unavailable' }));
      persistPermissions({ ...granted, microphone: 'unavailable' });
      return 'unavailable';
    }
    if (permission === 'location' && caps.get('sensors.gps').tier === 'absent') {
      setGranted((p) => ({ ...p, location: 'unavailable' }));
      persistPermissions({ ...granted, location: 'unavailable' });
      return 'unavailable';
    }

    const state = await requestW3CPermission(permission);
    setGranted((prev) => {
      const next = { ...prev, [permission]: state };
      persistPermissions(next);
      return next;
    });
    return state;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, granted]);

  const revoke = useCallback((permission: PermissionId) => {
    setGranted((prev) => {
      const next = { ...prev, [permission]: 'denied' as PermissionState };
      persistPermissions(next);
      return next;
    });
  }, []);

  const isGranted = useCallback(
    (permission: PermissionId) => granted[permission] === 'granted',
    [granted],
  );

  return { granted, request, revoke, isGranted };
}
