import React, { useState } from 'react';
import { 
  ShieldCheck, 
  BatteryCharging, 
  HardDrive, 
  Cpu, 
  CheckCircle2, 
  Zap, 
  RefreshCw, 
  Sliders, 
  Moon, 
  AlertCircle,
  Sparkles,
  Smartphone,
  Check
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

export const DeviceCareApp: React.FC = () => {
  const { batteryLevel, isCharging } = useSystem();
  const [score, setScore] = useState(94);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedDone, setOptimizedDone] = useState(false);

  // Samsung Battery features
  const [protectBattery, setProtectBattery] = useState(true); // 85% cap
  const [powerSaving, setPowerSaving] = useState(false);
  const [ramPlusGb, setRamPlusGb] = useState<number>(4); // +4 GB RAM Plus

  const handleOptimizeNow = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizedDone(true);
      setScore(100);
      if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    }, 1200);
  };

  return (
    <div className="w-full h-full bg-[#0d0e13] text-white flex flex-col overflow-hidden font-sans">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#12141c] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              Device Care
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Samsung Galaxy M14
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400">Exynos 1330 • 6,000 mAh Optimization Engine</p>
          </div>
        </div>

        <button
          onClick={handleOptimizeNow}
          disabled={isOptimizing || score === 100}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition-all ${
            score === 100 
              ? 'bg-neutral-800 text-neutral-400 cursor-default'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95'
          }`}
        >
          {isOptimizing ? (
            <>
              <RefreshCw size={13} className="animate-spin" />
              <span>Optimizing...</span>
            </>
          ) : score === 100 ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span>Optimized</span>
            </>
          ) : (
            <>
              <Zap size={13} />
              <span>Optimize now</span>
            </>
          )}
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        
        {/* Device Score Hero Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-[#12131a] border border-neutral-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Device Health</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold font-mono text-cyan-400">{score}</span>
              <span className="text-sm text-neutral-400">/ 100</span>
            </div>
            <p className="text-xs text-neutral-300 mt-2">
              {score === 100 ? 'All background services and 6000mAh battery running at peak efficiency.' : 'Minor background cache detected. Tap Optimize now.'}
            </p>
          </div>

          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-neutral-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-cyan-400 transition-all duration-1000 stroke-current"
                strokeDasharray={`${score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-cyan-400 font-bold text-sm">
              {score}%
            </div>
          </div>
        </div>

        {/* 1. Samsung 6,000 mAh Monster Battery Card */}
        <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <BatteryCharging size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  Monster Battery
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                    6,000 mAh
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">
                  {isCharging ? '⚡ 25W Fast Charging' : '1 Day 18 Hours Remaining'}
                </p>
              </div>
            </div>
            <span className="text-xl font-bold font-mono text-emerald-400">{batteryLevel}%</span>
          </div>

          {/* Protect Battery (85% Limit) Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#14161f] border border-neutral-750 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-white">Protect Battery (85% Limit)</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Stops charging when battery reaches 85% to preserve battery lifespan for 5+ years.
              </p>
            </div>
            <button
              onClick={() => setProtectBattery(!protectBattery)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                protectBattery ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                protectBattery ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Power Saving Mode Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#14161f] border border-neutral-750 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-white">Power Saving Mode</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Limits CPU to 70%, disables background network sync, and restricts display brightness.
              </p>
            </div>
            <button
              onClick={() => setPowerSaving(!powerSaving)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                powerSaving ? 'bg-amber-500' : 'bg-neutral-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                powerSaving ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* 2. Storage & Memory (RAM Plus) Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Storage Cleaner */}
          <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <HardDrive size={16} />
                </div>
                <h4 className="text-xs font-bold">Storage</h4>
              </div>
              <span className="text-xs font-mono text-purple-400">42.6 / 128 GB</span>
            </div>

            <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden mb-3">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '33%' }} />
            </div>

            <p className="text-[11px] text-neutral-400 mb-2">Trash & Duplicate Files: 1.2 GB can be cleaned</p>
            <button 
              onClick={() => setScore(100)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-xl transition-colors"
            >
              Clean Storage (1.2 GB)
            </button>
          </div>

          {/* Memory & RAM Plus */}
          <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Cpu size={16} />
                </div>
                <h4 className="text-xs font-bold">Memory & RAM Plus</h4>
              </div>
              <span className="text-xs font-mono text-blue-400">3.8 / 6 GB</span>
            </div>

            <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden mb-3">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '63%' }} />
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-300 mb-2">
              <span>RAM Plus Virtual Expansion:</span>
              <span className="font-bold text-blue-400">+{ramPlusGb} GB</span>
            </div>

            {/* RAM Plus Selectors */}
            <div className="grid grid-cols-4 gap-1.5">
              {[2, 4, 6, 8].map((gb) => (
                <button
                  key={gb}
                  onClick={() => setRamPlusGb(gb)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    ramPlusGb === gb 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-400'
                  }`}
                >
                  +{gb}GB
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
