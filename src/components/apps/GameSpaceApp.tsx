import React, { useState } from 'react';
import { 
  Gamepad2, 
  Flame, 
  Zap, 
  ShieldAlert, 
  BellOff, 
  PhoneOff, 
  Sliders, 
  Gauge, 
  Play, 
  Sparkles, 
  Lock, 
  Cpu,
  Monitor
} from 'lucide-react';

interface GameItem {
  id: string;
  title: string;
  genre: string;
  fpsTarget: number;
  playtime: string;
  iconBg: string;
}

export const GameSpaceApp: React.FC = () => {
  const [performanceMode, setPerformanceMode] = useState<'pro' | 'balanced' | 'low_power'>('pro');
  const [blockNotifications, setBlockNotifications] = useState(true);
  const [rejectCalls, setRejectCalls] = useState(true);
  const [lockBrightness, setLockBrightness] = useState(true);
  const [touchOptimization, setTouchOptimization] = useState(true);
  const [currentFps] = useState(89.8);
  const [cpuLoad] = useState(38);
  const [gpuLoad] = useState(64);
  const [temperature] = useState(34.6);

  const games: GameItem[] = [
    { id: 'game_1', title: 'Genshin Impact', genre: 'Open World RPG', fpsTarget: 60, playtime: '14h 20m', iconBg: 'from-amber-500 to-red-600' },
    { id: 'game_2', title: 'Call of Duty: Mobile', genre: 'Action FPS', fpsTarget: 90, playtime: '38h 45m', iconBg: 'from-neutral-700 to-neutral-900' },
    { id: 'game_3', title: 'PUBG Mobile', genre: 'Battle Royale', fpsTarget: 90, playtime: '52h 10m', iconBg: 'from-yellow-600 to-amber-700' },
    { id: 'game_4', title: 'Asphalt 9: Legends', genre: 'Arcade Racing', fpsTarget: 60, playtime: '9h 15m', iconBg: 'from-red-600 to-rose-700' },
  ];

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white font-sans overflow-y-auto select-none">
      {/* Top Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
            <Gamepad2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Game Space (HyperBoost Engine)</h1>
            <p className="text-[11px] text-neutral-400">ColorOS Gaming Core • GPA Frame Rate Stabilization & Touch Response</p>
          </div>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase tracking-wider">
          {performanceMode === 'pro' ? 'Pro Gamer Mode' : performanceMode}
        </span>
      </div>

      <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Real-Time Performance Telemetry HUD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* FPS Gauge */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-purple-950/30 border border-purple-500/30 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Display FPS</span>
              <Gauge size={16} className="text-purple-400" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold font-mono text-purple-300">{currentFps}</span>
              <span className="ml-1 text-xs text-neutral-400">/ 90Hz</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              ● GPA Frame Lock Active
            </span>
          </div>

          {/* CPU Load */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>CPU Load</span>
              <Cpu size={16} className="text-cyan-400" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold font-mono text-cyan-300">{cpuLoad}%</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">8 Cores @ 2.2 GHz</span>
          </div>

          {/* GPU Load */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Mali GPU</span>
              <Zap size={16} className="text-amber-400" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold font-mono text-amber-300">{gpuLoad}%</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">Vulkan 1.3 / OpenGL</span>
          </div>

          {/* Thermal Temp */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>SoC Temp</span>
              <Flame size={16} className="text-rose-400" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold font-mono text-rose-300">{temperature}°C</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">Thermal State: Cool</span>
          </div>
        </div>

        {/* Performance Mode Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Sliders size={14} className="text-purple-400" />
            Performance Profiles
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'pro', title: 'Pro Gamer Mode', desc: 'Unlocks peak CPU/GPU clocks and ultra-low touch latency for competitive gaming', color: 'purple' },
              { id: 'balanced', title: 'Balanced Mode', desc: 'Maintains consistent 60fps while conserving battery and controlling heat', color: 'cyan' },
              { id: 'low_power', title: 'Low Power Mode', desc: 'Optimizes power efficiency for casual games and prolonged travel sessions', color: 'emerald' },
            ].map((p) => {
              const active = performanceMode === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPerformanceMode(p.id as any)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    active
                      ? 'bg-neutral-800/90 border-purple-500/60 shadow-lg shadow-purple-500/10'
                      : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-sm font-semibold text-white">{p.title}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-purple-400' : 'bg-neutral-700'}`} />
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-tight">{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gamer Distraction Shield Switches */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-rose-400" />
            Gaming Focus & Do Not Disturb Toolkit
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
              <div className="flex items-center gap-3">
                <BellOff size={18} className="text-rose-400" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Block Banner Notifications</h4>
                  <p className="text-[10px] text-neutral-400">Zero interruption from chat alerts</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={blockNotifications}
                onChange={(e) => setBlockNotifications(e.target.checked)}
                className="accent-purple-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
              <div className="flex items-center gap-3">
                <PhoneOff size={18} className="text-rose-400" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Reject Incoming Calls</h4>
                  <p className="text-[10px] text-neutral-400">Silent call drop during matches</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={rejectCalls}
                onChange={(e) => setRejectCalls(e.target.checked)}
                className="accent-purple-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-cyan-400" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Lock Screen Brightness</h4>
                  <p className="text-[10px] text-neutral-400">Prevents auto-dim when hands cover sensor</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={lockBrightness}
                onChange={(e) => setLockBrightness(e.target.checked)}
                className="accent-purple-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-amber-400" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Ultra-Touch Sensitivity</h4>
                  <p className="text-[10px] text-neutral-400">240Hz touch sampling rate boost</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={touchOptimization}
                onChange={(e) => setTouchOptimization(e.target.checked)}
                className="accent-purple-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Game Library */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Gamepad2 size={14} className="text-purple-400" />
              Installed Games ({games.length})
            </h3>
            <span className="text-[11px] text-neutral-500">Auto-accelerated on launch</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {games.map((g) => (
              <div key={g.id} className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between hover:border-purple-500/40 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${g.iconBg} flex items-center justify-center shadow-md`}>
                    <Gamepad2 size={22} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{g.title}</h4>
                    <span className="text-[10px] text-neutral-400 block">{g.genre} • {g.playtime}</span>
                    <span className="text-[10px] text-purple-400 font-mono font-semibold">{g.fpsTarget} FPS Target</span>
                  </div>
                </div>

                <button className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Play size={13} /> Launch
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default GameSpaceApp;
