import React from 'react';
import { ShieldCheck, Sparkles, Search } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';

export const GoogleSearchPill: React.FC = () => {
  const { setIsAssistantOpen } = useSystem();
  const { openApp } = useWindow();

  return (
    <div 
      onClick={() => openApp('browser')}
      className="w-full max-w-lg mx-auto h-12 bg-neutral-900/80 hover:bg-neutral-850/90 backdrop-blur-xl border border-neutral-700/80 rounded-full px-4 flex items-center justify-between text-white shadow-xl cursor-pointer transition-all duration-200 hover:scale-[1.01]"
      title="Search private web with DuckDuckGo or ask Sovereign AI"
    >
      {/* Left: DuckDuckGo / SearXNG Privacy Indicator */}
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm">
          <ShieldCheck size={14} />
        </div>
        <span className="text-xs sm:text-sm text-neutral-300 font-normal">
          DuckDuckGo • Search without tracking...
        </span>
      </div>

      {/* Right: Sovereign Local AI Sparkle */}
      <div className="flex items-center gap-2 text-neutral-400">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsAssistantOpen(true);
          }}
          className="flex items-center gap-1 px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-full text-xs font-medium transition-colors"
          title="Ask Sovereign Local AI"
        >
          <Sparkles size={13} className="text-purple-400" />
          <span className="hidden sm:inline">Local AI</span>
        </button>
      </div>
    </div>
  );
};
