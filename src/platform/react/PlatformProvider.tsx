import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CapId, Cap, DeviceProfile, Lifecycle, PowerState, NetState, DisplayState } from '../types';
import { bootPlatform, currentAdapter, safeMode } from '../index';
import { caps } from '../caps';
import { bootGate, lifecycle, markCrash, markHealthy, onLifecycle } from '../lifecycle';
import { device, loadDevice, onDevice, watchDevice } from '../device';
import { onPower, power, watchPower } from '../power';
import { display, onDisplay, watchDisplay } from '../display';
import { net, onNet, watchNet } from '../net';
import { installInput } from '../input';
import { watchVolumes, watchPressure } from '../storage';

interface Ctx {
  ready: boolean;
  phase: Lifecycle['phase'];
  caps: typeof caps;
  device: DeviceProfile;
  power: PowerState;
  display: DisplayState;
  net: NetState;
  safe: boolean;
  host: string;
}

const C = createContext<Ctx | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [, tick] = useState(0);
  const [boot, setBoot] = useState<Lifecycle['phase']>('boot');
  const bump = () => tick((n) => n + 1);

  useEffect(() => {
    let offs: (() => void)[] = [];
    let alive = true;

    (async () => {
      await bootPlatform();
      if (!alive) return;
      await loadDevice();

      const phase = bootGate();
      setBoot(phase);

      if (phase !== 'safe') {
        offs.push(watchDevice(), watchPower(), watchDisplay(), watchNet(), watchVolumes(), watchPressure(), installInput());
      } else {
        offs.push(watchDevice());
      }
      offs.push(
        caps.subscribe(bump),
        onDevice(bump), onPower(bump), onDisplay(bump), onNet(bump), onLifecycle((l) => setBoot(l.phase)),
      );
      setReady(true);
    })().catch((e) => { markCrash(); console.error(e); });

    const onErr = () => markCrash();
    addEventListener('error', onErr);
    addEventListener('unhandledrejection', onErr);

    return () => {
      alive = false;
      offs.forEach((f) => f());
      removeEventListener('error', onErr);
      removeEventListener('unhandledrejection', onErr);
    };
  }, []);

  useEffect(() => {
    if (ready && boot !== 'boot' && boot !== 'safe') {
      const t = setTimeout(markHealthy, 4000);
      return () => clearTimeout(t);
    }
  }, [ready, boot]);

  const value = useMemo<Ctx>(() => ({
    ready, phase: boot, caps, device: device(), power: power(), display: display(), net: net(),
    safe: boot === 'safe' || safeMode(), host: currentAdapter().kind,
  }), [ready, boot]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function usePlatform() {
  const c = useContext(C);
  if (!c) throw new Error('usePlatform outside PlatformProvider');
  return c;
}

export function useCap(id: CapId): Cap & { ok: boolean; degraded: boolean } {
  usePlatform();
  const c = caps.get(id);
  return { ...c, ok: c.tier !== 'absent', degraded: c.tier === 'emulated' || c.tier === 'bridge' };
}

export function useCaps(...ids: CapId[]) {
  usePlatform();
  return ids.map((id) => ({ ...caps.get(id), id, ok: caps.has(id) }));
}

/** Render children only when a capability exists; otherwise a fallback + badge. */
export function CapGate({ id, children, fallback = null, silent = false }:
  { id: CapId; children: React.ReactNode; fallback?: React.ReactNode; silent?: boolean }) {
  const c = useCap(id);
  if (!c.ok) {
    if (silent) return null;
    return <>{fallback ?? (
      <div className="text-xs text-neutral-500 italic" title={c.why}>
        {id} unavailable
      </div>
    )}</>;
  }
  return <>{children}</>;
}
