import React from 'react';
import { 
  Grid, 
  Wifi, 
  Volume2, 
  BatteryMedium, 
  Bell, 
  Search,
  Sparkles
} from 'lucide-react';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { SYSTEM_APPS } from '../../constants/apps';
import { AppIcon } from '../common/AppIcon';

export const Taskbar: React.FC = () => {
  const { windows, activeWindowId, focusWindow, openApp } = useWindow();
  const { 
    isAppDrawerOpen, 
    setIsAppDrawerOpen, 
    setIsShadeOpen, 
    currentTime, 
    batteryLevel, 
    quickSettings, 
    notifications,
    setIsAssistantOpen
  } = useSystem();

  return (
    <footer className="w-full h-12 bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-800 text-white flex items-center justify-between px-3 z-40 select-none shadow-2xl">
      {/* Left: App Drawer Launcher + Google Assistant shortcut */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsAppDrawerOpen(!isAppDrawerOpen)}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            isAppDrawerOpen 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'hover:bg-neutral-800 text-neutral-300 hover:text-white'
          }`}
          title="Apps Menu"
        >
          <Grid size={20} />
        </button>

        <button
          onClick={() => setIsAssistantOpen(true)}
          className="p-2 rounded-xl hover:bg-neutral-800 text-amber-400 hover:text-amber-300 transition-colors flex items-center justify-center"
          title="Omni Assistant"
        >
          <Sparkles size={18} />
        </button>
      </div>

      {/* Center: Running / Pinned Apps */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60%] px-2">
        {SYSTEM_APPS.slice(0, 6).map((app) => {
          const isRunning = windows.some((w) => w.appId === app.id);
          const isActive = windows.some((w) => w.appId === app.id && w.id === activeWindowId && !w.isMinimized);

          return (
            <button
              key={app.id}
              onClick={() => {
                const existing = windows.find((w) => w.appId === app.id);
                if (existing) {
                  focusWindow(existing.id);
                } else {
                  openApp(app.id);
                }
              }}
              className={`relative p-1.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
                isActive 
                  ? 'bg-neutral-700/80 shadow-inner' 
                  : 'hover:bg-neutral-800/60'
              }`}
              title={app.name}
            >
              <AppIcon appId={app.id} size="sm" />
              {isRunning && (
                <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-purple-400' : 'bg-neutral-400'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Right: System Tray & Clock */}
      <div 
        onClick={() => setIsShadeOpen(true)}
        className="flex items-center gap-3 px-3 py-1 rounded-xl hover:bg-neutral-800/70 transition-colors cursor-pointer"
        title="Quick Settings & Status"
      >
        <div className="flex items-center gap-2 text-neutral-300 text-xs">
          {quickSettings.wifi && <Wifi size={14} />}
          <Volume2 size={14} />
          <div className="flex items-center gap-1">
            <span className="font-mono text-[11px]">{batteryLevel}%</span>
            <BatteryMedium size={14} />
          </div>
          {notifications.length > 0 && (
            <div className="relative">
              <Bell size={14} className="text-purple-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
            </div>
          )}
        </div>

        <div className="border-l border-neutral-700 pl-3 text-right">
          <div className="text-xs font-semibold tracking-wide">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-[10px] text-neutral-400">
            {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>
    </footer>
  );
};
