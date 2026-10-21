import React from 'react';
import { CloudSun, Calendar, Sparkles } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

export const AtAGlanceWidget: React.FC = () => {
  const { currentTime, setIsAssistantOpen } = useSystem();

  const formattedDate = currentTime.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="w-full flex flex-col items-start px-2 py-3 select-none text-white drop-shadow-md">
      {/* Date & Weather Row */}
      <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
        <span>{formattedDate}</span>
        <span className="text-white/60">•</span>
        <div className="flex items-center gap-1.5 text-base font-normal">
          <CloudSun size={20} className="text-amber-300" />
          <span>22°C</span>
        </div>
      </div>

      {/* Dynamic Context Pill / Smart Suggestion */}
      <button 
        onClick={() => setIsAssistantOpen(true)}
        className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-xs font-medium text-white/90 border border-white/10 transition-all hover:scale-102"
      >
        <Sparkles size={13} className="text-purple-300" />
        <span>Universal System Active • All profiles synced</span>
      </button>
    </div>
  );
};
