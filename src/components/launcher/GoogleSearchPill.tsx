import React from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';

export const GoogleSearchPill: React.FC = () => {
  const { setIsAssistantOpen } = useSystem();
  const { openApp } = useWindow();

  return (
    <div 
      onClick={() => openApp('browser')}
      className="w-full max-w-lg mx-auto h-12 bg-white/20 hover:bg-white/25 backdrop-blur-xl border border-white/25 rounded-full px-4 flex items-center justify-between text-white shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.01]"
      title="Search the web or ask assistant"
    >
      {/* Left: Google 4-color 'G' logo */}
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm bg-white text-neutral-800 shadow-sm">
          <span className="text-[#4285f4]">G</span>
        </div>
        <span className="text-sm text-white/80 font-normal">Search or type URL...</span>
      </div>

      {/* Right: Microphone & Gemini Lens */}
      <div className="flex items-center gap-3 text-white/90">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsAssistantOpen(true);
          }}
          className="p-1 hover:text-white transition-colors"
          title="Voice Search"
        >
          <Mic size={18} />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsAssistantOpen(true);
          }}
          className="p-1 text-purple-300 hover:text-purple-200 transition-colors"
          title="Ask Omni Gemini AI"
        >
          <Sparkles size={18} />
        </button>
      </div>
    </div>
  );
};
