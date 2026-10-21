export interface TrackerBlockEvent {
  id: string;
  timestamp: string;
  app: string;
  trackerDomain: string;
  category: 'advertising' | 'telemetry' | 'profiling' | 'fingerprinting';
  blocked: boolean;
}

export interface AppRepositoryConfig {
  id: string;
  name: string;
  url: string;
  type: 'fdroid' | 'flathub' | 'ipfs' | 'custom';
  enabled: boolean;
  appCount: number;
}

export interface UnifiedPushServer {
  id: string;
  name: string;
  endpoint: string;
  isSelfHosted: boolean;
  active: boolean;
  latencyMs: number;
}

export const KNOWN_MONOPOLY_TRACKERS = [
  'app-measurement.com',
  'google-analytics.com',
  'crashlytics.com',
  'graph.facebook.com',
  'doubleclick.net',
  'adjust.com',
  'appsflyer.com',
  'branch.io',
  'telemetry.microsoft.com',
];

export const DEFAULT_REPOSITORIES: AppRepositoryConfig[] = [
  {
    id: 'fdroid-main',
    name: 'F-Droid Main Archive',
    url: 'https://f-droid.org/repo',
    type: 'fdroid',
    enabled: true,
    appCount: 4800,
  },
  {
    id: 'izzyondroid',
    name: 'IzzyOnDroid FOSS Beta Repository',
    url: 'https://apt.izzysoft.de/fdroid/repo',
    type: 'fdroid',
    enabled: true,
    appCount: 1250,
  },
  {
    id: 'ipfs-p2p',
    name: 'IPFS Decentralized P2P App Mesh',
    url: 'ipfs://bafybeic.../libredroid-apps',
    type: 'ipfs',
    enabled: true,
    appCount: 840,
  },
  {
    id: 'direct-sideload',
    name: 'Direct APK Sideload Sandbox',
    url: 'local://storage/downloads/apks',
    type: 'custom',
    enabled: true,
    appCount: 12,
  },
];

export const DEFAULT_UNIFIED_PUSH_SERVERS: UnifiedPushServer[] = [
  {
    id: 'ntfy-libredroid',
    name: 'ntfy.sh (Decentralized Open Push)',
    endpoint: 'https://ntfy.sh/libredroid-push',
    isSelfHosted: false,
    active: true,
    latencyMs: 42,
  },
  {
    id: 'matrix-push',
    name: 'Matrix Sygnal Push Gateway',
    endpoint: 'https://matrix.libredroid.local/_matrix/push/v1',
    isSelfHosted: true,
    active: false,
    latencyMs: 18,
  },
  {
    id: 'nextcloud-push',
    name: 'Nextcloud Hub Push Node',
    endpoint: 'https://cloud.local/apps/upush',
    isSelfHosted: true,
    active: false,
    latencyMs: 12,
  },
];

export const generateInitialBlockedTrackers = (): TrackerBlockEvent[] => [
  {
    id: 't-1',
    timestamp: '2 mins ago',
    app: 'Sideloaded APK Container',
    trackerDomain: 'app-measurement.com',
    category: 'telemetry',
    blocked: true,
  },
  {
    id: 't-2',
    timestamp: '5 mins ago',
    app: 'Web Browser Sandbox',
    trackerDomain: 'google-analytics.com',
    category: 'profiling',
    blocked: true,
  },
  {
    id: 't-3',
    timestamp: '12 mins ago',
    app: 'Media Pipeline',
    trackerDomain: 'graph.facebook.com',
    category: 'advertising',
    blocked: true,
  },
  {
    id: 't-4',
    timestamp: '25 mins ago',
    app: 'Network Daemon',
    trackerDomain: 'crashlytics.com',
    category: 'telemetry',
    blocked: true,
  },
  {
    id: 't-5',
    timestamp: '1 hour ago',
    app: 'Waydroid App Service',
    trackerDomain: 'adjust.com',
    category: 'fingerprinting',
    blocked: true,
  },
];

export const exportFullSystemData = () => {
  const exportPackage = {
    system: 'LibreDroid OS',
    version: '1.0.0-sovereign',
    exportedAt: new Date().toISOString(),
    freedomCert: 'Anti-Monopoly & Zero Lock-in Verified',
    notes: localStorage.getItem('libredroid_notes') ? JSON.parse(localStorage.getItem('libredroid_notes')!) : [],
    installedApks: localStorage.getItem('libredroid_installed_apks') ? JSON.parse(localStorage.getItem('libredroid_installed_apks')!) : [],
    systemConfig: {
      pushProvider: 'UnifiedPush (ntfy.sh)',
      locationProvider: 'OpenStreetMap Nominatim / Hardware GPS',
      browserSearchEngine: 'DuckDuckGo / SearXNG',
      appRepositories: DEFAULT_REPOSITORIES,
    },
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPackage, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `libredroid-sovereign-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
