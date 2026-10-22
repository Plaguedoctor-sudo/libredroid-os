export interface PhysicalHardwareStatus {
  connected: boolean;
  deviceModel?: string;
  osVersion?: string;
  battery?: {
    level: number;
    isCharging: boolean;
    temperature: number;
  };
  wifi?: {
    enabled: boolean;
    ssid: string;
    ip: string;
    linkSpeed: string;
  };
  bluetooth?: {
    enabled: boolean;
  };
  hotspot?: {
    enabled: boolean;
    ready: boolean;
  };
  camera?: {
    status: string;
    resolutions: string[];
  };
  microphone?: {
    status: string;
    channels: number;
  };
  storage?: {
    total: string;
    used: string;
    available: string;
    usePercent: string;
  };
  error?: string;
}

export interface PhysicalStorageItem {
  name: string;
  isFolder: boolean;
  size: string;
  date: string;
  path: string;
}

export async function fetchHardwareStatus(): Promise<PhysicalHardwareStatus | null> {
  try {
    const res = await fetch('/api/hardware/status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function togglePhysicalHardware(
  component: 'wifi' | 'bluetooth' | 'hotspot' | 'airplane',
  state?: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/hardware/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ component, state }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchPhysicalStorage(path: string = '/storage/emulated/0'): Promise<{
  path: string;
  items: PhysicalStorageItem[];
}> {
  try {
    const res = await fetch(`/api/storage/list?path=${encodeURIComponent(path)}`);
    if (!res.ok) return { path, items: [] };
    return await res.json();
  } catch {
    return { path, items: [] };
  }
}

export async function createPhysicalFile(folderPath: string, name: string, content?: string): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const res = await fetch('/api/storage/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath, name, content }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function dialPhoneNumber(number: string): Promise<{ success: boolean; dialed?: string; error?: string }> {
  try {
    const res = await fetch('/api/telephony/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendSmsMessage(number: string, message: string): Promise<{ success: boolean; sent?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/telephony/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number, message }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
