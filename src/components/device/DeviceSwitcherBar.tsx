import React from 'react';
import { 
  Smartphone, 
  Tablet, 
  Laptop, 
  FoldHorizontal, 
  RefreshCw, 
  Sliders, 
  ShieldCheck, 
  HardDrive, 
  Box, 
  Cpu, 
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { usePersona } from '../../context/PersonaContext';
import { DeviceMode } from '../../types/system';

export const DeviceSwitcherBar: React.FC = () => {
  const { 
    deviceMode, 
    setDeviceMode, 
    actualDevice, 
    isFolded, 
    setIsFolded,
    setIsShadeOpen,
    hardwareSpecs,
    adaptivePolicy
  } = useSystem();

  const { openApp } = useWindow();
  const { persona, openWizard } = usePersona();

  const devices: { id: DeviceMode; label: string; icon: any }[] = [
    { id: 'auto', label: 'Auto Detect', icon: RefreshCw },
    { id: 'phone', label: 'Phone', icon: Smartphone },
    { id: 'tablet', label: 'Tablet', icon: Tablet },
    { id: 'foldable', label: 'Foldable', icon: FoldHorizontal },
    { id: 'desktop', label: 'DeX Desktop', icon: Laptop },
  ];

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/80 rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-1 sm:gap-2 select-none text-xs text-white max-w-[96vw] overflow-x-auto scrollbar-none">
      {/* Multi-OS Qubes Hypervisor Direct Status Badge */}
      <button 
        onClick={() => openApp('hypervisor')}
        className="flex items-center gap-1.5 px-2 border-r border-neutral-700 font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        title="Multi-OS Hypervisor Matrix: 5 Specialized OS Domains (seL4 Vault, Whonix Tor, GrapheneOS Android, Disposable Alpine, Debian Work)."
      >
        <Layers size={13} className="text-purple-400" />
        <span className="hidden md:inline">Multi-OS Matrix</span>
      </button>

      {/* Universal Adapt OS Persona Launcher Badge */}
      <button 
        onClick={() => openApp('persona_engine')}
        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm transition-all bg-gradient-to-r from-amber-500/80 via-rose-500/80 to-purple-600/80 hover:brightness-110 active:scale-95 border border-white/20"
        title={`Active Persona: ${persona.name}. Click to tune or re-morph OS.`}
      >
        <Sparkles size={11} className="text-amber-200" />
        <span className="hidden md:inline truncate max-w-[110px]">{persona.name}</span>
        <span className="md:hidden">Adapt</span>
      </button>

      {/* Security Guardrails Badge */}
      <button 
        onClick={() => openApp('security')}
        className="flex items-center gap-1 px-2 py-0.5 bg-neutral-800 hover:bg-neutral-750 rounded-full text-[11px] font-mono text-emerald-300 transition-colors"
        title="Hardened Guardrails"
      >
        <Lock size={12} className="text-emerald-400" />
        <span className="hidden xl:inline">Hardened</span>
      </button>

      {/* Linux Sandbox Core Button */}
      <button
        onClick={() => openApp('linux_sandbox')}
        className="flex items-center gap-1.5 px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-full text-[11px] font-mono text-cyan-300 transition-colors"
        title="Linux Namespaces, cgroups v2, Seccomp-BPF & XDG Portals"
      >
        <Box size={12} className="text-cyan-400" />
        <span>Sandbox</span>
      </button>

      {/* Device Form Factor Pills */}
      <div className="flex items-center gap-1">
        {devices.map((d) => {
          const Icon = d.icon;
          const isActive = deviceMode === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setDeviceMode(d.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title={`Switch to ${d.label} mode`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{d.label}</span>
            </button>
          );
        })}
      </div>

      {/* Foldable state toggle if foldable is active */}
      {(deviceMode === 'foldable' || actualDevice === 'foldable') && (
        <button
          onClick={() => setIsFolded(!isFolded)}
          className="ml-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-medium transition-colors hover:bg-amber-500/30"
          title="Toggle Fold / Unfold hinge"
        >
          {isFolded ? 'Unfold' : 'Fold'}
        </button>
      )}

      {/* Quick Action: Sideload APK */}
      <button
        onClick={() => openApp('apk_installer')}
        className="hidden xl:flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 rounded-full text-[11px] font-medium transition-colors"
        title="Sideload Android .apk"
      >
        <Box size={13} />
        <span>Sideload</span>
      </button>

      {/* Quick Action: Hardware Installer */}
      <button
        onClick={() => openApp('system_installer')}
        className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 rounded-full text-[11px] font-medium transition-colors"
        title="Hardware OS Installer"
      >
        <HardDrive size={13} />
        <span>Install OS</span>
      </button>

      {/* Quick Settings trigger */}
      <button
        onClick={() => setIsShadeOpen(true)}
        className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors"
        title="Quick Settings"
      >
        <Sliders size={13} />
      </button>
    </div>
  );
};
