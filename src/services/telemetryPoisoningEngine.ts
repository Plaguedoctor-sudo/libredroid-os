export interface PoisonedBeaconEvent {
  id: string;
  timestamp: string;
  app: string;
  destination: string;
  trackerSdk: 'Google Firebase / Analytics' | 'Meta Graph SDK' | 'Adjust Attribution' | 'AppsFlyer' | 'Kochava' | 'Mixpanel / Amplitude' | 'InMobi / Flurry';
  originalAttempt: string;
  poisonedPayload: string;
  spoofedFingerprint: {
    aaidIdfa: string;
    batteryLevel: string;
    carrier: string;
    deviceModel: string;
    locationJitter: string;
  };
  returnedStatus: 'HTTP 200 OK (Dummy Success Emulated)';
}

export interface TelemetryDefenseSettings {
  poisoningActive: boolean;
  spoofDeviceFingerprint: boolean;
  spoofBatteryMetrics: boolean;
  spoofCarrierNetwork: boolean;
  spoofLocationJitter: boolean;
  emulateHoneytokenResponses: boolean;
  fakeAaidMode: 'zeroed' | 'randomized_each_boot' | 'custom';
}

const STORAGE_KEY_SETTINGS = 'libredroid_telemetry_defense_settings';

export const DEFAULT_TELEMETRY_SETTINGS: TelemetryDefenseSettings = {
  poisoningActive: true,
  spoofDeviceFingerprint: true,
  spoofBatteryMetrics: true,
  spoofCarrierNetwork: true,
  spoofLocationJitter: true,
  emulateHoneytokenResponses: true,
  fakeAaidMode: 'randomized_each_boot',
};

export const INITIAL_POISONED_BEACONS: PoisonedBeaconEvent[] = [
  {
    id: 'pb-1',
    timestamp: 'Just now',
    app: 'Commercial Ride App (Sideloaded)',
    destination: 'app-measurement.com/a/v2',
    trackerSdk: 'Google Firebase / Analytics',
    originalAttempt: 'Attempted to exfiltrate true IMEI, GPS altitude, Wi-Fi BSSID list & real battery level',
    poisonedPayload: '{"event": "dummy_ping", "battery": "83%", "carrier": "Sovereign Mesh", "wifi_bssid": "00:00:00:00:00:00"}',
    spoofedFingerprint: {
      aaidIdfa: '00000000-0000-0000-0000-000000000000',
      batteryLevel: '83% (Constant Dummy)',
      carrier: 'Sovereign Mesh Telecom (MCC 999)',
      deviceModel: 'Generic POSIX Hardened Container',
      locationJitter: '0.0000, 0.0000 (Null Island Spoofed)',
    },
    returnedStatus: 'HTTP 200 OK (Dummy Success Emulated)',
  },
  {
    id: 'pb-2',
    timestamp: '2 mins ago',
    app: 'Social Video APK',
    destination: 'graph.facebook.com/v19.0/mobile_app_events',
    trackerSdk: 'Meta Graph SDK',
    originalAttempt: 'Forced user consent dialog: refused to proceed without Advertiser ID (IDFA/AAID)',
    poisonedPayload: '{"advertiser_tracking_enabled": true, "application_tracking_enabled": true, "extinfo": ["randomized_synthetic_hash"]}',
    spoofedFingerprint: {
      aaidIdfa: 'e8a9314c-fb12-491a-b62e-091a92384192 (High-Entropy Garbage)',
      batteryLevel: '83% (Constant Dummy)',
      carrier: 'Sovereign Mesh Telecom (MCC 999)',
      deviceModel: 'Generic POSIX Hardened Container',
      locationJitter: 'Offset +14.2 km synthetic jitter',
    },
    returnedStatus: 'HTTP 200 OK (Dummy Success Emulated)',
  },
  {
    id: 'pb-3',
    timestamp: '8 mins ago',
    app: 'Free Photo Filter Tool',
    destination: 'app.adjust.com/session',
    trackerSdk: 'Adjust Attribution',
    originalAttempt: 'Mandatory analytics telemetry payload: installed app list and hardware canvas hash',
    poisonedPayload: '{"installed_apps": ["org.libredroid.sovereign"], "canvas_hash": "dummy_zero_jitter_canvas"}',
    spoofedFingerprint: {
      aaidIdfa: '00000000-0000-0000-0000-000000000000',
      batteryLevel: '83% (Constant Dummy)',
      carrier: 'Sovereign Mesh Telecom (MCC 999)',
      deviceModel: 'Generic POSIX Hardened Container',
      locationJitter: 'Null Island Coordinates',
    },
    returnedStatus: 'HTTP 200 OK (Dummy Success Emulated)',
  },
];

export function getTelemetrySettings(): TelemetryDefenseSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_TELEMETRY_SETTINGS));
      return DEFAULT_TELEMETRY_SETTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TELEMETRY_SETTINGS;
  }
}

export function updateTelemetrySettings(settings: Partial<TelemetryDefenseSettings>): TelemetryDefenseSettings {
  const current = getTelemetrySettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save telemetry defense settings', e);
  }
  return updated;
}

export function generateSyntheticTelemetryPayload(appName: string, tracker: PoisonedBeaconEvent['trackerSdk']): PoisonedBeaconEvent {
  const randomHex = Math.random().toString(16).substring(2, 10);
  return {
    id: `pb-${Date.now()}`,
    timestamp: 'Just now',
    app: appName,
    destination: tracker.includes('Google') ? 'app-measurement.com/a/v2' : tracker.includes('Meta') ? 'graph.facebook.com/v19.0' : 'api2.appsflyer.com/event',
    trackerSdk: tracker,
    originalAttempt: 'App prompted mandatory telemetry consent: intercepted and substituted with synthetic noise payload',
    poisonedPayload: `{"session_id": "dummy_${randomHex}", "synthetic_events": 1, "status": "poisoned_success"}`,
    spoofedFingerprint: {
      aaidIdfa: `00000000-0000-4000-8000-${randomHex}${randomHex}`,
      batteryLevel: '83% (Constant Dummy)',
      carrier: 'Sovereign Mesh Telecom',
      deviceModel: 'Generic POSIX Hardened Container',
      locationJitter: 'Jittered synthetic offset applied',
    },
    returnedStatus: 'HTTP 200 OK (Dummy Success Emulated)',
  };
}
