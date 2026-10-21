import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  DeviceMode, 
  SystemNotification, 
  UserAccount, 
  QuickSettingsState, 
  SystemWallpaper 
} from '../types/system';

export const WALLPAPERS: SystemWallpaper[] = [
  {
    id: 'material-waves',
    name: 'Material Cosmic Waves',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2000&q=80',
    themeColor: '#7c4dff',
  },
  {
    id: 'aurora-borealis',
    name: 'Android Emerald Aurora',
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=2000&q=80',
    themeColor: '#00bfa5',
  },
  {
    id: 'cyber-dusk',
    name: 'Pixel Sunset Dunes',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80',
    themeColor: '#ff6d00',
  },
  {
    id: 'deep-space',
    name: 'Deep Nebula',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=80',
    themeColor: '#3d5afe',
  },
];

interface SystemContextType {
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  actualDevice: 'phone' | 'tablet' | 'foldable' | 'desktop';
  isFolded: boolean;
  setIsFolded: (folded: boolean) => void;
  currentTime: Date;
  batteryLevel: number;
  isCharging: boolean;
  quickSettings: QuickSettingsState;
  toggleQuickSetting: (key: keyof QuickSettingsState) => void;
  setQuickSettingValue: (key: 'volume' | 'brightness', value: number) => void;
  notifications: SystemNotification[];
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notif: Omit<SystemNotification, 'id' | 'time' | 'read'>) => void;
  account: UserAccount;
  syncAccount: () => void;
  wallpaper: SystemWallpaper;
  setWallpaper: (wp: SystemWallpaper) => void;
  isShadeOpen: boolean;
  setIsShadeOpen: (open: boolean) => void;
  isAppDrawerOpen: boolean;
  setIsAppDrawerOpen: (open: boolean) => void;
  isRecentsOpen: boolean;
  setIsRecentsOpen: (open: boolean) => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('auto');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isFolded, setIsFolded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [isCharging, setIsCharging] = useState(false);
  const [wallpaper, setWallpaper] = useState<SystemWallpaper>(WALLPAPERS[0]);

  const [isShadeOpen, setIsShadeOpen] = useState(false);
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState(false);
  const [isRecentsOpen, setIsRecentsOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const [quickSettings, setQuickSettings] = useState<QuickSettingsState>({
    wifi: true,
    bluetooth: true,
    airplane: false,
    flashlight: false,
    dnd: false,
    autoRotate: true,
    batterySaver: false,
    location: true,
    volume: 75,
    brightness: 85,
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: '1',
      appId: 'system',
      appName: 'Omni System',
      title: 'Universal Android Ready',
      body: 'Adapting seamlessly between Phone, Tablet, Foldable & Desktop modes.',
      time: 'Just now',
      read: false,
    },
    {
      id: '2',
      appId: 'store',
      appName: 'Play Store',
      title: '3 Updates Available',
      body: 'Chrome, Notes, and Terminal updated for high-DPI responsive layouts.',
      time: '12m ago',
      read: false,
    },
    {
      id: '3',
      appId: 'files',
      appName: 'Google Drive Sync',
      title: 'Cross-Device Sync Complete',
      body: '14.2 GB of cloud files synchronized with Omni Cloud profile.',
      time: '1h ago',
      read: true,
    },
  ]);

  const [account, setAccount] = useState<UserAccount>({
    name: 'Universal User',
    email: 'user@omni-android.system',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    syncedDevicesCount: 4,
    storageUsedGb: 14.2,
    storageTotalGb: 100,
    lastSynced: 'Just now',
  });

  // Track window resizing for auto detection
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Resolve actual mode
  const actualDevice: 'phone' | 'tablet' | 'foldable' | 'desktop' = 
    deviceMode !== 'auto' 
      ? (deviceMode as 'phone' | 'tablet' | 'foldable' | 'desktop')
      : windowWidth < 640 
        ? 'phone' 
        : windowWidth < 1024 
          ? 'tablet' 
          : 'desktop';

  const toggleQuickSetting = (key: keyof QuickSettingsState) => {
    setQuickSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setQuickSettingValue = (key: 'volume' | 'brightness', value: number) => {
    setQuickSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (notif: Omit<SystemNotification, 'id' | 'time' | 'read'>) => {
    const newNotif: SystemNotification = {
      ...notif,
      id: Math.random().toString(36).substring(2, 9),
      time: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const syncAccount = () => {
    setAccount((prev) => ({
      ...prev,
      lastSynced: 'Synchronized just now',
    }));
    addNotification({
      appId: 'system',
      appName: 'Omni Sync',
      title: 'Cloud State Synced',
      body: 'All device tabs, files, and preferences are synchronized across your universal devices.',
    });
  };

  return (
    <SystemContext.Provider
      value={{
        deviceMode,
        setDeviceMode,
        actualDevice,
        isFolded,
        setIsFolded,
        currentTime,
        batteryLevel,
        isCharging,
        quickSettings,
        toggleQuickSetting,
        setQuickSettingValue,
        notifications,
        dismissNotification,
        clearAllNotifications,
        addNotification,
        account,
        syncAccount,
        wallpaper,
        setWallpaper,
        isShadeOpen,
        setIsShadeOpen,
        isAppDrawerOpen,
        setIsAppDrawerOpen,
        isRecentsOpen,
        setIsRecentsOpen,
        isAssistantOpen,
        setIsAssistantOpen,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem must be used within SystemProvider');
  return context;
};
