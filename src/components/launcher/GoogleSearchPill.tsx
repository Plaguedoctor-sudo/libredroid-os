import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';

export const GoogleSearchPill: React.FC = () => {
  const { setIsAssistantOpen } = useSystem();
  const { openApp } = useWindow();

  return (
    <div 
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(12);
        openApp('browser');
      }}
      className="w-full max-w-lg mx-auto h-12 bg-neutral-900/85 hover:bg-neutral-850/90 active:scale-98 backdrop-blur-xl border border-neutral-700/80 rounded-full px-4 flex items-center justify-between text-white shadow-xl cursor-pointer transition-all duration-200 touch-manipulation select-none"
      title="Search private web with DuckDuckGo or ask Sovereign AI"
    >
      {/* Left: DuckDuckGo / SearXNG Privacy Indicator */}
      <div className="flex items-center gap-3 pointer-events-none">
        <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm shrink-0">
          <ShieldCheck size={15} />
        </div>
        <span className="text-xs sm:text-sm text-neutral-300 font-normal truncate">
          DuckDuckGo • Search without tracking...
        </span>
      </div>

      {/* Right: Sovereign Local AI Sparkle Button */}
      <div className="flex items-center gap-2 text-neutral-400">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.vibrate) navigator.vibrate(15);
            setIsAssistantOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 active:scale-95 text-purple-300 rounded-full text-xs font-semibold transition-all touch-manipulation min-h-[36px]"
          title="Ask Sovereign Local AI"
        >
          <Sparkles size={14} className="text-purple-400" />
          <span className="hidden sm:inline">Local AI</span>
        </button>
      </div>
    </div>
  );
};
