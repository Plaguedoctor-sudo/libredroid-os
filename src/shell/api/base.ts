// src/shell/api/base.ts
/**
 * LibreDroid Type-Safe RPC Bridge
 * Communicates with the confined LibreDroid System API Daemon over loopback / Unix socket.
 */

export const API_BASE =
  (window as any).__LRD_API__ ?? "";

export interface RpcResponse<T = any> {
  ok: boolean;
  error?: string;
  [key: string]: any;
}

export async function rpcCall<T = any>(method: string, params: Record<string, any> = {}): Promise<RpcResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}/api/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, params }),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err.message || "Network error" };
  }
}

export const call = (command: string) =>
  fetch(`${API_BASE}/api/shell/exec`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  }).then((r) => r.json()).catch((err) => ({ ok: false, error: err.message }));

export const notifyReady = () =>
  fetch(`${API_BASE}/api/shell/ready`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});

// High-level Typed System Control API
export const systemApi = {
  power: (action: "reboot" | "poweroff" | "suspend" | "lock") =>
    rpcCall("system.power", { action }),

  setBrightness: (level: number) =>
    rpcCall("system.brightness.set", { level }),

  getBrightness: () =>
    rpcCall("system.brightness.get"),

  setVolume: (level: number) =>
    rpcCall("system.volume.set", { level }),

  getWifiNetworks: () =>
    rpcCall("system.wifi.status"),

  launchApp: (pkg: string) =>
    rpcCall("waydroid.app.launch", { package: pkg }),

  getSystemStatus: () =>
    rpcCall("system.status"),
};
