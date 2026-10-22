import React, { useState } from 'react';
import { ChevronUp, Download, HardDrive, Sparkles, ShieldCheck, HeartPulse, Terminal } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { usePersona } from '../../context/PersonaContext';
import { SYSTEM_APPS } from '../../constants/apps';
import { AppIcon } from '../common/AppIcon';
import { AtAGlanceWidget } from './AtAGlanceWidget';
import { GoogleSearchPill } from './GoogleSearchPill';
import { getAccentColorClasses } from '../../services/personaEngine';

export const HomeScreen: React.FC = () => {
  const { actualDevice, setIsAppDrawerOpen, setIsShadeOpen } = useSystem();
  const { openApp } = useWindow();
  const { persona, openWizard } = usePersona();

  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const accent = getAccentColorClasses(persona.accentTheme);

  // Map user persona app IDs to actual AppMetadata
  const homeApps = persona.homeApps
    .map((id) => SYSTEM_APPS.find((app) => app.id === id))
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

  // Touch Swipe Gesture Detection (Swipe Up = App Drawer, Swipe Down = Quick Settings Shade)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    
    // Swipe Up (positive delta > 45px)
    if (deltaY > 45) {
      if (navigator.vibrate) navigator.vibrate(15);
      setIsAppDrawerOpen(true);
    } 
    // Swipe Down (negative delta < -55px)
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

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex-1 w-full flex flex-col justify-between p-3 sm:p-6 overflow-hidden select-none touch-manipulation"
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

      {/* Middle: Grid of App Shortcuts Adapted to Persona */}
      <div className="flex-1 flex items-center justify-center py-2 sm:py-4">
        <div className={`grid justify-items-center max-w-xl w-full ${
          isAccessible
            ? 'grid-cols-3 sm:grid-cols-4 gap-6 sm:gap-8'
            : actualDevice === 'phone' 
              ? 'grid-cols-4 gap-5' 
              : 'grid-cols-4 sm:grid-cols-4 gap-6 sm:gap-8'
        }`}>
          {homeApps.map((app) => (
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

            {/* Dock with previous OS styling (iOS glassmorphism vs Android dock) */}
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
    </div>
  );
};
