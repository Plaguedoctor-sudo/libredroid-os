import React, { useState } from 'react';
import { 
  Camera, 
  Video, 
  Calculator, 
  FileText, 
  Mic, 
  Eye, 
  Gamepad2, 
  ArrowRightLeft, 
  ChevronRight, 
  ChevronLeft,
  Sliders,
  Scissors,
  Sparkles,
  Layers
} from 'lucide-react';
import { useWindow } from '../../context/WindowContext';

export const SmartSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [side, setSide] = useState<'right' | 'left'>('right');
  const [screenshotFlash, setScreenshotFlash] = useState(false);
  const { openApp } = useWindow();

  const handleScreenshot = () => {
    setScreenshotFlash(true);
    setIsOpen(false);
    setTimeout(() => setScreenshotFlash(false), 800);
  };

  const tools = [
    {
      id: 'screenshot',
      name: 'Screenshot',
      icon: Camera,
      color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      action: handleScreenshot,
    },
    {
      id: 'screen_record',
      name: 'Screen Record',
      icon: Video,
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      action: () => {
        openApp('screen_recorder');
        setIsOpen(false);
      },
    },
    {
      id: 'calc',
      name: 'Calculator',
      icon: Calculator,
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      action: () => {
        openApp('calculator');
        setIsOpen(false);
      },
    },
    {
      id: 'notes',
      name: 'Quick Notes',
      icon: FileText,
      color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      action: () => {
        openApp('notes');
        setIsOpen(false);
      },
    },
    {
      id: 'recorder',
      name: 'Sound Recorder',
      icon: Mic,
      color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      action: () => {
        openApp('sound_recorder');
        setIsOpen(false);
      },
    },
    {
      id: 'eye_comfort',
      name: 'Eye Comfort',
      icon: Eye,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      action: () => {
        openApp('eye_comfort');
        setIsOpen(false);
      },
    },
    {
      id: 'game_space',
      name: 'Game Space',
      icon: Gamepad2,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      action: () => {
        openApp('game_space');
        setIsOpen(false);
      },
    },
    {
      id: 'pad_connect',
      name: 'Pad Synergy',
      icon: ArrowRightLeft,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      action: () => {
        openApp('pad_connect');
        setIsOpen(false);
      },
    },
  ];

  return (
    <>
      {/* Full-screen flash effect when screenshot is triggered */}
      {screenshotFlash && (
        <div className="fixed inset-0 bg-white/70 z-[99999] pointer-events-none animate-ping duration-300" />
      )}

      {/* Edge Handle Pill */}
      <div
        className={`fixed top-1/2 -translate-y-1/2 z-[8000] select-none ${
          side === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className={`w-3.5 h-20 rounded-l-full bg-white/30 hover:bg-white/50 border border-white/40 shadow-2xl backdrop-blur flex items-center justify-center transition-all cursor-pointer hover:w-5 group active:scale-95 ${
              side === 'left' ? 'rounded-l-none rounded-r-full' : ''
            }`}
            title="ColorOS Smart Sidebar"
          >
            <div className="w-1 h-6 bg-white/80 rounded-full group-hover:bg-cyan-400 transition-colors" />
          </button>
        ) : (
          /* Expanded Sidebar Drawer */
          <div className="flex items-center">
            <div className="w-48 bg-neutral-900/95 border border-neutral-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-3 flex flex-col gap-2 animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-cyan-400" /> Smart Sidebar
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-400 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </div>

              {/* Grid of Tools */}
              <div className="grid grid-cols-2 gap-2">
                {tools.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={t.action}
                      className="p-2.5 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-750 flex flex-col items-center justify-center text-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                    >
                      <div className={`p-2 rounded-lg border ${t.color}`}>
                        <Icon size={16} />
                      </div>
                      <span className="text-[10px] font-medium text-neutral-300 group-hover:text-white leading-tight">
                        {t.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* File Dock Dropzone */}
              <div className="mt-1 p-2 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/40 text-center">
                <span className="text-[9px] text-neutral-400 font-medium block">
                  📂 File Dock Dropzone
                </span>
                <span className="text-[8px] text-neutral-500">Drag items here to shuttle</span>
              </div>
            </div>

            {/* Close Toggle */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-l-xl bg-neutral-800 text-neutral-400 hover:text-white border-y border-l border-neutral-700 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
export default SmartSidebar;
