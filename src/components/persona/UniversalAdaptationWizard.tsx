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
  ArrowRight, 
  ArrowLeft, 
  X, 
  Laptop, 
  Apple, 
  Lock, 
  Zap, 
  Radio, 
  Palette,
  CheckCircle2
} from 'lucide-react';
import { usePersona } from '../../context/PersonaContext';
import { PersonaArchetype, AccentTheme, NavigationStyle, UiDensity, SecurityLevel } from '../../types/persona';
import { PERSONA_PRESETS, getAccentColorClasses } from '../../services/personaEngine';
import { WALLPAPERS } from '../../context/SystemContext';

export const UniversalAdaptationWizard: React.FC = () => {
  const { isWizardOpen, setIsWizardOpen, persona, applyPreset, updatePersona } = usePersona();
  
  const [step, setStep] = useState<number>(1);
  const [selectedArchetype, setSelectedArchetype] = useState<PersonaArchetype>(persona.archetype || 'everyday');
  const [selectedPreviousOs, setSelectedPreviousOs] = useState<'android' | 'ios' | 'linux' | 'windows' | 'none'>(persona.previousOs || 'android');
  const [selectedSecurity, setSelectedSecurity] = useState<SecurityLevel>(persona.securityLevel || 'balanced');
  const [selectedTheme, setSelectedTheme] = useState<AccentTheme>(persona.accentTheme || 'emerald');
  const [selectedDensity, setSelectedDensity] = useState<UiDensity>(persona.uiDensity || 'comfortable');
  const [isApplying, setIsApplying] = useState(false);

  if (!isWizardOpen) return null;

  const archetypes: {
    id: PersonaArchetype;
    title: string;
    tagline: string;
    icon: any;
    color: string;
    badge: string;
    features: string[];
  }[] = [
    {
      id: 'everyday',
      title: 'Everyday Mobile Migrator',
      tagline: 'Smooth transition from stock Android or iOS with zero learning curve.',
      icon: Smartphone,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Most Popular',
      features: ['Familiar gesture navigation', 'Sovereign App Store + microG', 'Daily camera, notes & browser ready'],
    },
    {
      id: 'privacy_purist',
      title: 'Privacy Defender & Activist',
      tagline: 'Zero big-tech footprint with synthetic sensor dummy feeds & false telemetry.',
      icon: ShieldCheck,
      color: 'from-cyan-500 to-blue-600',
      badge: 'Maximum Defense',
      features: ['Tor & Whonix hypervisor routing', 'Microphone/GPS dummy noise feeds', '100% false telemetry poisoner'],
    },
    {
      id: 'developer',
      title: 'Power User & Developer',
      tagline: 'Terminal-first cockpit with Linux namespaces, eBPF probes, and Darwin Apple bridge.',
      icon: Terminal,
      color: 'from-purple-500 to-indigo-600',
      badge: 'Cockpit Mode',
      features: ['Termux & POSIX containers', 'eBPF kernel telemetry monitor', 'Darwin CocoaTouch Mach-O loader'],
    },
    {
      id: 'accessible',
      title: 'Senior & Accessible Simplicity',
      tagline: 'Large touch targets, high contrast, and aggressive scam & dark-pattern shields.',
      icon: Eye,
      color: 'from-amber-500 to-orange-600',
      badge: 'High Contrast & Easy',
      features: ['+35% enlarged text & icons', 'Classic 3-button navigation', '100% scam & fake ad neutralizer'],
    },
    {
      id: 'creator_gamer',
      title: 'Creator & High-FPS Gamer',
      tagline: 'Hardware HAL optimized for low latency audio, high refresh rates, and anti-loot-box limits.',
      icon: Gamepad2,
      color: 'from-rose-500 to-pink-600',
      badge: 'Unthrottled HAL',
      features: ['Low-latency audio & GPU priority', 'Anti-loot box spending lock', 'Full touchHLE & Darwin Apple bridge'],
    },
  ];

  const previousOsOptions: { id: 'android' | 'ios' | 'linux' | 'windows'; label: string; icon: any; desc: string }[] = [
    { id: 'android', label: 'Android (Pixel / Samsung)', icon: Smartphone, desc: 'Material design, swipe gestures & app drawer' },
    { id: 'ios', label: 'Apple iPhone / iPad', icon: Apple, desc: 'Bottom swipe homebar, blur dock & stacked widgets' },
    { id: 'linux', label: 'Linux (Ubuntu / Fedora / Arch)', icon: Terminal, desc: 'Desktop taskbar, app menu & tiling windows' },
    { id: 'windows', label: 'Microsoft Windows 11', icon: Laptop, desc: 'Start taskbar, system tray & floating windows' },
  ];

  const securityOptions: { id: SecurityLevel; title: string; desc: string; icon: any }[] = [
    {
      id: 'balanced',
      title: 'Balanced Guardian',
      desc: 'Seamless compatibility. Blocks trackers, telemetry, and predatory dark patterns without interrupting apps.',
      icon: ShieldCheck,
    },
    {
      id: 'hardened',
      title: 'Hardened Sentinel',
      desc: 'Injects false telemetry to ad networks and provides synthetic sensor feeds (white noise audio, masked GPS).',
      icon: Lock,
    },
    {
      id: 'paranoid_airgap',
      title: 'Sovereign Fortress',
      desc: 'Tor onion routing, zero persistent storage in disposable domains, and 100% synthetic noise telemetry.',
      icon: Radio,
    },
  ];

  const themes: { id: AccentTheme; name: string; previewClass: string }[] = [
    { id: 'emerald', name: 'Cosmic Emerald', previewClass: 'bg-emerald-500' },
    { id: 'cyan', name: 'Nordic Cyan', previewClass: 'bg-cyan-500' },
    { id: 'amber', name: 'Cyber Dusk Amber', previewClass: 'bg-amber-500' },
    { id: 'violet', name: 'Deep Space Violet', previewClass: 'bg-purple-500' },
    { id: 'rose', name: 'Crimson Rose', previewClass: 'bg-rose-500' },
    { id: 'monochrome', name: 'Stealth Monochrome', previewClass: 'bg-neutral-400' },
  ];

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      // Apply the chosen archetype base
      applyPreset(selectedArchetype, selectedPreviousOs);
      
      // Override with user's customized choices
      updatePersona({
        securityLevel: selectedSecurity,
        accentTheme: selectedTheme,
        uiDensity: selectedDensity,
        falseTelemetryEnabled: true,
        dummySensorsEnabled: selectedSecurity !== 'balanced',
        isSetupComplete: true,
      });

      setIsApplying(false);
      setIsWizardOpen(false);
    }, 600);
  };

  const accent = getAccentColorClasses(selectedTheme);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl select-none animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-950/80 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center bg-gradient-to-tr ${accent.gradient} shadow-lg ${accent.glow}`}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Universal OS Adaptation
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Adaptive Engine
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Tailor LibreDroid specifically to your needs, familiarity, and threat model.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsWizardOpen(false)}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
            title="Close Wizard"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-neutral-950/40 border-b border-neutral-800/60 text-xs text-neutral-400">
          {[
            { num: 1, label: 'Archetype' },
            { num: 2, label: 'Origin OS' },
            { num: 3, label: 'Privacy Stance' },
            { num: 4, label: 'Ergonomics' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-1.5 transition-colors ${
                step === s.num ? `${accent.text} font-semibold` : step > s.num ? 'text-white' : 'text-neutral-500'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === s.num 
                  ? `${accent.bg} text-white` 
                  : step > s.num 
                    ? 'bg-neutral-700 text-white' 
                    : 'bg-neutral-800 text-neutral-500'
              }`}>
                {step > s.num ? '✓' : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* STEP 1: ARCHETYPE SELECTION */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Step 1: Who is installing this Operating System?
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Choose your primary persona. LibreDroid reconfigures its entire interface, default repositories, and security modules to match.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {archetypes.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedArchetype === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedArchetype(item.id)}
                      className={`relative cursor-pointer p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                        isSelected
                          ? `bg-neutral-800/90 ${accent.border} shadow-lg ring-1 ring-${accent.primary}`
                          : 'bg-neutral-850/60 border-neutral-750 hover:bg-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-md`}>
                            <Icon size={18} />
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-700/80 text-neutral-300">
                            {item.badge}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{item.tagline}</p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-neutral-750 space-y-1">
                        {item.features.map((feat, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-neutral-300">
                            <span className="text-emerald-400">✓</span>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>

                      {isSelected && (
                        <div className="absolute top-3 right-3 text-emerald-400">
                          <CheckCircle2 size={18} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: PREVIOUS OS & FAMILIARITY */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Step 2: Which OS feels like second nature to you?
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  LibreDroid will mimic the muscle memory, navigation bar, and windowing layout of your preferred ecosystem.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {previousOsOptions.map((os) => {
                  const Icon = os.icon;
                  const isSelected = selectedPreviousOs === os.id;
                  return (
                    <div
                      key={os.id}
                      onClick={() => setSelectedPreviousOs(os.id)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${
                        isSelected
                          ? `bg-neutral-800 ${accent.border} shadow-lg ring-1 ring-${accent.primary}`
                          : 'bg-neutral-850/60 border-neutral-750 hover:bg-neutral-800'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl bg-neutral-800 text-white shrink-0 border border-neutral-700`}>
                        <Icon size={22} className={isSelected ? accent.text : 'text-neutral-300'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{os.label}</h4>
                          {isSelected && <Check size={16} className={accent.text} />}
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">{os.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-3">
                <Zap size={18} className="text-amber-400 shrink-0" />
                <span>
                  <strong>Muscle Memory Guarantee:</strong> Selecting Apple iOS activates the bottom swipe homebar & blur dock, while Linux/Windows enables full desktop taskbar mode.
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: PRIVACY & DEFENSE STANCE */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Step 3: What is your Privacy & Threat Defense Posture?
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Tune how aggressively LibreDroid combats surveillance capitalism, trackers, and predatory software tactics.
                </p>
              </div>

              <div className="space-y-3">
                {securityOptions.map((sec) => {
                  const Icon = sec.icon;
                  const isSelected = selectedSecurity === sec.id;
                  return (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedSecurity(sec.id)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${
                        isSelected
                          ? `bg-neutral-800 ${accent.border} shadow-lg ring-1 ring-${accent.primary}`
                          : 'bg-neutral-850/60 border-neutral-750 hover:bg-neutral-800'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl bg-neutral-800 text-white shrink-0 border border-neutral-700`}>
                        <Icon size={22} className={isSelected ? accent.text : 'text-neutral-300'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{sec.title}</h4>
                          {isSelected && <Check size={16} className={accent.text} />}
                        </div>
                        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{sec.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-[11px] text-neutral-300">
                  <div className="font-semibold text-emerald-400 mb-0.5">Fake Telemetry Feeder</div>
                  Feeds random dummy metrics to Google Firebase & Meta Graph to poison ad tracking.
                </div>
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-[11px] text-neutral-300">
                  <div className="font-semibold text-cyan-400 mb-0.5">Dummy Sensor Streams</div>
                  Feeds white noise PCM audio & synthetic null coordinates when sensor access is coerced.
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ERGONOMICS & ACCENT THEME */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Step 4: Ergonomics, Scale & Aesthetic Theme
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Select visual density and accent coloration for your daily workstation or mobile device.
                </p>
              </div>

              {/* UI Density */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-2">Display Scale & Touch Target Size</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'compact', label: 'Compact Pro', desc: 'Dense info for developers' },
                    { id: 'comfortable', label: 'Comfortable', desc: 'Standard mobile touch targets' },
                    { id: 'accessible_large', label: 'Large Print', desc: 'High visibility & +35% target size' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDensity(d.id as UiDensity)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedDensity === d.id
                          ? `bg-neutral-800 ${accent.border} shadow-md`
                          : 'bg-neutral-850/60 border-neutral-750 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{d.label}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Palettes */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-2">System Accent Color</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {themes.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => setSelectedTheme(th.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        selectedTheme === th.id
                          ? `bg-neutral-800 border-white shadow-lg`
                          : 'bg-neutral-850/60 border-neutral-750 hover:bg-neutral-800'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${th.previewClass} shadow-md flex items-center justify-center text-white text-xs`}>
                        {selectedTheme === th.id && '✓'}
                      </div>
                      <span className="text-[11px] text-neutral-300 text-center truncate max-w-[75px]">{th.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-neutral-400">Target Persona Configuration:</div>
                  <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                    <span>{archetypes.find(a => a.id === selectedArchetype)?.title}</span>
                    <span className="text-xs text-neutral-500">•</span>
                    <span className="text-xs font-normal text-neutral-300 uppercase">{selectedPreviousOs} Navigation</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-emerald-400 font-mono font-medium">Ready to Morph</div>
                  <div className="text-[10px] text-neutral-500">Persistent across reboots</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750 rounded-xl transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg transition-all ${accent.bg} hover:brightness-110 active:scale-95`}
            >
              <span>Next Step</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleApply}
              disabled={isApplying}
              className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-xl transition-all ${accent.bg} hover:brightness-110 active:scale-95 ${
                isApplying ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              <Sparkles size={16} />
              <span>{isApplying ? 'Morphing Operating System...' : 'Apply & Adapt OS Now'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
