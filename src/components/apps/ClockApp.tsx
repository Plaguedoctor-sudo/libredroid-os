import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw, Globe, Bell } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

export const ClockApp: React.FC = () => {
  const { currentTime } = useSystem();
  const [tab, setTab] = useState<'clock' | 'stopwatch'>('clock');
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatStopwatch = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Clock App Tabs */}
      <div className="flex items-center justify-center gap-2 p-3 bg-neutral-950 border-b border-neutral-800 shrink-0">
        <button
          onClick={() => setTab('clock')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            tab === 'clock' ? 'bg-purple-600 text-white shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          World Clock
        </button>
        <button
          onClick={() => setTab('stopwatch')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            tab === 'stopwatch' ? 'bg-purple-600 text-white font-semibold shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Stopwatch
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {tab === 'clock' ? (
          <div className="space-y-4">
            <div className="text-6xl sm:text-7xl font-extralight font-mono tracking-tight text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-sm text-purple-300 font-medium">
              {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8 max-w-xs mx-auto">
              <div className="p-3 bg-neutral-800/60 rounded-2xl border border-neutral-700/60 text-left">
                <div className="text-xs text-neutral-400">San Francisco</div>
                <div className="text-sm font-semibold mt-1">UTC -7</div>
              </div>
              <div className="p-3 bg-neutral-800/60 rounded-2xl border border-neutral-700/60 text-left">
                <div className="text-xs text-neutral-400">Tokyo</div>
                <div className="text-sm font-semibold mt-1">UTC +9</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-7xl font-mono font-light tracking-tight text-purple-300">
              {formatStopwatch(stopwatchSeconds)}
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
                  isRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-purple-600 hover:bg-purple-500'
                }`}
              >
                {isRunning ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
              </button>

              <button
                onClick={() => {
                  setIsRunning(false);
                  setStopwatchSeconds(0);
                }}
                className="w-14 h-14 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition-transform active:scale-95"
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
