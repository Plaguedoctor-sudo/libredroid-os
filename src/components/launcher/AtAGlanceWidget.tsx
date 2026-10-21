import React from 'react';
import { CloudSun, ShieldCheck, Sparkles } from 'lucide-react';
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
        className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 backdrop-blur-md rounded-full text-xs font-medium text-emerald-300 border border-emerald-500/30 transition-all hover:scale-102"
      >
        <ShieldCheck size={13} className="text-emerald-400" />
        <span>LibreDroid Sovereign • Zero Big Tech Telemetry</span>
      </button>
    </div>
  );
};
