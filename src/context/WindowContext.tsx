import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppId, WindowInstance } from '../types/apps';
import { useSystem } from './SystemContext';

interface WindowContextType {
  windows: WindowInstance[];
  activeWindowId: string | null;
  openApp: (appId: AppId, title?: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  closeAll: () => void;
  activeAppId: AppId | null; // For phone mode single app view
  returnHome: () => void;
  goBack: () => void;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

const APP_TITLES: Record<AppId, string> = {
  browser: 'Google Chrome',
  files: 'Files / Drive',
  settings: 'System Settings',
  camera: 'Camera',
  terminal: 'Omni Terminal',
  calculator: 'Calculator',
  notes: 'Google Keep Notes',
  store: 'Play Store',
  clock: 'Clock & Timer',
  photos: 'Photos Gallery',
};

export const WindowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { actualDevice, setIsRecentsOpen, setIsAppDrawerOpen } = useSystem();
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [nextZ, setNextZ] = useState(10);

  const activeWindow = windows.find((w) => w.id === activeWindowId);
  const activeAppId = activeWindow && !activeWindow.isMinimized ? activeWindow.appId : null;

  const openApp = (appId: AppId, customTitle?: string) => {
    setIsRecentsOpen(false);
    setIsAppDrawerOpen(false);

    // Check if an instance already exists
    const existing = windows.find((w) => w.appId === appId);
    if (existing) {
      setWindows((prev) =>
        prev.map((w) =>
          w.id === existing.id
            ? { ...w, isMinimized: false, zIndex: nextZ + 1 }
            : w
        )
      );
      setActiveWindowId(existing.id);
      setNextZ((z) => z + 1);
      return;
    }

    // Default sizing based on device
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
      isMaximized: !isDesktop, // phone & tablet maximize by default
      zIndex: nextZ + 1,
      position: { x: initialX, y: initialY },
      size: { width: initialWidth, height: initialHeight },
    };

    setNextZ((z) => z + 1);
    setWindows((prev) => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
  };

  const closeWindow = (id: string) => {
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
    // In phone/tablet mode, minimize all to reveal home screen
    if (actualDevice !== 'desktop') {
      setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: true })));
      setActiveWindowId(null);
    }
    setIsRecentsOpen(false);
    setIsAppDrawerOpen(false);
  };

  const goBack = () => {
    if (activeWindowId) {
      // simulate back / minimize
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
