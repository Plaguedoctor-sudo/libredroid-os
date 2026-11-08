import React, { useState, useEffect } from 'react';
import { 
  Battery, 
  BatteryCharging, 
  Zap, 
  ShieldCheck, 
  Sliders, 
  Activity, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Flame, 
  ToggleLeft, 
  ToggleRight,
  TrendingDown
} from 'lucide-react';

interface AppPowerUsage {
  name: string;
  category: string;
  percent: number;
  mah: number;
  iconBg: string;
}

export const BatteryGuardianApp: React.FC = () => {
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(true);
  const [chargingSpeed, setChargingSpeed] = useState<'Normal' | 'Fast' | 'SuperVOOC'>('SuperVOOC');
  const [powerMode, setPowerMode] = useState<'performance' | 'balanced' | 'saving' | 'super_saving'>('balanced');
  const [smartChargeLimit, setSmartChargeLimit] = useState(true);
  const [reverseCharging, setReverseCharging] = useState(false);
  const [batteryHealthPercent] = useState(99);
  const [cycleCount] = useState(128);
  const [batteryTemp] = useState(28.2);

  // Read real browser Battery API if available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      }).catch(() => {});
    }
  }, []);

  const appUsages: AppPowerUsage[] = [
    { name: 'Display & High Refresh Panel', category: 'Hardware', percent: 34, mah: 1420, iconBg: 'bg-amber-500' },
    { name: 'Waydroid AOSP Container', category: 'Runtime', percent: 22, mah: 910, iconBg: 'bg-emerald-500' },
    { name: 'LibreBrowse', category: 'Network', percent: 18, mah: 750, iconBg: 'bg-sky-500' },
    { name: 'Multi-OS Hypervisor Matrix', category: 'System', percent: 14, mah: 580, iconBg: 'bg-purple-500' },
    { name: 'Universal AI Engine', category: 'Productivity', percent: 7, mah: 290, iconBg: 'bg-indigo-500' },
    { name: 'System Core & Audio Mixer', category: 'System', percent: 5, mah: 210, iconBg: 'bg-neutral-600' },
  ];

  const estimatedTime = isCharging ? '35m to Full' : '18h 40m Remaining';

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white font-sans overflow-y-auto select-none">
      {/* Top Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Battery & Energy Guardian</h1>
            <p className="text-[11px] text-neutral-400">ColorOS Power Engine • Adaptive SuperVOOC Longevity</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
            Health: {batteryHealthPercent}%
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Main Battery Gauge Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-emerald-950/30 border border-neutral-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              {isCharging ? <BatteryCharging size={16} /> : <Battery size={16} />}
              {isCharging ? `${chargingSpeed} Flash Charging` : 'On Battery Power'}
            </div>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-6xl font-light font-mono text-white tracking-tight">{batteryLevel}</span>
              <span className="text-2xl text-emerald-400 font-bold">%</span>
            </div>
            <p className="text-xs text-neutral-400 flex items-center justify-center md:justify-start gap-1">
              <Clock size={13} /> {estimatedTime}
            </p>
          </div>

          {/* Battery Level Visual Ring Bar */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" className="stroke-neutral-800" strokeWidth="8" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-emerald-400 transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * batteryLevel) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <Zap size={28} className={isCharging ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'} />
              <span className="text-[10px] text-neutral-400 font-mono mt-1">{batteryTemp}°C</span>
            </div>
          </div>
        </div>

        {/* Power Modes Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Sliders size={14} className="text-cyan-400" />
            Performance & Power Profiles
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'performance', title: 'High Performance', desc: 'Max CPU/GPU & 90Hz unthrottled', color: 'rose' },
              { id: 'balanced', title: 'Balanced (Default)', desc: 'Adaptive power scaling', color: 'cyan' },
              { id: 'saving', title: 'Power Saving', desc: 'Limits background sync & display', color: 'amber' },
              { id: 'super_saving', title: 'Super Power Saving', desc: 'Essential 6 apps only, max life', color: 'emerald' },
            ].map((mode) => {
              const active = powerMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setPowerMode(mode.id as any)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    active
                      ? 'bg-neutral-800/90 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-sm font-semibold text-white">{mode.title}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-neutral-700'}`}
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-tight">{mode.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Battery Health & Longevity Protection Toggles */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            Hardware Battery Health & Protection
          </h3>

          <div className="flex items-center justify-between py-2 border-b border-neutral-800/60">
            <div>
              <h4 className="text-sm font-medium text-neutral-200">Stop Charging at 80% (Smart Protection)</h4>
              <p className="text-xs text-neutral-400">Preserves maximum battery chemistry lifespan by avoiding 100% saturation</p>
            </div>
            <button
              onClick={() => setSmartChargeLimit(!smartChargeLimit)}
              className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              {smartChargeLimit ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-neutral-600" />}
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-neutral-800/60">
            <div>
              <h4 className="text-sm font-medium text-neutral-200">Reverse USB OTG Power Delivery</h4>
              <p className="text-xs text-neutral-400">Power connected accessories (earphones, stylus, phone) from tablet battery</p>
            </div>
            <button
              onClick={() => setReverseCharging(!reverseCharging)}
              className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              {reverseCharging ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-neutral-600" />}
            </button>
          </div>

          {/* Health Details Bar */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/60">
              <span className="text-[11px] text-neutral-400 block">Max Capacity</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{batteryHealthPercent}%</span>
            </div>
            <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/60">
              <span className="text-[11px] text-neutral-400 block">Cycle Count</span>
              <span className="text-lg font-bold font-mono text-white">{cycleCount}</span>
            </div>
            <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/60">
              <span className="text-[11px] text-neutral-400 block">Temperature</span>
              <span className="text-lg font-bold font-mono text-cyan-400">{batteryTemp}°C</span>
            </div>
          </div>
        </div>

        {/* Per-App Battery Consumption Breakdown */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Activity size={14} className="text-cyan-400" />
              App Battery Usage (Last 24 Hours)
            </h3>
            <span className="text-xs text-neutral-400">Total drain: 4,160 mAh</span>
          </div>

          <div className="space-y-3">
            {appUsages.map((app, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${app.iconBg}`} />
                    <span className="font-semibold text-neutral-200">{app.name}</span>
                    <span className="text-[10px] text-neutral-500 uppercase">({app.category})</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-neutral-400">{app.mah} mAh</span>
                    <span className="font-bold text-white w-10 text-right">{app.percent}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div className={`h-full ${app.iconBg} rounded-full`} style={{ width: `${app.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default BatteryGuardianApp;
