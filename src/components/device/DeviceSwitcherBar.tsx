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
  Lock
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
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

  const devices: { id: DeviceMode; label: string; icon: any }[] = [
    { id: 'auto', label: 'Auto Detect', icon: RefreshCw },
    { id: 'phone', label: 'Phone', icon: Smartphone },
    { id: 'tablet', label: 'Tablet', icon: Tablet },
    { id: 'foldable', label: 'Foldable', icon: FoldHorizontal },
    { id: 'desktop', label: 'DeX Desktop', icon: Laptop },
  ];

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/80 rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-1 sm:gap-2 select-none text-xs text-white">
      {/* Brand & Anti-Monopoly Guardian Trigger */}
      <button 
        onClick={() => openApp('guardian')}
        className="flex items-center gap-1.5 px-2 border-r border-neutral-700 font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        title="Open Anti-Monopoly Core Dashboard"
      >
        <ShieldCheck size={14} className="text-emerald-400" />
        <span className="hidden md:inline">Anti-Monopoly Core</span>
      </button>

      {/* Hardware Adaptation Tier Live Badge */}
      {adaptivePolicy && (
        <button
          onClick={() => openApp('hardware')}
          className="flex items-center gap-1.5 px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-full text-[11px] font-mono text-cyan-300 transition-colors"
          title={`Adaptive Hardware HAL: ${hardwareSpecs?.cpuCores} Cores, ${hardwareSpecs?.ramGb}GB RAM, ${adaptivePolicy.tier} profile.`}
        >
          <Cpu size={12} className="text-cyan-400" />
          <span className="capitalize">{adaptivePolicy.tier}</span>
          <span className="hidden xl:inline text-neutral-400">({hardwareSpecs?.cpuCores}C)</span>
        </button>
      )}

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
                  ? 'bg-emerald-600 text-white shadow'
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
        className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 rounded-full text-[11px] font-medium transition-colors"
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
