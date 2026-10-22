import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  Terminal, 
  Eye, 
  Gamepad2, 
  Sliders, 
  Check, 
  Layers, 
  Lock, 
  RotateCcw, 
  RefreshCw, 
  Palette, 
  Compass, 
  Grid, 
  Tv, 
  Layout, 
  ShieldAlert, 
  Cpu, 
  Radio, 
  ExternalLink 
} from 'lucide-react';
import { usePersona } from '../../context/PersonaContext';
import { PersonaArchetype, NavigationStyle, UiDensity, SecurityLevel, AccentTheme } from '../../types/persona';
import { PERSONA_PRESETS, getAccentColorClasses } from '../../services/personaEngine';
import { SYSTEM_APPS } from '../../constants/apps';

export const UniversalPersonaApp: React.FC = () => {
  const { persona, updatePersona, applyPreset, openWizard, resetPersona } = usePersona();
  const [activeTab, setActiveTab] = useState<'archetype' | 'nav' | 'security' | 'apps' | 'appearance'>('archetype');

  const accent = getAccentColorClasses(persona.accentTheme);

  const archetypes: { id: PersonaArchetype; title: string; desc: string; icon: any; color: string }[] = [
    {
      id: 'everyday',
      title: 'Everyday Mobile Migrator',
      desc: 'Seamless transition for daily messaging, camera, browser, and F-Droid apps.',
      icon: Smartphone,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'privacy_purist',
      title: 'Privacy Defender & Activist',
      desc: 'Tor onion routing, synthetic sensor dummy streams, and active false telemetry poisoning.',
      icon: ShieldCheck,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'developer',
      title: 'Power User & Developer',
      desc: 'Terminal-first cockpit, Linux sandboxes, eBPF telemetry, and Darwin CocoaTouch bridge.',
      icon: Terminal,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'accessible',
      title: 'Senior & Accessible Simplicity',
      desc: 'Enlarged high-contrast touch targets, simplified dialer/camera, and 100% scam neutralization.',
      icon: Eye,
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'creator_gamer',
      title: 'Creator & High-FPS Gamer',
      desc: 'Low-latency audio HAL, GPU optimization, anti-loot-box locks, and full iOS game bridge.',
      icon: Gamepad2,
      color: 'from-rose-500 to-pink-600',
    },
    {
      id: 'custom',
      title: 'Custom Modular Persona',
      desc: 'Fine-tune every operating parameter, gesture model, and defensive filter individually.',
      icon: Sliders,
      color: 'from-neutral-600 to-neutral-800',
    },
  ];

  const navStyles: { id: NavigationStyle; title: string; desc: string; preview: string }[] = [
    {
      id: 'android_gestures',
      title: 'Android Gesture Bar',
      desc: 'Modern minimalist gesture pill with swipe up for home and swipe side for back.',
      preview: '▬',
    },
    {
      id: 'android_buttons',
      title: 'Classic 3-Button Navigation',
      desc: 'Traditional Back, Home, and Recents buttons for maximum predictability.',
      preview: '◀  ●  ■',
    },
    {
      id: 'ios_homebar',
      title: 'Apple iOS Swipe Homebar',
      desc: 'Sleek horizontal swipe pill with iOS bounce inertia and blur dock.',
      preview: '━━━━',
    },
    {
      id: 'desktop_taskbar',
      title: 'Desktop Windows / Linux Taskbar',
      desc: 'Fixed bottom taskbar with start menu, pinned apps, and system tray.',
      preview: '⊞  [Apps]  [12:00]',
    },
  ];

  const handleToggleHomeApp = (appId: string) => {
    let newHome = [...persona.homeApps];
    if (newHome.includes(appId)) {
      if (newHome.length > 3) {
        newHome = newHome.filter((id) => id !== appId);
      }
    } else {
      if (newHome.length < 12) {
        newHome.push(appId);
      }
    }
    updatePersona({ homeApps: newHome });
  };

  const handleToggleDockApp = (appId: string) => {
    let newDock = [...persona.dockApps];
    if (newDock.includes(appId)) {
      if (newDock.length > 2) {
        newDock = newDock.filter((id) => id !== appId);
      }
    } else {
      if (newDock.length < 5) {
        newDock.push(appId);
      }
    }
    updatePersona({ dockApps: newDock });
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Top Banner */}
      <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${accent.gradient} flex items-center justify-center text-white shadow-lg`}>
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Universal Adaptation Center</h2>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${accent.badge} border`}>
                {persona.name}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Adapts UI ergonomics, navigation gestures, privacy armor, and app distribution to you.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openWizard}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white ${accent.bg} hover:brightness-110 shadow-md transition-all active:scale-95`}
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Re-Run Setup Wizard</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 bg-neutral-950/60 border-b border-neutral-800/80 text-xs overflow-x-auto">
        {[
          { id: 'archetype', label: 'Persona Presets', icon: Sparkles },
          { id: 'nav', label: 'Navigation & Gestures', icon: Layout },
          { id: 'security', label: 'Privacy & Defense Armor', icon: ShieldCheck },
          { id: 'apps', label: 'Home & Dock Apps', icon: Grid },
          { id: 'appearance', label: 'Display & Aesthetics', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Icon size={14} className={isActive ? accent.text : ''} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* TAB 1: ARCHETYPES */}
        {activeTab === 'archetype' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Universal User Profiles</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Switch profiles with 1-click. LibreDroid will morph its entire layout, defense stance, and default toolset.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {archetypes.map((arch) => {
                const Icon = arch.icon;
                const isSelected = persona.archetype === arch.id;
                return (
                  <div
                    key={arch.id}
                    onClick={() => applyPreset(arch.id)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? `bg-neutral-800 ${accent.border} shadow-lg ring-1 ring-${accent.primary}`
                        : 'bg-neutral-850/60 border-neutral-750 hover:bg-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${arch.color} flex items-center justify-center text-white shadow-md`}>
                          <Icon size={18} />
                        </div>
                        {isSelected && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${accent.badge} border`}>
                            ACTIVE PERSONA
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white">{arch.title}</h4>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{arch.desc}</p>
                    </div>

                    <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Click to Morph System</span>
                      {isSelected ? (
                        <Check size={16} className={accent.text} />
                      ) : (
                        <span className="text-xs text-neutral-400">Apply →</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: NAVIGATION & GESTURES */}
        {activeTab === 'nav' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Navigation Bar & Gesture Ergonomics</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Choose the navigation paradigm that matches your natural hand habits.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {navStyles.map((style) => {
                const isSelected = persona.navigationStyle === style.id;
                return (
                  <div
                    key={style.id}
                    onClick={() => updatePersona({ navigationStyle: style.id })}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? `bg-neutral-800 ${accent.border} shadow-lg`
                        : 'bg-neutral-850/60 border-neutral-750 hover:bg-neutral-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-white">{style.title}</h4>
                        {isSelected && <Check size={16} className={accent.text} />}
                      </div>
                      <p className="text-xs text-neutral-400 mb-3">{style.desc}</p>
                    </div>

                    <div className="h-10 bg-neutral-950 rounded-xl flex items-center justify-center font-mono text-xs text-neutral-300 border border-neutral-800">
                      {style.preview}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY & ARMOR */}
        {activeTab === 'security' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Adaptive Defensive Posture</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Tune privacy armor and synthetic countermeasures according to your threat environment.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'balanced', title: 'Balanced Guardian', desc: 'Standard daily defense. Silent ad & dark pattern blocking.' },
                { id: 'hardened', title: 'Hardened Sentinel', desc: 'Active false telemetry feeding & eBPF kernel monitors.' },
                { id: 'paranoid_airgap', title: 'Sovereign Fortress', desc: 'Synthetic sensor dummy feeds, Tor routing & ephemeral storage.' },
              ].map((sec) => {
                const isSelected = persona.securityLevel === sec.id;
                return (
                  <div
                    key={sec.id}
                    onClick={() => updatePersona({ securityLevel: sec.id as SecurityLevel })}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? `bg-neutral-800 ${accent.border} shadow-md`
                        : 'bg-neutral-850/60 border-neutral-750 hover:bg-neutral-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-white">{sec.title}</h4>
                        {isSelected && <Check size={14} className={accent.text} />}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">{sec.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Granular Toggles */}
            <div className="space-y-2 pt-2">
              <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Poisoning False Telemetry Feeder</div>
                  <div className="text-[11px] text-neutral-400">Injects synthetic random events into forced tracking beacons.</div>
                </div>
                <input
                  type="checkbox"
                  checked={persona.falseTelemetryEnabled}
                  onChange={(e) => updatePersona({ falseTelemetryEnabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Zero-Trust Dummy Sensor Streams</div>
                  <div className="text-[11px] text-neutral-400">Streams white noise PCM & null coordinates to apps demanding permissions.</div>
                </div>
                <input
                  type="checkbox"
                  checked={persona.dummySensorsEnabled}
                  onChange={(e) => updatePersona({ dummySensorsEnabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Instant Burner Identity Generator</div>
                  <div className="text-[11px] text-neutral-400">1-click disposable alias and authentication tokens for forced sign-ups.</div>
                </div>
                <input
                  type="checkbox"
                  checked={persona.burnerIdentityEnabled}
                  onChange={(e) => updatePersona({ burnerIdentityEnabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: APPS PINNING */}
        {activeTab === 'apps' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Home Screen & Dock App Pinning</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Toggle apps to pin or unpin from your personalized Home Screen and Pinned Dock.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SYSTEM_APPS.map((app) => {
                const isHome = persona.homeApps.includes(app.id);
                const isDock = persona.dockApps.includes(app.id);
                return (
                  <div
                    key={app.id}
                    className="p-3 rounded-2xl bg-neutral-850/80 border border-neutral-750 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-xs text-white truncate">{app.name}</div>
                      <div className="text-[10px] text-neutral-400 capitalize">{app.category}</div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-750 text-[10px]">
                      <button
                        onClick={() => handleToggleHomeApp(app.id)}
                        className={`flex-1 py-1 rounded-lg text-center font-medium transition-colors ${
                          isHome ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {isHome ? '✓ Home' : '+ Home'}
                      </button>
                      <button
                        onClick={() => handleToggleDockApp(app.id)}
                        className={`flex-1 py-1 rounded-lg text-center font-medium transition-colors ${
                          isDock ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {isDock ? '✓ Dock' : '+ Dock'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: APPEARANCE */}
        {activeTab === 'appearance' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Display Scale & Accent Color</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Customize touch target density and system coloration.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'compact', title: 'Compact Pro', desc: 'Dense cockpit for high-resolution screens and terminals.' },
                { id: 'comfortable', title: 'Comfortable', desc: 'Standard balanced spacing for everyday touchscreens.' },
                { id: 'accessible_large', title: 'Accessible Large', desc: 'Enlarged +35% buttons and 16px bold labels for senior ease.' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => updatePersona({ uiDensity: d.id as UiDensity })}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    persona.uiDensity === d.id
                      ? `bg-neutral-800 ${accent.border} shadow-md`
                      : 'bg-neutral-850/60 border-neutral-750 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{d.title}</div>
                  <div className="text-[10px] text-neutral-400 mt-1">{d.desc}</div>
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-2">Accent Color Palette</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {[
                  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500' },
                  { id: 'cyan', name: 'Cyan', bg: 'bg-cyan-500' },
                  { id: 'amber', name: 'Amber', bg: 'bg-amber-500' },
                  { id: 'violet', name: 'Violet', bg: 'bg-purple-500' },
                  { id: 'rose', name: 'Rose', bg: 'bg-rose-500' },
                  { id: 'monochrome', name: 'Stealth', bg: 'bg-neutral-400' },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => updatePersona({ accentTheme: th.id as AccentTheme })}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      persona.accentTheme === th.id
                        ? 'bg-neutral-800 border-white shadow-md'
                        : 'bg-neutral-850/60 border-neutral-750 hover:bg-neutral-800'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${th.bg} flex items-center justify-center text-white text-xs`}>
                      {persona.accentTheme === th.id && '✓'}
                    </div>
                    <span className="text-[11px] text-neutral-300">{th.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <button
                onClick={resetPersona}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
              >
                <RotateCcw size={14} />
                <span>Reset to Factory Defaults</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
