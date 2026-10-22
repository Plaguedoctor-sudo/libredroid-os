import React, { useState } from 'react';
import { ChevronLeft, Circle, Square, Home, Grid } from 'lucide-react';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { usePersona } from '../../context/PersonaContext';

export const NavigationBar: React.FC = () => {
  const { returnHome, goBack, activeWindowId, minimizeWindow } = useWindow();
  const { 
    isRecentsOpen, 
    setIsRecentsOpen, 
    isAppDrawerOpen, 
    setIsAppDrawerOpen,
    isShadeOpen,
    setIsShadeOpen,
    isAssistantOpen,
    setIsAssistantOpen
  } = useSystem();
  
  const { persona, isWizardOpen, setIsWizardOpen } = usePersona();
  const [isHomebarPressed, setIsHomebarPressed] = useState(false);

  // Unified Smart Back Action
  const handleBack = () => {
    if (navigator.vibrate) navigator.vibrate(12);

    // 1. Close Adaptation Wizard if open
    if (isWizardOpen) {
      setIsWizardOpen(false);
      return;
    }
    // 2. Close AI Assistant if open
    if (isAssistantOpen) {
      setIsAssistantOpen(false);
      return;
    }
    // 3. Close Quick Settings shade if open
    if (isShadeOpen) {
      setIsShadeOpen(false);
      return;
    }
    // 4. Close App Drawer if open
    if (isAppDrawerOpen) {
      setIsAppDrawerOpen(false);
      return;
    }
    // 5. Close Recents if open
    if (isRecentsOpen) {
      setIsRecentsOpen(false);
      return;
    }
    // 6. Minimize or close active foreground window
    if (activeWindowId) {
      minimizeWindow(activeWindowId);
      return;
    }
    // 7. Base Home: smooth fallback
    goBack();
  };

  // Unified Smart Home Action
  const handleHome = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    setIsWizardOpen(false);
    setIsAssistantOpen(false);
    setIsShadeOpen(false);
    setIsAppDrawerOpen(false);
    setIsRecentsOpen(false);
    returnHome();
  };

  // Unified Smart Recents Action
  const handleRecents = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    setIsWizardOpen(false);
    setIsAssistantOpen(false);
    setIsShadeOpen(false);
    setIsAppDrawerOpen(false);
    setIsRecentsOpen(!isRecentsOpen);
  };

  const navStyle = persona.navigationStyle || 'android_buttons';
  const isAccessible = persona.uiDensity === 'accessible_large';

  // 1. Apple iOS Swipe Home Indicator Bar
  if (navStyle === 'ios_homebar') {
    return (
      <footer className="w-full h-10 flex items-center justify-center bg-black/40 backdrop-blur-md shrink-0 z-40 select-none touch-manipulation border-t border-white/5">
        <button
          onClick={handleHome}
          onDoubleClick={handleRecents}
          onTouchStart={() => setIsHomebarPressed(true)}
          onTouchEnd={() => {
            setIsHomebarPressed(false);
            handleHome();
          }}
          className={`h-2 rounded-full transition-all duration-200 cursor-pointer touch-manipulation ${
            isHomebarPressed ? 'w-48 bg-white scale-110 shadow-lg' : 'w-36 bg-white/70 hover:bg-white'
          }`}
          title="Tap for Home • Double-tap for Recents"
        />
      </footer>
    );
  }

  // 2. Android Modern Gesture Pill
  if (navStyle === 'android_gestures') {
    return (
      <footer className="w-full h-11 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md text-white/80 shrink-0 z-40 select-none border-t border-white/5 touch-manipulation">
        <button
          onClick={handleBack}
          className="p-2 text-xs text-white/80 hover:text-white flex items-center gap-1.5 hover:bg-white/10 active:scale-90 rounded-xl transition-all touch-manipulation min-w-[50px] min-h-[40px] justify-center"
          title="Back Gesture"
        >
          <ChevronLeft size={20} />
          <span className="hidden sm:inline text-xs font-semibold">Back</span>
        </button>

        <button
          onClick={handleHome}
          className="w-28 h-1.5 bg-white/70 hover:bg-white active:scale-95 active:bg-white rounded-full transition-all hover:w-32 cursor-pointer touch-manipulation"
          title="Home Gesture"
        />

        <button
          onClick={handleRecents}
          className="p-2 text-xs text-white/80 hover:text-white flex items-center gap-1.5 hover:bg-white/10 active:scale-90 rounded-xl transition-all touch-manipulation min-w-[50px] min-h-[40px] justify-center"
          title="Overview"
        >
          <span className="hidden sm:inline text-xs font-semibold">Recents</span>
          <Square size={16} />
        </button>
      </footer>
    );
  }

  // 3. Desktop Taskbar Navigation Style (when enabled via Developer/Power User Persona)
  if (navStyle === 'desktop_taskbar') {
    return (
      <footer className="w-full h-12 px-4 flex items-center justify-between bg-neutral-950/90 backdrop-blur-xl text-white shrink-0 z-40 border-t border-white/10 select-none touch-manipulation">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              setIsAppDrawerOpen(!isAppDrawerOpen);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-xs font-bold transition-all shadow touch-manipulation"
            title="Start Menu"
          >
            <Grid size={16} />
            <span>Start</span>
          </button>

          <button
            onClick={handleHome}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white transition-all touch-manipulation"
            title="Show Desktop"
          >
            <Home size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-90 text-neutral-300 hover:text-white transition-all touch-manipulation"
            title="Back"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleRecents}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-90 text-neutral-300 hover:text-white transition-all touch-manipulation"
            title="Multitasking Overview"
          >
            <Square size={16} />
          </button>
        </div>
      </footer>
    );
  }

  // 4. Classic 3-Button Navigation (Default with Full Accessible Hitboxes)
  return (
    <footer className={`w-full flex items-center justify-around bg-black/50 backdrop-blur-md text-white/90 shrink-0 z-40 border-t border-white/10 select-none touch-manipulation ${
      isAccessible ? 'h-16 px-6 bg-black/80' : 'h-12 px-8'
    }`}>
      {/* Back button */}
      <button 
        onClick={handleBack}
        className={`flex items-center justify-center hover:text-white active:scale-90 active:bg-white/20 transition-all rounded-2xl touch-manipulation cursor-pointer ${
          isAccessible 
            ? 'p-3 bg-neutral-800 text-white font-extrabold min-w-[80px] min-h-[48px]' 
            : 'p-3 min-w-[64px] min-h-[44px] hover:bg-white/10'
        }`}
        title="Back (Closes windows & overlays)"
      >
        <ChevronLeft size={isAccessible ? 30 : 24} />
        {isAccessible && <span className="ml-1 text-xs">Back</span>}
      </button>

      {/* Home button */}
      <button 
        onClick={handleHome}
        className={`flex items-center justify-center hover:text-white active:scale-90 active:bg-white/20 transition-all rounded-2xl touch-manipulation cursor-pointer ${
          isAccessible 
            ? 'p-3 bg-neutral-800 text-white font-extrabold min-w-[80px] min-h-[48px]' 
            : 'p-3 min-w-[64px] min-h-[44px] hover:bg-white/10'
        }`}
        title="Home (Returns to Home screen)"
      >
        {isAccessible ? <Home size={26} /> : <Circle size={20} />}
        {isAccessible && <span className="ml-1 text-xs">Home</span>}
      </button>

      {/* Recents / Multitasking Overview */}
      <button 
        onClick={handleRecents}
        className={`flex items-center justify-center hover:text-white active:scale-90 active:bg-white/20 transition-all rounded-2xl touch-manipulation cursor-pointer ${
          isAccessible 
            ? 'p-3 bg-neutral-800 text-white font-extrabold min-w-[80px] min-h-[48px]' 
            : 'p-3 min-w-[64px] min-h-[44px] hover:bg-white/10'
        }`}
        title="Recent Apps Overview"
      >
        <Square size={isAccessible ? 24 : 18} />
        {isAccessible && <span className="ml-1 text-xs">Recents</span>}
      </button>
    </footer>
  );
};
