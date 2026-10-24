import React, { useState, useEffect } from 'react';
import { ChevronUp, Download, HardDrive, Sparkles, ShieldCheck, HeartPulse, Terminal, FolderPlus, Folder } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { usePersona } from '../../context/PersonaContext';
import { SYSTEM_APPS } from '../../constants/apps';
import { AppIcon } from '../common/AppIcon';
import { AtAGlanceWidget } from './AtAGlanceWidget';
import { GoogleSearchPill } from './GoogleSearchPill';
import { getAccentColorClasses } from '../../services/personaEngine';
import { AppFolderModal, HomeAppFolder } from './AppFolderModal';

const DEFAULT_HOME_FOLDERS: HomeAppFolder[] = [
  {
    id: 'folder-privacy',
    name: 'Privacy & Vault',
    color: 'from-emerald-600/30 to-teal-700/30',
    appIds: ['predatory_shield', 'security', 'hypervisor', 'guardian'],
  },
  {
    id: 'folder-tools',
    name: 'Tools & Dev',
    color: 'from-cyan-600/30 to-blue-700/30',
    appIds: ['terminal', 'linux_sandbox', 'system_installer', 'apk_installer'],
  },
];

export const HomeScreen: React.FC = () => {
  const { actualDevice, setIsAppDrawerOpen, setIsShadeOpen, addNotification } = useSystem();
  const { openApp } = useWindow();
  const { persona, openWizard } = usePersona();

  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Home Folders state with persistence
  const [folders, setFolders] = useState<HomeAppFolder[]>(() => {
    try {
      const stored = localStorage.getItem('libredroid_home_folders_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_HOME_FOLDERS;
  });

  const [activeFolderModal, setActiveFolderModal] = useState<HomeAppFolder | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('libredroid_home_folders_v2', JSON.stringify(folders));
    } catch {}
  }, [folders]);

  const accent = getAccentColorClasses(persona.accentTheme);

  // Apps inside any folder are grouped; loose apps are rendered directly
  const folderAppIds = new Set(folders.flatMap(f => f.appIds));

  // Map user persona app IDs to actual AppMetadata
  const standaloneHomeApps = persona.homeApps
    .filter(id => !folderAppIds.has(id))
    .map(id => SYSTEM_APPS.find(app => app.id === id))
    .filter(Boolean) as typeof SYSTEM_APPS;

  const dockApps = persona.dockApps
    .map((id) => SYSTEM_APPS.find((app) => app.id === id))
    .filter(Boolean) as typeof SYSTEM_APPS;

  const isAccessible = persona.uiDensity === 'accessible_large';
  const isCompact = persona.uiDensity === 'compact';

  const iconSize = isAccessible 
    ? (actualDevice === 'phone' ? 'lg' : 'xl')
    : isCompact
      ? 'sm'
      : (actualDevice === 'phone' ? 'md' : 'lg');

  // Touch Swipe Gesture Detection
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    
    // Swipe Up
    if (deltaY > 45) {
      if (navigator.vibrate) navigator.vibrate(15);
      setIsAppDrawerOpen(true);
    } 
    // Swipe Down
    else if (deltaY < -55) {
      if (navigator.vibrate) navigator.vibrate(15);
      setIsShadeOpen(true);
    }
    setTouchStartY(null);
  };

  const handleAppLaunch = (appId: string) => {
    if (navigator.vibrate) navigator.vibrate(15);
    openApp(appId);
  };

  const handleOpenFolder = (folder: HomeAppFolder) => {
    if (navigator.vibrate) navigator.vibrate(12);
    setActiveFolderModal(folder);
  };

  const handleUpdateFolder = (updated: HomeAppFolder) => {
    setFolders(prev => prev.map(f => f.id === updated.id ? updated : f));
    setActiveFolderModal(updated);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setActiveFolderModal(null);
    addNotification({
      appId: 'system',
      appName: 'Home Screen',
      title: 'Folder Dissolved',
      body: 'All applications restored to standalone home screen icons.',
    });
  };

  const handleCreateNewFolder = () => {
    const newFolder: HomeAppFolder = {
      id: `folder-${Date.now()}`,
      name: 'New Folder',
      color: 'from-violet-600/30 to-indigo-700/30',
      appIds: ['notes', 'files'],
    };
    setFolders(prev => [...prev, newFolder]);
    setActiveFolderModal(newFolder);
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex-1 w-full flex flex-col justify-between p-3 sm:p-6 overflow-hidden select-none touch-manipulation font-sans"
    >
      {/* Top: At A Glance Widget or Live Defense Banner */}
      <div className="w-full max-w-xl mx-auto space-y-2">
        {persona.showAtAGlance && <AtAGlanceWidget />}

        {/* Privacy Purist Sentinel Status Banner */}
        {persona.showLiveThreatStats && (
          <div 
            onClick={() => handleAppLaunch('predatory_shield')}
            className="cursor-pointer bg-neutral-900/80 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-2.5 flex items-center justify-between text-xs text-white shadow-lg hover:border-cyan-400 active:scale-98 transition-all touch-manipulation"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-cyan-300">Sovereign Sentinel: </span>
                <span className="text-neutral-300">100% False Telemetry Active • Sensors Sandboxed</span>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
              TOR / AIRGAP
            </span>
          </div>
        )}

        {/* Senior / Accessible 1-Touch Emergency & Help Banner */}
        {isAccessible && (
          <div className="bg-amber-950/70 backdrop-blur-xl border-2 border-amber-500/80 rounded-2xl p-3 flex items-center justify-between text-white shadow-xl touch-manipulation">
            <div className="flex items-center gap-3">
              <HeartPulse size={24} className="text-amber-400 shrink-0 animate-pulse" />
              <div>
                <div className="font-extrabold text-sm sm:text-base text-amber-200">Simplified Senior Mode Active</div>
                <div className="text-xs text-neutral-300">Large touch buttons • 100% Deceptive Ads & Scams Blocked</div>
              </div>
            </div>
            <button
              onClick={() => handleAppLaunch('predatory_shield')}
              className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3 py-1.5 rounded-xl text-xs uppercase shadow-md active:scale-95 transition-all touch-manipulation min-h-[38px] flex items-center justify-center"
            >
              Safe Shield
            </button>
          </div>
        )}
      </div>

      {/* Middle: Grid of App Shortcuts and Interactive Folders */}
      <div className="flex-1 flex items-center justify-center py-2 sm:py-4">
        <div className={`grid justify-items-center max-w-xl w-full ${
          isAccessible
            ? 'grid-cols-3 sm:grid-cols-4 gap-6 sm:gap-8'
            : actualDevice === 'phone' 
              ? 'grid-cols-4 gap-5' 
              : 'grid-cols-4 sm:grid-cols-4 gap-6 sm:gap-8'
        }`}>
          {/* 1. Standalone Apps */}
          {standaloneHomeApps.map((app) => (
            <button
              key={app.id}
              onClick={(e) => {
                e.stopPropagation();
                handleAppLaunch(app.id);
              }}
              className="flex flex-col items-center justify-center gap-1.5 group transition-transform active:scale-90 touch-manipulation cursor-pointer p-1 min-w-[64px] min-h-[64px]"
            >
              <div className="group-hover:scale-105 group-active:scale-95 transition-transform duration-150 pointer-events-none">
                <AppIcon 
                  appId={app.id} 
                  size={iconSize as any} 
                  badge={app.badge} 
                />
              </div>
              <span className={`text-white drop-shadow-md text-center truncate pointer-events-none ${
                isAccessible 
                  ? 'text-xs sm:text-sm font-bold max-w-[95px] text-amber-100' 
                  : 'text-xs font-medium group-hover:text-emerald-200 max-w-[80px]'
              }`}>
                {app.name}
              </span>
            </button>
          ))}

          {/* 2. Interactive Folders on Home Screen */}
          {folders.map((folder) => {
            const previewApps = folder.appIds
              .slice(0, 4)
              .map(id => SYSTEM_APPS.find(a => a.id === id))
              .filter(Boolean) as typeof SYSTEM_APPS;

            return (
              <button
                key={folder.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenFolder(folder);
                }}
                className="flex flex-col items-center justify-center gap-1.5 group transition-transform active:scale-90 touch-manipulation cursor-pointer p-1 min-w-[64px] min-h-[64px]"
              >
                {/* 2x2 Mini Preview Inside Translucent Chassis */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-neutral-900/75 border border-white/20 backdrop-blur-xl p-2 flex items-center justify-center shadow-lg group-hover:scale-105 group-active:scale-95 group-hover:border-emerald-500/50 transition-all pointer-events-none">
                  <div className="grid grid-cols-2 gap-1 w-full h-full place-items-center">
                    {previewApps.map(app => (
                      <div key={app.id} className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg flex items-center justify-center overflow-hidden">
                        <AppIcon appId={app.id} size="sm" className="scale-75 origin-center" />
                      </div>
                    ))}
                    {previewApps.length < 4 && (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg bg-neutral-800/40" />
                    )}
                  </div>
                </div>

                <span className="text-xs font-medium text-white group-hover:text-emerald-300 text-center max-w-[85px] truncate drop-shadow-md pointer-events-none">
                  {folder.name}
                </span>
              </button>
            );
          })}

          {/* "+ New Folder" action button on Home screen */}
          <button
            onClick={handleCreateNewFolder}
            className="flex flex-col items-center justify-center gap-1.5 group transition-transform active:scale-90 touch-manipulation cursor-pointer p-1 min-w-[64px] min-h-[64px]"
            title="Create Home Screen Folder"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl border-2 border-dashed border-neutral-700 group-hover:border-emerald-500/80 bg-neutral-900/40 backdrop-blur-md flex items-center justify-center text-neutral-400 group-hover:text-emerald-400 transition-all pointer-events-none">
              <FolderPlus size={22} />
            </div>
            <span className="text-xs font-medium text-neutral-400 group-hover:text-white text-center max-w-[80px] truncate pointer-events-none">
              + Folder
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Area: Privacy Search pill + Pinned Dock */}
      <div className="w-full max-w-lg mx-auto flex flex-col gap-3">
        {/* Search Pill */}
        <GoogleSearchPill />

        {/* Pinned Bottom Dock */}
        {actualDevice !== 'desktop' && (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                setIsAppDrawerOpen(true);
              }}
              className="flex items-center gap-1 text-[11px] text-white/80 hover:text-white transition-colors touch-manipulation py-1.5 px-3 rounded-full hover:bg-white/10 active:scale-95"
            >
              <ChevronUp size={16} className="animate-bounce" />
              <span>Swipe up for all apps & adapt settings</span>
            </button>

            {/* Dock */}
            <div className={`w-full p-3 flex items-center justify-around shadow-2xl transition-all ${
              persona.navigationStyle === 'ios_homebar'
                ? 'bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl'
                : 'bg-neutral-900/75 backdrop-blur-2xl border border-neutral-700/60 rounded-3xl'
            }`}>
              {dockApps.map((app) => (
                <button
                  key={app.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAppLaunch(app.id);
                  }}
                  className="hover:scale-110 active:scale-90 transition-transform touch-manipulation cursor-pointer p-1 min-w-[50px] min-h-[50px] flex items-center justify-center"
                  title={app.name}
                >
                  <AppIcon appId={app.id} size={iconSize as any} />
                </button>
              ))}

              {/* Quick Persona Morph shortcut in dock */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAppLaunch('persona_engine');
                }}
                className="hover:scale-110 active:scale-90 transition-transform touch-manipulation cursor-pointer p-1 min-w-[50px] min-h-[50px] flex items-center justify-center"
                title="Adapt OS Persona"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${accent.gradient} flex items-center justify-center text-white shadow-xl pointer-events-none`}>
                  <Sparkles size={22} />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* App Folder Modal Popup */}
      {activeFolderModal && (
        <AppFolderModal
          folder={activeFolderModal}
          isOpen={!!activeFolderModal}
          onClose={() => setActiveFolderModal(null)}
          onLaunchApp={handleAppLaunch}
          onUpdateFolder={handleUpdateFolder}
          onDeleteFolder={handleDeleteFolder}
        />
      )}
    </div>
  );
};
