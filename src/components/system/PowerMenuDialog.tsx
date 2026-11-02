import React, { useState } from 'react';
import { Power, RotateCw, Lock, AlertTriangle, X, Shield, Battery, Cpu } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { OverlayHost } from '../../platform/react/Overlay';

export const PowerMenuDialog: React.FC = () => {
  const { 
    isPowerMenuOpen, 
    setIsPowerMenuOpen, 
    triggerPowerAction, 
    batteryLevel, 
    isCharging,
    hardwareSpecs 
  } = useSystem();

  const [activeTransition, setActiveTransition] = useState<string | null>(null);

  if (!isPowerMenuOpen && !activeTransition) return null;

  const handleAction = async (action: 'poweroff' | 'reboot' | 'reboot-recovery' | 'lock') => {
    if (action === 'poweroff') {
      setActiveTransition('Shutting down LibreDroid OS...\nUnmounting encrypted overlay volumes...\nHalting hardware CPU cores.');
      setTimeout(() => {
        triggerPowerAction('poweroff');
      }, 1600);
    } else if (action === 'reboot') {
      setActiveTransition('Restarting LibreDroid OS...\nFlushing hardware caches...\nExecuting clean fastboot reboot.');
      setTimeout(() => {
        triggerPowerAction('reboot');
      }, 1600);
    } else if (action === 'reboot-recovery') {
      setActiveTransition('Entering Diagnostic Safe Recovery...\nIsolating third-party services...');
      setTimeout(() => {
        triggerPowerAction('reboot-recovery');
      }, 1400);
    } else {
      triggerPowerAction('lock');
    }
  };

  if (activeTransition) {
    return (
      <OverlayHost>
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in select-none">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
              <Power size={24} className="animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-2">LibreDroid OS</h2>
          <p className="text-xs text-neutral-400 font-mono whitespace-pre-line leading-relaxed max-w-sm">
            {activeTransition}
          </p>
        </div>
      </OverlayHost>
    );
  }

  return (
    <OverlayHost>
      <div 
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 select-none animate-fade-in"
        onClick={() => setIsPowerMenuOpen(false)}
      >
        <div 
          className="relative w-full max-w-md bg-neutral-900/95 border border-neutral-800 rounded-3xl p-6 shadow-2xl overflow-hidden backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Power size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Device Power</h3>
                <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                  <span>OnePlus Pad Go</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Battery size={11} className={isCharging ? 'text-emerald-400' : 'text-neutral-400'} />
                    {batteryLevel}%
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsPowerMenuOpen(false)}
              className="w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-3.5 mb-6">
            {/* Power Off */}
            <button
              onClick={() => handleAction('poweroff')}
              className="flex flex-col items-center justify-center p-5 rounded-2xl bg-neutral-850 hover:bg-rose-950/40 border border-neutral-750 hover:border-rose-500/50 text-neutral-200 hover:text-rose-400 transition-all group active:scale-95 cursor-pointer shadow-lg"
            >
              <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                <Power size={24} />
              </div>
              <span className="text-xs font-bold tracking-wide">Power Off</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Safe shutdown</span>
            </button>

            {/* Restart */}
            <button
              onClick={() => handleAction('reboot')}
              className="flex flex-col items-center justify-center p-5 rounded-2xl bg-neutral-850 hover:bg-amber-950/40 border border-neutral-750 hover:border-amber-500/50 text-neutral-200 hover:text-amber-400 transition-all group active:scale-95 cursor-pointer shadow-lg"
            >
              <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:rotate-45 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <RotateCw size={24} />
              </div>
              <span className="text-xs font-bold tracking-wide">Restart</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Reboot system</span>
            </button>

            {/* Lock Screen */}
            <button
              onClick={() => handleAction('lock')}
              className="flex flex-col items-center justify-center p-5 rounded-2xl bg-neutral-850 hover:bg-blue-950/40 border border-neutral-750 hover:border-blue-500/50 text-neutral-200 hover:text-blue-400 transition-all group active:scale-95 cursor-pointer shadow-lg"
            >
              <div className="w-14 h-14 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <Lock size={24} />
              </div>
              <span className="text-xs font-bold tracking-wide">Lock Screen</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Protect session</span>
            </button>

            {/* Safe Recovery */}
            <button
              onClick={() => handleAction('reboot-recovery')}
              className="flex flex-col items-center justify-center p-5 rounded-2xl bg-neutral-850 hover:bg-emerald-950/40 border border-neutral-750 hover:border-emerald-500/50 text-neutral-200 hover:text-emerald-400 transition-all group active:scale-95 cursor-pointer shadow-lg"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <AlertTriangle size={24} />
              </div>
              <span className="text-xs font-bold tracking-wide">Safe Mode</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Diagnostics</span>
            </button>
          </div>

          {/* Footer Info */}
          <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-xl p-3 flex items-center justify-between text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Shield size={13} className="text-emerald-400" />
              <span>Sovereign Enclave Active</span>
            </div>
            <div className="font-mono text-[10px] text-neutral-500">
              Linux 6.1 • ARM64
            </div>
          </div>
        </div>
      </div>
    </OverlayHost>
  );
};
