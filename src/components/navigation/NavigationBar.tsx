import React from 'react';
import { ChevronLeft, Circle, Square } from 'lucide-react';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';

export const NavigationBar: React.FC = () => {
  const { returnHome, goBack } = useWindow();
  const { isRecentsOpen, setIsRecentsOpen, setIsAppDrawerOpen } = useSystem();

  const handleRecents = () => {
    setIsAppDrawerOpen(false);
    setIsRecentsOpen(!isRecentsOpen);
  };

  return (
    <footer className="w-full h-11 px-8 flex items-center justify-around bg-black/40 backdrop-blur-md text-white/80 shrink-0 z-30 border-t border-white/5">
      {/* Back button */}
      <button 
        onClick={goBack}
        className="p-2 hover:text-white active:scale-90 transition-all rounded-full hover:bg-white/10"
        title="Back"
      >
        <ChevronLeft size={22} />
      </button>

      {/* Home button */}
      <button 
        onClick={returnHome}
        className="p-2 hover:text-white active:scale-90 transition-all rounded-full hover:bg-white/10"
        title="Home"
      >
        <Circle size={18} />
      </button>

      {/* Recents / Multitasking Overview */}
      <button 
        onClick={handleRecents}
        className="p-2 hover:text-white active:scale-90 transition-all rounded-full hover:bg-white/10"
        title="Recent Apps"
      >
        <Square size={17} />
      </button>
    </footer>
  );
};
