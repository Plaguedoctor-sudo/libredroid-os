import React from 'react';
import { 
  Cpu, 
  Layers, 
  Zap, 
  Activity, 
  HardDrive, 
  Sliders, 
  ShieldCheck, 
  Monitor, 
  Battery, 
  Wifi, 
  RefreshCw,
  Check,
  Sparkles
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

export const HardwareManagerApp: React.FC = () => {
  const { 
    hardwareSpecs, 
    adaptivePolicy, 
    autoHardwareAdaptation, 
    setAutoHardwareAdaptation, 
    setManualTier,
    batteryLevel,
    isCharging 
  } = useSystem();

  if (!hardwareSpecs || !adaptivePolicy) {
    return (
      <div className="flex-1 w-full h-full bg-neutral-900 text-white flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-emerald-400">
          <RefreshCw className="animate-spin" size={18} />
          <span>Probing host hardware bus...</span>
        </div>
      </div>
    );
  }

  const tiers: { id: 'low-end' | 'mid-range' | 'flagship' | 'workstation'; label: string; desc: string }[] = [
    {
      id: 'workstation',
      label: 'Workstation / High-End PC',
      desc: 'Dedicated GPU, 120Hz fluid glassmorphism, 12+ freeform windows.',
    },
    {
      id: 'flagship',
      label: 'Flagship Mobile / Laptop',
      desc: 'Multi-core balanced performance, full GPU acceleration.',
    },
    {
      id: 'mid-range',
      label: 'Mid-Range Profile',
      desc: 'Optimized battery drain and balanced memory footprints.',
    },
    {
      id: 'low-end',
      label: 'Android Go (Low-Spec / 2GB RAM)',
      desc: 'Disabled GPU blur, reduced animation scale, aggressive task reclaiming.',
    },
  ];

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
            <Cpu size={18} />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              Hardware Abstraction Layer (HAL) & Adaptation Engine
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono">
                Live Probing
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Adapts system runtime, graphics shaders, and memory scheduler to host hardware
            </div>
          </div>
        </div>

        <button
          onClick={() => setAutoHardwareAdaptation(true)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            autoHardwareAdaptation
              ? 'bg-cyan-600 text-white shadow'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
          }`}
        >
          <Sparkles size={13} />
          <span>Auto-Adapt Hardware</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
        {/* Active Adaptation Status Banner */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-neutral-900 to-emerald-950/40 border border-cyan-500/30 p-4 rounded-3xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                Active Adaptation Tier
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white capitalize mt-0.5">
                {adaptivePolicy.tier} Profile
              </h2>
              <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed">
                {adaptivePolicy.description}
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg shrink-0">
              Gov: {adaptivePolicy.powerGovernor}
            </span>
          </div>
        </div>

        {/* Real-Time Hardware Telemetry Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
            <Activity size={14} className="text-cyan-400" />
            <span>Host Hardware Diagnostics</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* CPU */}
            <div className="p-3 bg-neutral-800/50 border border-neutral-700/60 rounded-2xl">
              <div className="text-neutral-400 mb-1 flex items-center gap-1.5">
                <Cpu size={14} className="text-purple-400" />
                <span>CPU Processor</span>
              </div>
              <div className="text-sm font-bold text-white">{hardwareSpecs.cpuCores} Logical Cores</div>
              <div className="text-[11px] text-neutral-400 font-mono mt-0.5">{hardwareSpecs.cpuArchitecture}</div>
            </div>

            {/* RAM */}
            <div className="p-3 bg-neutral-800/50 border border-neutral-700/60 rounded-2xl">
              <div className="text-neutral-400 mb-1 flex items-center gap-1.5">
                <Layers size={14} className="text-emerald-400" />
                <span>Device RAM</span>
              </div>
              <div className="text-sm font-bold text-white">{hardwareSpecs.ramGb} GB Memory</div>
              <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                Max {adaptivePolicy.maxActiveWindows} concurrent windows
              </div>
            </div>

            {/* GPU */}
            <div className="p-3 bg-neutral-800/50 border border-neutral-700/60 rounded-2xl">
              <div className="text-neutral-400 mb-1 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" />
                <span>GPU Acceleration</span>
              </div>
              <div className="text-sm font-bold text-white truncate" title={hardwareSpecs.gpuRenderer}>
                {hardwareSpecs.gpuRenderer.split(' ')[0] || 'WebGL Active'}
              </div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                {hardwareSpecs.hasHardwareGpu ? 'Hardware Accelerated' : 'Software Fallback'}
              </div>
            </div>

            {/* Display */}
            <div className="p-3 bg-neutral-800/50 border border-neutral-700/60 rounded-2xl">
              <div className="text-neutral-400 mb-1 flex items-center gap-1.5">
                <Monitor size={14} className="text-blue-400" />
                <span>Screen & DPI</span>
              </div>
              <div className="text-sm font-bold text-white">
                {hardwareSpecs.screenWidth} × {hardwareSpecs.screenHeight}
              </div>
              <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                {hardwareSpecs.devicePixelRatio}x DPI • {hardwareSpecs.refreshRateEstimate} Hz
              </div>
            </div>
          </div>
        </div>

        {/* Input & Power Telemetry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-neutral-800/40 border border-neutral-700/60 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sliders size={18} className="text-cyan-400" />
              <div>
                <div className="font-semibold text-white">Input Architecture</div>
                <div className="text-[11px] text-neutral-400">
                  {hardwareSpecs.hasTouch ? `Multi-Touch (${hardwareSpecs.maxTouchPoints} points)` : 'Fine Precision Mouse / Trackpad'}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-mono bg-neutral-700 px-2 py-0.5 rounded capitalize">
              {hardwareSpecs.pointerType} pointer
            </span>
          </div>

          <div className="p-3.5 bg-neutral-800/40 border border-neutral-700/60 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Battery size={18} className={isCharging ? 'text-emerald-400' : 'text-amber-400'} />
              <div>
                <div className="font-semibold text-white">Power Supply Subsystem</div>
                <div className="text-[11px] text-neutral-400">
                  {isCharging ? 'Connected to AC Power (High Performance)' : `Running on Battery (${batteryLevel}%)`}
                </div>
              </div>
            </div>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
              isCharging ? 'bg-emerald-900/60 text-emerald-300' : 'bg-neutral-700 text-neutral-300'
            }`}>
              {isCharging ? 'Charging' : 'Discharging'}
            </span>
          </div>
        </div>

        {/* Manual Hardware Profile Simulation */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center justify-between">
            <span>Hardware Emulation & Testing Tiers</span>
            {!autoHardwareAdaptation && (
              <span className="text-[10px] text-amber-400 font-mono">Manual Override Active</span>
            )}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tiers.map((t) => {
              const isSelected = adaptivePolicy.tier === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setManualTier(t.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500'
                      : 'bg-neutral-800/40 border-neutral-700 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">{t.label}</span>
                    {isSelected && <Check size={16} className="text-cyan-400" />}
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed mt-1">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
