import React from 'react';
import { 
  Smartphone, 
  Tablet, 
  Laptop, 
  FoldHorizontal, 
  RotateCw, 
  RefreshCw, 
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { DeviceMode } from '../../types/system';

export const DeviceSwitcherBar: React.FC = () => {
  const { 
    deviceMode, 
    setDeviceMode, 
    actualDevice, 
    isFolded, 
    setIsFolded,
    setIsAssistantOpen,
    setIsShadeOpen
  } = useSystem();

  const devices: { id: DeviceMode; label: string; icon: any }[] = [
    { id: 'auto', label: 'Auto Detect', icon: RefreshCw },
    { id: 'phone', label: 'Phone', icon: Smartphone },
    { id: 'tablet', label: 'Tablet', icon: Tablet },
    { id: 'foldable', label: 'Foldable', icon: FoldHorizontal },
    { id: 'desktop', label: 'DeX Desktop', icon: Laptop },
  ];

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 backdrop-blur-xl border border-neutral-700/80 rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-1 sm:gap-2 select-none text-xs text-white">
      <div className="flex items-center gap-1.5 px-2 border-r border-neutral-700 font-semibold text-purple-300">
        <Sparkles size={14} className="text-purple-400" />
        <span className="hidden md:inline">OmniOS Universal</span>
      </div>

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
