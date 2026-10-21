import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { StatusBar } from '../statusbar/StatusBar';
import { NavigationBar } from '../navigation/NavigationBar';
import { Taskbar } from '../navigation/Taskbar';
import { HomeScreen } from '../launcher/HomeScreen';
import { WindowFrame } from '../window/WindowFrame';
import { QuickSettingsPanel } from '../statusbar/QuickSettingsPanel';
import { AppDrawer } from '../launcher/AppDrawer';
import { RecentsView } from '../launcher/RecentsView';
import { OmniAssistant } from '../assistant/OmniAssistant';

export const DeviceFrame: React.FC = () => {
  const { deviceMode, actualDevice, isFolded, wallpaper } = useSystem();
  const { windows } = useWindow();

  // Determine physical frame wrapper style based on explicit simulator mode
  const getDeviceFrameClass = () => {
    if (deviceMode === 'phone') {
      return 'w-[380px] h-[780px] max-h-[92vh] rounded-[48px] border-[10px] border-neutral-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-neutral-750';
    }
    if (deviceMode === 'tablet') {
      return 'w-[860px] h-[640px] max-w-[95vw] max-h-[90vh] rounded-[36px] border-[12px] border-neutral-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-neutral-750';
    }
    if (deviceMode === 'foldable') {
      return isFolded
        ? 'w-[320px] h-[760px] max-h-[90vh] rounded-[40px] border-[10px] border-neutral-800 shadow-2xl'
        : 'w-[880px] h-[700px] max-w-[96vw] max-h-[90vh] rounded-[36px] border-[10px] border-neutral-800 shadow-2xl';
    }
    // Desktop or Auto: fills the container
    return 'w-full h-full';
  };

  const isSimulatedFrame = deviceMode === 'phone' || deviceMode === 'tablet' || deviceMode === 'foldable';

  return (
    <div className={`w-full h-screen bg-[#0d0d11] flex items-center justify-center p-0 overflow-hidden relative ${isSimulatedFrame ? 'pt-12 sm:pt-14 pb-2' : ''}`}>
      {/* Background ambient lighting */}
      <div 
        className="absolute inset-0 opacity-20 blur-3xl pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at center, ${wallpaper.themeColor} 0%, transparent 70%)`
        }}
      />

      {/* Device Body Container */}
      <div 
        className={`relative flex flex-col overflow-hidden bg-cover bg-center transition-all duration-300 ${getDeviceFrameClass()}`}
        style={{ backgroundImage: `url(${wallpaper.url})` }}
      >
        {/* Punch Hole Camera Bezels for Phone/Tablet */}
        {deviceMode === 'phone' && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-black z-40 ring-1 ring-neutral-800 flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0a192f] opacity-80" />
          </div>
        )}

        {/* Foldable Hinge Crease Simulator */}
        {deviceMode === 'foldable' && !isFolded && (
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-black/30 backdrop-blur-[1px] z-20 pointer-events-none border-x border-white/5" />
        )}

        {/* Top Status Bar (Only in Phone/Tablet/Foldable or Top bar) */}
        {actualDevice !== 'desktop' && <StatusBar />}

        {/* System Workspace Area */}
        <main className="relative flex-1 w-full h-full flex flex-col overflow-hidden">
          {/* Base Desktop / Home Screen */}
          <HomeScreen />

          {/* Windows / Active Apps */}
          {windows.map((win) => (
            <WindowFrame key={win.id} window={win} />
          ))}
        </main>

        {/* Bottom Navigation */}
        {actualDevice === 'desktop' ? (
          <Taskbar />
        ) : (
          <NavigationBar />
        )}

        {/* Global Overlays: Quick Settings, App Drawer, Recents, Assistant */}
        <QuickSettingsPanel />
        <AppDrawer />
        <RecentsView />
        <OmniAssistant />
      </div>
    </div>
  );
};
