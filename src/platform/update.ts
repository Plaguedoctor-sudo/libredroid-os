import { caps } from './caps';
import { setPhase } from './lifecycle';

export interface UpdateInfo {
  version: string;
  channel: 'stable' | 'beta' | 'nightly';
  size: number;
  sha256: string;
  notes?: string;
  staged?: boolean;
  appliedSlot?: string;
}

let current: UpdateInfo | null = null;
let staged: UpdateInfo | null = null;

export const available = () => current;
export const stagedUpdate = () => staged;

export async function check(channel: UpdateInfo['channel'] = 'stable') {
  try {
    const r = await fetch(`/api/device/update/check?channel=${channel}`);
    if (!r.ok) return null;
    current = await r.json();
    return current;
  } catch { return null; }
}

export async function download() {
  if (!current) return null;
  setPhase('updating');
  try {
    const r = await fetch('/api/device/update/stage', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(current),
    });
    const j = await r.json();
    if (!j.ok) return null;
    staged = { ...current, staged: true, appliedSlot: j.slot };
    return staged;
  } finally { setPhase('running'); }
}

/** A/B devices reboot into the new slot; others reboot into a snapshot. */
export async function apply({ now = false } = {}) {
  if (!staged) return false;
  const r = await fetch('/api/device/update/apply', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ now }),
  });
  return r.ok;
}

export async function rollback() {
  if (!caps.has('os.rollback')) return false;
  const r = await fetch('/api/device/update/rollback', { method: 'POST' });
  return r.ok;
}

export const slotInfo = () => ({
  supported: caps.has('device.slot'),
  verity: caps.has('device.verity'),
  active: null as string | null,
  method: caps.tier('os.update'),
});
