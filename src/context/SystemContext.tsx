import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  DeviceMode, 
  SystemNotification, 
  UserAccount, 
  QuickSettingsState, 
  SystemWallpaper 
} from '../types/system';
import { 
  HardwareSpecs, 
  AdaptivePolicy, 
  detectHardwareSpecs, 
  getAdaptivePolicyForHardware 
} from '../services/hardwareDetector';
import { PREDATORY_KEYWORDS } from '../services/antiPredatoryEngine';

export const WALLPAPERS: SystemWallpaper[] = [
  {
    id: 'material-waves',
    name: 'Cosmic Emerald Waves',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2000&q=80',
    themeColor: '#10b981',
  },
  {
    id: 'aurora-borealis',
    name: 'Nordic Aurora',
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=2000&q=80',
    themeColor: '#00bfa5',
  },
  {
    id: 'cyber-dusk',
    name: 'Dusk Mountain Peaks',
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
  // Hardware Abstraction & Adaptation
  hardwareSpecs: HardwareSpecs | null;
  adaptivePolicy: AdaptivePolicy | null;
  autoHardwareAdaptation: boolean;
  setAutoHardwareAdaptation: (val: boolean) => void;
  setManualTier: (tier: 'low-end' | 'mid-range' | 'flagship' | 'workstation') => void;
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

  // Hardware State
  const [hardwareSpecs, setHardwareSpecs] = useState<HardwareSpecs | null>(null);
  const [adaptivePolicy, setAdaptivePolicy] = useState<AdaptivePolicy | null>(null);
  const [autoHardwareAdaptation, setAutoHardwareAdaptation] = useState(true);

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
      appId: 'predatory_shield',
      appName: 'Anti-Predatory Shield',
      title: 'Attention & Privacy Sentinel Active',
      body: 'Deceptive dark patterns, fake urgency alerts, and wake-locks are blocked at the OS layer.',
      time: 'Just now',
      read: false,
    },
    {
      id: '2',
      appId: 'hardware',
      appName: 'HAL Engine',
      title: 'Hardware Profile Active',
      body: 'Operating system tuned for host CPU, RAM, and GPU capabilities.',
      time: '1m ago',
      read: false,
    },
  ]);

  const [account, setAccount] = useState<UserAccount>({
    name: 'Sovereign User',
    email: 'user@matrix.libredroid.local',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    syncedDevicesCount: 3,
    storageUsedGb: 18.4,
    storageTotalGb: 512,
    lastSynced: 'Just now',
  });

  // Hardware Probing on Mount
  useEffect(() => {
    detectHardwareSpecs().then((specs) => {
      setHardwareSpecs(specs);
      const policy = getAdaptivePolicyForHardware(specs);
      setAdaptivePolicy(policy);
      setBatteryLevel(specs.batteryLevel);
      setIsCharging(specs.isCharging);

      if (specs.batteryLevel <= 20 && !specs.isCharging) {
        setQuickSettings((prev) => ({ ...prev, batterySaver: true }));
      }
    });
  }, []);

  // Track window resizing
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
  const isTouchDevice = typeof navigator !== 'undefined' && 
    (navigator.maxTouchPoints > 0 || /Android|Tablet|Mobile/i.test(navigator.userAgent));

  const actualDevice: 'phone' | 'tablet' | 'foldable' | 'desktop' = 
    deviceMode !== 'auto' 
      ? (deviceMode as 'phone' | 'tablet' | 'foldable' | 'desktop')
      : isTouchDevice
        ? (windowWidth < 640 ? 'phone' : 'tablet')
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
    // OS-level anti-predatory spam inspection
    const fullText = `${notif.title} ${notif.body}`.toLowerCase();
    const isPredatorySpam = PREDATORY_KEYWORDS.some((kw) => fullText.includes(kw));

    if (isPredatorySpam) {
      // Quarantined! Send an ethical defense alert instead
      const quarantinedNotif: SystemNotification = {
        id: Math.random().toString(36).substring(2, 9),
        appId: 'predatory_shield',
        appName: 'Anti-Predatory Shield',
        title: 'Predatory Notification Intercepted',
        body: `Blocked artificial urgency push from "${notif.appName}": "${notif.title}".`,
        time: 'Just now',
        read: false,
      };
      setNotifications((prev) => [quarantinedNotif, ...prev]);
      return;
    }

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
      lastSynced: 'Synchronized to mesh just now',
    }));
    addNotification({
      appId: 'system',
      appName: 'Mesh Sync',
      title: 'Peer Nodes Synchronized',
      body: 'Encrypted Nextcloud vaults and Matrix sessions updated across your hardware devices.',
    });
  };

  const setManualTier = (tier: 'low-end' | 'mid-range' | 'flagship' | 'workstation') => {
    setAutoHardwareAdaptation(false);
    if (hardwareSpecs) {
      const updatedSpecs: HardwareSpecs = { ...hardwareSpecs, tier };
      setHardwareSpecs(updatedSpecs);
      setAdaptivePolicy(getAdaptivePolicyForHardware(updatedSpecs));
    }
  };

  // Expose global system state for testing and system automation
  useEffect(() => {
    (window as any).__libreSystem = {
      deviceMode,
      setDeviceMode,
      actualDevice,
      quickSettings,
      toggleQuickSetting,
      setQuickSettingValue,
      isShadeOpen,
      setIsShadeOpen,
      isAppDrawerOpen,
      setIsAppDrawerOpen,
      isRecentsOpen,
      setIsRecentsOpen,
      isAssistantOpen,
      setIsAssistantOpen,
      addNotification,
      clearAllNotifications,
    };
  }, [
    deviceMode,
    setDeviceMode,
    actualDevice,
    quickSettings,
    toggleQuickSetting,
    setQuickSettingValue,
    isShadeOpen,
    setIsShadeOpen,
    isAppDrawerOpen,
    setIsAppDrawerOpen,
    isRecentsOpen,
    setIsRecentsOpen,
    isAssistantOpen,
    setIsAssistantOpen,
    addNotification,
    clearAllNotifications,
  ]);

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
        hardwareSpecs,
        adaptivePolicy,
        autoHardwareAdaptation,
        setAutoHardwareAdaptation,
        setManualTier,
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
