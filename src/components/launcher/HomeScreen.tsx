import React from 'react';
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
  const { actualDevice, setIsAppDrawerOpen } = useSystem();
  const { openApp } = useWindow();
  const { persona, openWizard } = usePersona();

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

  return (
    <div className="flex-1 w-full flex flex-col justify-between p-3 sm:p-6 overflow-hidden select-none">
      {/* Top: At A Glance Widget or Live Defense Banner */}
      <div className="w-full max-w-xl mx-auto space-y-2">
        {persona.showAtAGlance && <AtAGlanceWidget />}

        {/* Privacy Purist Sentinel Status Banner */}
        {persona.showLiveThreatStats && (
          <div 
            onClick={() => openApp('predatory_shield')}
            className="cursor-pointer bg-neutral-900/80 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-2.5 flex items-center justify-between text-xs text-white shadow-lg hover:border-cyan-400 transition-colors"
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
          <div className="bg-amber-950/70 backdrop-blur-xl border-2 border-amber-500/80 rounded-2xl p-3 flex items-center justify-between text-white shadow-xl">
            <div className="flex items-center gap-3">
              <HeartPulse size={24} className="text-amber-400 shrink-0 animate-pulse" />
              <div>
                <div className="font-extrabold text-sm sm:text-base text-amber-200">Simplified Senior Mode Active</div>
                <div className="text-xs text-neutral-300">Large touch buttons • 100% Deceptive Ads & Scams Blocked</div>
              </div>
            </div>
            <button
              onClick={() => openApp('predatory_shield')}
              className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3 py-1.5 rounded-xl text-xs uppercase shadow-md active:scale-95 transition-all"
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
              onClick={() => openApp(app.id)}
              className="flex flex-col items-center justify-center gap-1.5 group transition-transform active:scale-95"
            >
              <div className="group-hover:scale-105 transition-transform duration-200">
                <AppIcon 
                  appId={app.id} 
                  size={iconSize as any} 
                  badge={app.badge} 
                />
              </div>
              <span className={`text-white drop-shadow-md text-center truncate ${
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
              onClick={() => setIsAppDrawerOpen(true)}
              className="flex items-center gap-1 text-[11px] text-white/70 hover:text-white transition-colors"
            >
              <ChevronUp size={16} className="animate-bounce" />
              <span>Swipe up for all apps & adapt settings</span>
            </button>

            {/* Dock with previous OS styling (iOS glassmorphism vs Android dock) */}
            <div className={`w-full p-3 flex items-center justify-around shadow-2xl transition-all ${
              persona.navigationStyle === 'ios_homebar'
                ? 'bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl'
                : 'bg-neutral-900/70 backdrop-blur-2xl border border-neutral-700/60 rounded-3xl'
            }`}>
              {dockApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => openApp(app.id)}
                  className="hover:scale-110 active:scale-95 transition-transform"
                  title={app.name}
                >
                  <AppIcon appId={app.id} size={iconSize as any} />
                </button>
              ))}

              {/* Quick Persona Morph shortcut in dock */}
              <button
                onClick={() => openApp('persona_engine')}
                className="hover:scale-110 active:scale-95 transition-transform"
                title="Adapt OS Persona"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${accent.gradient} flex items-center justify-center text-white shadow-lg`}>
                  <Sparkles size={20} />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
