import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppId, WindowInstance } from '../types/apps';
import { useSystem } from './SystemContext';
import { OsDomainId } from '../services/multiOsHypervisor';

interface WindowContextType {
  windows: WindowInstance[];
  activeWindowId: string | null;
  openApp: (appId: AppId, title?: string, domain?: OsDomainId) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  closeAll: () => void;
  activeAppId: AppId | null;
  returnHome: () => void;
  goBack: () => void;
  purgeDisposableWindows: () => void;
  updateWindowDomain: (id: string, domain: OsDomainId) => void;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

const APP_TITLES: Record<string, string> = {
  browser: 'LibreBrowse (Tor Routed)',
  files: 'Nextcloud Files Hub',
  settings: 'System Settings',
  camera: 'Open Camera',
  terminal: 'Disposable Alpine Shell',
  calculator: 'LibreCalc',
  notes: 'Joplin Vault Notes',
  store: 'F-Droid Store',
  clock: 'Clock',
  photos: 'Immich Gallery',
  hardware: 'Hardware HAL Manager',
  guardian: 'Anti-Monopoly Core',
  predatory_shield: 'Anti-Predatory Shield',
  security: 'Security Guardrails',
  linux_sandbox: 'Linux Sandboxing',
  hypervisor: 'Multi-OS Hypervisor Matrix',
  apk_installer: 'APK Package Installer',
  system_installer: 'Hardware OS Installer',
};

const DEFAULT_APP_DOMAINS: Record<string, OsDomainId> = {
  browser: 'anonymity-whonix',
  notes: 'vault-airgap',
  settings: 'vault-airgap',
  terminal: 'disposable-alpine',
  files: 'workstation-debian',
  calculator: 'workstation-debian',
  clock: 'workstation-debian',
  photos: 'workstation-debian',
  hardware: 'workstation-debian',
  guardian: 'vault-airgap',
  security: 'vault-airgap',
  linux_sandbox: 'workstation-debian',
  hypervisor: 'vault-airgap',
  apk_installer: 'hardened-android',
  system_installer: 'vault-airgap',
};

export const WindowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { actualDevice, setIsRecentsOpen, setIsAppDrawerOpen, addNotification } = useSystem();
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [nextZ, setNextZ] = useState(10);

  const activeWindow = windows.find((w) => w.id === activeWindowId);
  const activeAppId = activeWindow && !activeWindow.isMinimized ? activeWindow.appId : null;

  const openApp = (appId: AppId, customTitle?: string, domain?: OsDomainId) => {
    setIsRecentsOpen(false);
    setIsAppDrawerOpen(false);

    // Resolve security domain
    const targetDomain: OsDomainId = domain || DEFAULT_APP_DOMAINS[appId] || (appId.startsWith('org.') || appId.startsWith('com.') ? 'hardened-android' : 'workstation-debian');

    // Check if an instance already exists
    const existing = windows.find((w) => w.appId === appId);
    if (existing) {
      setWindows((prev) =>
        prev.map((w) =>
          w.id === existing.id
            ? { ...w, isMinimized: false, zIndex: nextZ + 1, osDomain: targetDomain }
            : w
        )
      );
      setActiveWindowId(existing.id);
      setNextZ((z) => z + 1);
      return;
    }

    // Sizing
    const isDesktop = actualDevice === 'desktop';
    const initialWidth = isDesktop ? Math.min(840, window.innerWidth - 80) : window.innerWidth;
    const initialHeight = isDesktop ? Math.min(600, window.innerHeight - 120) : window.innerHeight;

    const offset = (windows.length % 5) * 28;
    const initialX = isDesktop ? 60 + offset : 0;
    const initialY = isDesktop ? 40 + offset : 0;

    const newWindow: WindowInstance = {
      id: Math.random().toString(36).substring(2, 9),
      appId,
      title: customTitle || APP_TITLES[appId] || 'App',
      isMinimized: false,
      isMaximized: !isDesktop,
      zIndex: nextZ + 1,
      position: { x: initialX, y: initialY },
      size: { width: initialWidth, height: initialHeight },
      osDomain: targetDomain,
    };

    setNextZ((z) => z + 1);
    setWindows((prev) => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
  };

  const closeWindow = (id: string) => {
    const targetWin = windows.find((w) => w.id === id);
    if (targetWin?.osDomain === 'disposable-alpine') {
      addNotification({
        appId: 'hypervisor',
        appName: 'Ephemeral Disposable VM',
        title: 'MicroVM Sanitized & Purged',
        body: `Ephemeral domain for ${targetWin.title} was destroyed. All temporary RAM purged.`,
      });
    }

    setWindows((prev) => prev.filter((w) => w.id !== id));
    if (activeWindowId === id) {
      const remaining = windows.filter((w) => w.id !== id);
      if (remaining.length > 0) {
        setActiveWindowId(remaining[remaining.length - 1].id);
      } else {
        setActiveWindowId(null);
      }
    }
  };

  const purgeDisposableWindows = () => {
    const disposableCount = windows.filter((w) => w.osDomain === 'disposable-alpine').length;
    setWindows((prev) => prev.filter((w) => w.osDomain !== 'disposable-alpine'));
    addNotification({
      appId: 'hypervisor',
      appName: 'Qubes Hypervisor Core',
      title: 'Disposable Domains Wiped',
      body: `Permanently destroyed ${disposableCount} ephemeral microVM instance(s) from memory.`,
    });
  };

  const updateWindowDomain = (id: string, domain: OsDomainId) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, osDomain: domain } : w))
    );
    addNotification({
      appId: 'hypervisor',
      appName: 'Hypervisor Migration',
      title: 'Domain Switched',
      body: `Window migrated to security domain: ${domain}.`,
    });
  };

  const minimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
    if (activeWindowId === id) {
      const remaining = windows.filter((w) => w.id !== id && !w.isMinimized);
      setActiveWindowId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  const maximizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  };

  const focusWindow = (id: string) => {
    setActiveWindowId(id);
    setNextZ((z) => z + 1);
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, isMinimized: false, zIndex: nextZ + 1 } : w
      )
    );
  };

  const updateWindowPosition = (id: string, x: number, y: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, position: { x, y } } : w))
    );
  };

  const updateWindowSize = (id: string, width: number, height: number) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              size: {
                width: Math.max(340, width),
                height: Math.max(260, height),
              },
            }
          : w
      )
    );
  };

  const closeAll = () => {
    setWindows([]);
    setActiveWindowId(null);
    setIsRecentsOpen(false);
  };

  const returnHome = () => {
    if (actualDevice !== 'desktop') {
      setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: true })));
      setActiveWindowId(null);
    }
    setIsRecentsOpen(false);
    setIsAppDrawerOpen(false);
  };

  const goBack = () => {
    if (activeWindowId) {
      minimizeWindow(activeWindowId);
    }
  };

  return (
    <WindowContext.Provider
      value={{
        windows,
        activeWindowId,
        openApp,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        focusWindow,
        updateWindowPosition,
        updateWindowSize,
        closeAll,
        activeAppId,
        returnHome,
        goBack,
        purgeDisposableWindows,
        updateWindowDomain,
      }}
    >
      {children}
    </WindowContext.Provider>
  );
};

export const useWindow = () => {
  const context = useContext(WindowContext);
  if (!context) throw new Error('useWindow must be used within WindowProvider');
  return context;
};
