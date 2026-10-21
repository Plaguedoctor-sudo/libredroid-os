import { AppMetadata } from '../types/apps';

export interface SideloadedApk {
  id: string;
  name: string;
  packageName: string;
  version: string;
  size: string;
  iconBg: string;
  iconName: string;
  permissions: string[];
  installedAt: string;
  category: 'foss' | 'media' | 'utility' | 'productivity';
  description: string;
  customData?: string;
}

const STORAGE_KEY = 'libredroid_installed_apks';

export const DEFAULT_FOSS_APKS: SideloadedApk[] = [
  {
    id: 'org.videolan.vlc',
    name: 'VLC Media Player',
    packageName: 'org.videolan.vlc',
    version: '3.5.4',
    size: '34.2 MB',
    iconBg: 'bg-gradient-to-tr from-orange-500 to-amber-600',
    iconName: 'Film',
    permissions: ['STORAGE', 'AUDIO', 'NETWORK'],
    installedAt: 'Pre-installed',
    category: 'media',
    description: 'The open-source multi-format video and audio player with no tracking or ads.',
  },
  {
    id: 'org.schabi.newpipe',
    name: 'NewPipe',
    packageName: 'org.schabi.newpipe',
    version: '0.27.0',
    size: '14.8 MB',
    iconBg: 'bg-gradient-to-tr from-red-600 to-rose-700',
    iconName: 'Tv',
    permissions: ['NETWORK', 'STORAGE'],
    installedAt: 'Pre-installed',
    category: 'media',
    description: 'Lightweight YouTube & streaming frontend built without proprietary Google Services.',
  },
  {
    id: 'net.osmand.plus',
    name: 'OsmAnd Maps',
    packageName: 'net.osmand.plus',
    version: '4.7.2',
    size: '58.4 MB',
    iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-600',
    iconName: 'MapPin',
    permissions: ['LOCATION', 'STORAGE', 'NETWORK'],
    installedAt: 'Pre-installed',
    category: 'utility',
    description: 'Global offline maps and turn-by-turn navigation based on OpenStreetMap.',
  },
  {
    id: 'im.vector.app',
    name: 'Element (Matrix)',
    packageName: 'im.vector.app',
    version: '1.6.8',
    size: '42.1 MB',
    iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-700',
    iconName: 'MessageSquare',
    permissions: ['NETWORK', 'NOTIFICATIONS', 'CAMERA'],
    installedAt: 'Pre-installed',
    category: 'productivity',
    description: 'Secure, end-to-end encrypted decentralized messenger powered by the Matrix protocol.',
  },
  {
    id: 'com.fsck.k9',
    name: 'K-9 Mail',
    packageName: 'com.fsck.k9',
    version: '6.800',
    size: '18.3 MB',
    iconBg: 'bg-gradient-to-tr from-blue-700 to-indigo-800',
    iconName: 'Mail',
    permissions: ['NETWORK', 'STORAGE'],
    installedAt: 'Pre-installed',
    category: 'productivity',
    description: 'Independent open source email client for Android with OpenPGP encryption support.',
  },
];

export const getInstalledApks = (): SideloadedApk[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FOSS_APKS));
    return DEFAULT_FOSS_APKS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_FOSS_APKS;
  }
};

export const saveInstalledApk = (apk: SideloadedApk): SideloadedApk[] => {
  const current = getInstalledApks();
  const exists = current.find((a) => a.packageName === apk.packageName);
  let updated: SideloadedApk[];
  if (exists) {
    updated = current.map((a) => (a.packageName === apk.packageName ? apk : a));
  } else {
    updated = [apk, ...current];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const uninstallApk = (packageName: string): SideloadedApk[] => {
  const current = getInstalledApks();
  const updated = current.filter((a) => a.packageName !== packageName);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const parseApkFile = async (file: File): Promise<SideloadedApk> => {
  // Sideload APK parser: Extracts metadata from the filename and simulated APK manifest
  const rawName = file.name.replace(/\.apk$/i, '');
  const cleanName = rawName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const pkgBase = rawName.toLowerCase().replace(/[^a-z0-9]/g, '.');
  const packageName = `org.sideload.${pkgBase}`;
  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);

  return {
    id: packageName,
    name: cleanName || 'Sideloaded App',
    packageName,
    version: '1.0.0-sideload',
    size: `${fileSizeMb} MB`,
    iconBg: 'bg-gradient-to-tr from-cyan-600 to-blue-700',
    iconName: 'Layers',
    permissions: ['STORAGE', 'NETWORK', 'SENSORS'],
    installedAt: 'Just now',
    category: 'foss',
    description: `Independent Android APK package installed directly via LibreDroid Waydroid Container.`,
  };
};
