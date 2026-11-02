export type DeviceMode = 'phone' | 'tablet' | 'foldable' | 'desktop' | 'auto';
export type InterfaceMode = 'standard_android' | 'qubes_matrix';

export interface DeviceConfig {
  mode: DeviceMode;
  actualMode: 'phone' | 'tablet' | 'foldable' | 'desktop';
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isFolded?: boolean;
}

export interface SystemNotification {
  id: string;
  appId: string;
  appName: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon?: string;
  actions?: { label: string; action: () => void }[];
}

export interface UserAccount {
  name: string;
  email: string;
  avatarUrl: string;
  syncedDevicesCount: number;
  storageUsedGb: number;
  storageTotalGb: number;
  lastSynced: string;
}

export interface QuickSettingsState {
  wifi: boolean;
  bluetooth: boolean;
  airplane: boolean;
  flashlight: boolean;
  dnd: boolean;
  autoRotate: boolean;
  batterySaver: boolean;
  location: boolean;
  volume: number; // 0 - 100
  brightness: number; // 10 - 100
  network5g?: boolean;
}

export interface SystemWallpaper {
  id: string;
  name: string;
  url: string;
  themeColor: string;
}

export interface VFile {
  id: string;
  name: string;
  isFolder: boolean;
  parentId: string | null;
  size?: string;
  modified: string;
  content?: string;
  icon?: string;
}

export interface LockSettings {
  isLocked: boolean;
  pin: string;
  autoLockTimeoutSeconds: number;
  showNotificationsOnLockScreen: boolean;
  biometricsEnabled: boolean;
}

