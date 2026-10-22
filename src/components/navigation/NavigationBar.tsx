import React, { useState } from 'react';
import { ChevronLeft, Circle, Square, Home } from 'lucide-react';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { usePersona } from '../../context/PersonaContext';

export const NavigationBar: React.FC = () => {
  const { returnHome, goBack } = useWindow();
  const { isRecentsOpen, setIsRecentsOpen, setIsAppDrawerOpen } = useSystem();
  const { persona } = usePersona();

  const [isHomebarPressed, setIsHomebarPressed] = useState(false);

  const handleRecents = () => {
    setIsAppDrawerOpen(false);
    setIsRecentsOpen(!isRecentsOpen);
  };

  const navStyle = persona.navigationStyle || 'android_buttons';
  const isAccessible = persona.uiDensity === 'accessible_large';

  // 1. Apple iOS Swipe Home Indicator Bar
  if (navStyle === 'ios_homebar') {
    return (
      <footer className="w-full h-8 flex items-center justify-center bg-black/30 backdrop-blur-md shrink-0 z-30 select-none">
        <button
          onClick={returnHome}
          onDoubleClick={handleRecents}
          onMouseDown={() => setIsHomebarPressed(true)}
          onMouseUp={() => setIsHomebarPressed(false)}
          onTouchStart={() => setIsHomebarPressed(true)}
          onTouchEnd={() => {
            setIsHomebarPressed(false);
            returnHome();
          }}
          className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            isHomebarPressed ? 'w-44 bg-white scale-110 shadow-lg' : 'w-32 bg-white/70 hover:bg-white'
          }`}
          title="Tap for Home • Double-tap for Recents"
        />
      </footer>
    );
  }

  // 2. Android Modern Gesture Pill
  if (navStyle === 'android_gestures') {
    return (
      <footer className="w-full h-9 px-6 flex items-center justify-between bg-black/35 backdrop-blur-md text-white/80 shrink-0 z-30 select-none border-t border-white/5">
        <button
          onClick={goBack}
          className="p-1.5 text-xs text-white/70 hover:text-white flex items-center gap-1 hover:bg-white/10 rounded-xl transition-colors"
          title="Back Gesture"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline text-[11px]">Back</span>
        </button>

        <button
          onClick={returnHome}
          className="w-24 h-1 bg-white/70 hover:bg-white rounded-full transition-all hover:w-28 cursor-pointer"
          title="Home Gesture"
        />

        <button
          onClick={handleRecents}
          className="p-1.5 text-xs text-white/70 hover:text-white flex items-center gap-1 hover:bg-white/10 rounded-xl transition-colors"
          title="Overview"
        >
          <span className="hidden sm:inline text-[11px]">Recents</span>
          <Square size={14} />
        </button>
      </footer>
    );
  }

  // 3. Classic 3-Button Navigation (with Accessible Large Touch Target Support)
  return (
    <footer className={`w-full flex items-center justify-around bg-black/40 backdrop-blur-md text-white/80 shrink-0 z-30 border-t border-white/5 select-none ${
      isAccessible ? 'h-14 px-6 bg-black/70' : 'h-11 px-8'
    }`}>
      {/* Back button */}
      <button 
        onClick={goBack}
        className={`flex items-center justify-center hover:text-white active:scale-90 transition-all rounded-full hover:bg-white/10 ${
          isAccessible ? 'p-3 bg-neutral-800 text-white font-bold' : 'p-2'
        }`}
        title="Back"
      >
        <ChevronLeft size={isAccessible ? 28 : 22} />
        {isAccessible && <span className="ml-1 text-xs">Back</span>}
      </button>

      {/* Home button */}
      <button 
        onClick={returnHome}
        className={`flex items-center justify-center hover:text-white active:scale-90 transition-all rounded-full hover:bg-white/10 ${
          isAccessible ? 'p-3 bg-neutral-800 text-white font-bold' : 'p-2'
        }`}
        title="Home"
      >
        {isAccessible ? <Home size={24} /> : <Circle size={18} />}
        {isAccessible && <span className="ml-1 text-xs">Home</span>}
      </button>

      {/* Recents / Multitasking Overview */}
      <button 
        onClick={handleRecents}
        className={`flex items-center justify-center hover:text-white active:scale-90 transition-all rounded-full hover:bg-white/10 ${
          isAccessible ? 'p-3 bg-neutral-800 text-white font-bold' : 'p-2'
        }`}
        title="Recent Apps"
      >
        <Square size={isAccessible ? 22 : 17} />
        {isAccessible && <span className="ml-1 text-xs">Recents</span>}
      </button>
    </footer>
  );
};
