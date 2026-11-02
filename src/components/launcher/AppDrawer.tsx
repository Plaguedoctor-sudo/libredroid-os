import React, { useState } from 'react';
import { Search, X, Box, Upload, Pin, PinOff } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { useVirtualKeyboard } from '../../context/KeyboardContext';
import { usePersona } from '../../context/PersonaContext';
import { SYSTEM_APPS } from '../../constants/apps';
import { getInstalledApks } from '../../services/apkManager';
import { getInstalledAppleApps } from '../../services/appleAppManager';
import { AppIcon } from '../common/AppIcon';

export const AppDrawer: React.FC = () => {
  const { isAppDrawerOpen, setIsAppDrawerOpen, actualDevice, addNotification } = useSystem();
  const { openApp } = useWindow();
  const { openKeyboard, closeKeyboard, isKeyboardOpen } = useVirtualKeyboard();
  const { persona, updatePersona } = usePersona();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isAppDrawerOpen) return null;

  const togglePinToHome = (e: React.MouseEvent, appId: string, appName: string) => {
    e.stopPropagation();
    const isPinned = persona.homeApps.includes(appId);
    if (isPinned) {
      updatePersona({ homeApps: persona.homeApps.filter(id => id !== appId) });
      addNotification({
        appId: 'system',
        appName: 'Launcher',
        title: 'Removed from Home',
        body: `${appName} unpinned from Home Screen.`,
      });
    } else {
      updatePersona({ homeApps: [...persona.homeApps, appId] });
      addNotification({
        appId: 'system',
        appName: 'Launcher',
        title: 'Pinned to Home',
        body: `${appName} added to Home Screen!`,
      });
    }
  };

  const sideloadedApks = getInstalledApks().map((apk) => ({
    id: apk.id,
    name: apk.name,
    icon: apk.iconName,
    color: 'from-blue-600 to-indigo-700',
    category: apk.category as any,
    isApk: true,
    isApple: false,
    platform: 'Android',
  }));

  const sideloadedAppleApps = getInstalledAppleApps().map((apple) => ({
    id: apple.id,
    name: apple.name,
    icon: apple.iconName,
    color: 'from-rose-500 to-pink-600',
    category: apple.category as any,
    isApk: false,
    isApple: true,
    platform: 'Apple iOS',
  }));

  const allApps = [...SYSTEM_APPS, ...sideloadedApks, ...sideloadedAppleApps];

  const filteredApps = allApps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = 
      selectedCategory === 'all' || 
      app.category === selectedCategory ||
      (selectedCategory === 'apple' && ('isApple' in app && app.isApple)) ||
      (selectedCategory === 'android' && ('isApk' in app && app.isApk));
    return matchesSearch && matchesCategory;
  });

  const handleSearchTap = (e?: React.MouseEvent | React.FocusEvent) => {
    e?.stopPropagation();
    openKeyboard({
      value: searchQuery,
      onChange: (val) => setSearchQuery(val),
      onEnter: () => closeKeyboard(),
      placeholder: 'Search FOSS apps, APK packages, system tools...',
    });
  };

  const handleCloseDrawer = () => {
    closeKeyboard();
    setIsAppDrawerOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-end sm:justify-center p-3 sm:p-6 animate-fade-in select-none"
      onClick={handleCloseDrawer}
    >
      <div 
        className="w-full max-w-2xl bg-neutral-900/95 border border-neutral-800 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 max-h-[85vh] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header & Search Column */}
        <div 
          onClick={handleSearchTap}
          className="flex items-center gap-3 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 hover:border-emerald-500/50 rounded-2xl px-3.5 py-2.5 cursor-pointer transition-all"
        >
          <Search size={18} className="text-neutral-400 shrink-0" />
          <input
            type="text"
            placeholder="Search FOSS apps, APK packages, system tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={handleSearchTap}
            inputMode="none"
            className="w-full bg-transparent text-white placeholder-neutral-500 text-sm focus:outline-none cursor-pointer"
          />
          {searchQuery && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
              }}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {['all', 'android', 'apple', 'foss', 'system', 'productivity', 'media', 'utility'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full capitalize text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                {cat === 'android' ? '🤖 Android' : cat === 'apple' ? '🍎 Apple OS' : cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setIsAppDrawerOpen(false);
              openApp('apk_installer');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600/30 to-rose-600/30 hover:from-emerald-600/50 hover:to-rose-600/50 text-white border border-neutral-700 rounded-full font-medium shrink-0 transition-colors text-xs"
          >
            <Upload size={13} />
            <span>Sideload App</span>
          </button>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-6 gap-x-4 py-4 overflow-y-auto max-h-[50vh] pr-1">
          {filteredApps.map((app) => {
            const isPinned = persona.homeApps.includes(app.id);
            return (
              <div
                key={app.id}
                onClick={() => {
                  openApp(app.id, app.name);
                  setIsAppDrawerOpen(false);
                }}
                className="relative flex flex-col items-center justify-center gap-2 group transition-transform active:scale-95 cursor-pointer"
              >
                <button
                  onClick={(e) => togglePinToHome(e, app.id, app.name)}
                  title={isPinned ? 'Unpin from Home Screen' : 'Pin to Home Screen'}
                  className={`absolute -top-1 right-2 sm:right-4 z-10 p-1 rounded-full transition-opacity opacity-0 group-hover:opacity-100 ${
                    isPinned ? 'bg-emerald-600/90 text-white opacity-80' : 'bg-neutral-800/90 text-neutral-300 hover:text-white'
                  }`}
                >
                  {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                </button>
                <div className="group-hover:scale-105 transition-transform">
                  <AppIcon appId={app.id} size={actualDevice === 'phone' ? 'md' : 'lg'} badge={'badge' in app ? app.badge : undefined} />
                </div>
                <span className="text-xs text-neutral-300 group-hover:text-white text-center truncate max-w-[80px]">
                  {app.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800">
          <span>LibreDroid Open Runtime • Waydroid Ready</span>
          <span className="text-emerald-400 font-mono">Free from Big Tech Lock-in</span>
        </div>
      </div>
    </div>
  );
};
