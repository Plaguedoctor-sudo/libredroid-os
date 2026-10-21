import React from 'react';
import { ChevronUp, Download, HardDrive } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { SYSTEM_APPS } from '../../constants/apps';
import { AppIcon } from '../common/AppIcon';
import { AtAGlanceWidget } from './AtAGlanceWidget';
import { GoogleSearchPill } from './GoogleSearchPill';

export const HomeScreen: React.FC = () => {
  const { actualDevice, setIsAppDrawerOpen } = useSystem();
  const { openApp } = useWindow();

  // Favorite apps on home screen
  const homeApps = SYSTEM_APPS.slice(0, 8);
  const dockApps = [SYSTEM_APPS[0], SYSTEM_APPS[1], SYSTEM_APPS[2], SYSTEM_APPS[4]]; // F-Droid, LibreBrowse, APK Installer, Nextcloud

  return (
    <div className="flex-1 w-full flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none">
      {/* Top: At A Glance Widget */}
      <div className="w-full max-w-xl mx-auto">
        <AtAGlanceWidget />
      </div>

      {/* Middle: Grid of App Shortcuts */}
      <div className="flex-1 flex items-center justify-center py-4">
        <div className={`grid gap-6 sm:gap-8 justify-items-center max-w-xl w-full ${
          actualDevice === 'phone' ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-4'
        }`}>
          {homeApps.map((app) => (
            <button
              key={app.id}
              onClick={() => openApp(app.id)}
              className="flex flex-col items-center justify-center gap-2 group transition-transform active:scale-95"
            >
              <div className="group-hover:scale-105 transition-transform duration-200">
                <AppIcon 
                  appId={app.id} 
                  size={actualDevice === 'phone' ? 'md' : 'lg'} 
                  badge={app.badge} 
                />
              </div>
              <span className="text-xs font-medium text-white drop-shadow-md group-hover:text-emerald-200 text-center truncate max-w-[80px]">
                {app.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Area: Privacy Search pill + Pinned Dock */}
      <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
        {/* DuckDuckGo / SearXNG Privacy Search Pill */}
        <GoogleSearchPill />

        {/* Pinned Bottom Dock */}
        {actualDevice !== 'desktop' && (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setIsAppDrawerOpen(true)}
              className="flex items-center gap-1 text-[11px] text-white/70 hover:text-white transition-colors"
            >
              <ChevronUp size={16} className="animate-bounce" />
              <span>Swipe up for all FOSS apps & APKs</span>
            </button>

            <div className="w-full bg-neutral-900/60 backdrop-blur-2xl border border-neutral-700/60 rounded-3xl p-3 flex items-center justify-around shadow-xl">
              {dockApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => openApp(app.id)}
                  className="hover:scale-105 active:scale-95 transition-transform"
                  title={app.name}
                >
                  <AppIcon appId={app.id} size={actualDevice === 'phone' ? 'md' : 'lg'} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
