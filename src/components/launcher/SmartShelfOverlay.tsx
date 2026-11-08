import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  Footprints, 
  Zap, 
  HardDrive, 
  FileText, 
  Play, 
  Pause, 
  SkipForward, 
  Plus, 
  X, 
  ChevronRight, 
  Sparkles, 
  Camera, 
  Mic, 
  CheckCircle2, 
  BatteryCharging,
  Sliders,
  Clock,
  Compass,
  Volume2
} from 'lucide-react';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';

interface SmartShelfOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartShelfOverlay: React.FC<SmartShelfOverlayProps> = ({ isOpen, onClose }) => {
  const { openApp } = useWindow();
  const { batteryLevel, isCharging } = useSystem();

  // Quick Memo state
  const [memoText, setMemoText] = useState(() => {
    try {
      return localStorage.getItem('lrd_shelf_memo') || 'Review ColorOS feature matrix for tablet deployment.';
    } catch {
      return '';
    }
  });

  // Music Widget state
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(42);

  // Steps Widget state
  const [steps, setSteps] = useState(6480);
  const stepGoal = 10000;

  useEffect(() => {
    try {
      localStorage.setItem('lrd_shelf_memo', memoText);
    } catch {}
  }, [memoText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex justify-end bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Tap backdrop to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Shelf Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-[#121318]/95 border-l border-white/10 shadow-2xl flex flex-col overflow-hidden text-white z-10 transition-transform">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#17181f]/80 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">OnePlus Smart Shelf</h2>
              <p className="text-[11px] text-neutral-400">ColorOS Assistant Screen</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Widget Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 font-sans">

          {/* 1. Live Weather Card */}
          <div 
            onClick={() => { openApp('weather'); onClose(); }}
            className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/40 via-sky-900/30 to-neutral-900/50 border border-blue-500/20 hover:border-blue-400/40 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun className="text-amber-400 animate-pulse" size={26} />
                <div>
                  <h3 className="font-semibold text-sm">San Francisco</h3>
                  <p className="text-xs text-neutral-400">Partly Cloudy • AQI 32</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-light font-mono">22°C</span>
                <p className="text-[10px] text-neutral-400">H: 24° L: 16°</p>
              </div>
            </div>
          </div>

          {/* 2. SuperVOOC Battery & Device Health Card */}
          <div 
            onClick={() => { openApp('battery_guardian'); onClose(); }}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-teal-900/20 to-neutral-900/50 border border-emerald-500/20 hover:border-emerald-400/40 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <BatteryCharging size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-200">SuperVOOC Battery Guardian</h4>
                  <p className="text-[10px] text-neutral-400">Health: 99% • Smart Limit 80%</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 font-mono">{batteryLevel}%</span>
            </div>

            {/* Battery bar */}
            <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${batteryLevel}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>{isCharging ? '⚡ 33W Fast Charging' : 'Discharging'}</span>
              <span>Est. 14h 20m remaining</span>
            </div>
          </div>

          {/* 3. Daily Activity & Step Counter */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Footprints size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">Activity & Steps</h4>
                  <p className="text-[10px] text-neutral-400">Daily Goal: 10,000</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">{steps.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neutral-800/80 text-center">
              <div>
                <p className="text-[10px] text-neutral-400">Active Time</p>
                <p className="text-xs font-bold text-neutral-200 font-mono">48 min</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400">Calories</p>
                <p className="text-xs font-bold text-rose-400 font-mono">312 kcal</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400">Distance</p>
                <p className="text-xs font-bold text-cyan-400 font-mono">4.2 km</p>
              </div>
            </div>
          </div>

          {/* 4. Quick Scratchpad / Memo */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileText size={16} />
                </div>
                <h4 className="text-xs font-semibold">Quick Memo</h4>
              </div>
              <button 
                onClick={() => { openApp('notes'); onClose(); }}
                className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
              >
                All Notes <ChevronRight size={12} />
              </button>
            </div>
            <textarea 
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              placeholder="Jot down quick thoughts here..."
              rows={3}
              className="w-full bg-[#181920] border border-neutral-750 rounded-xl p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
            />
          </div>

          {/* 5. Storage & RAM Health */}
          <div 
            onClick={() => { openApp('settings'); onClose(); }}
            className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <HardDrive size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">Storage & Memory</h4>
                  <p className="text-[10px] text-neutral-400">RAM Expansion: +4.0 GB</p>
                </div>
              </div>
              <span className="text-xs font-mono text-purple-400">48.2 / 128 GB</span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden mt-1">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '38%' }} />
            </div>
          </div>

          {/* 6. Media Player Card */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-400 flex items-center justify-center shadow-md shrink-0">
                <Volume2 size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold truncate text-white">Midnight City</h4>
                <p className="text-[11px] text-neutral-400 truncate">M83 • Hurry Up, We're Dreaming</p>
                
                {/* Progress bar */}
                <div className="w-full h-1 rounded-full bg-neutral-800 mt-2 overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${trackProgress}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors"
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
                <button 
                  onClick={() => setTrackProgress(10)}
                  className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                >
                  <SkipForward size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* 7. Quick Toolbox Grid */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-1">
              Quick Toolbox
            </h4>
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => { openApp('sound_recorder'); onClose(); }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 transition-all text-center"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400">
                  <Mic size={16} />
                </div>
                <span className="text-[10px] text-neutral-300 font-medium">Record</span>
              </button>

              <button 
                onClick={() => { openApp('eye_comfort'); onClose(); }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 transition-all text-center"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sliders size={16} />
                </div>
                <span className="text-[10px] text-neutral-300 font-medium">Eye Care</span>
              </button>

              <button 
                onClick={() => { openApp('screen_recorder'); onClose(); }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 transition-all text-center"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                  <Camera size={16} />
                </div>
                <span className="text-[10px] text-neutral-300 font-medium">Capture</span>
              </button>

              <button 
                onClick={() => { openApp('game_space'); onClose(); }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 transition-all text-center"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Sparkles size={16} />
                </div>
                <span className="text-[10px] text-neutral-300 font-medium">HyperBoost</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-[#17181f]/60 text-center">
          <p className="text-[10px] text-neutral-500">ColorOS 14 • OnePlus Pad Go Edition</p>
        </div>

      </div>
    </div>
  );
};
