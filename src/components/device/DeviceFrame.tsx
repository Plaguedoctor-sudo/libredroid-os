import React, { useState, useEffect } from 'react';
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
import { LockScreen } from '../lockscreen/LockScreen';
import { PowerMenuDialog } from '../system/PowerMenuDialog';
import { SmartSidebar } from '../navigation/SmartSidebar';
import { SmartShelfOverlay } from '../launcher/SmartShelfOverlay';
import { AppLockModal } from '../common/AppLockModal';
import { EdgePanel } from '../navigation/EdgePanel';
import { systemBus } from '../../services/systemBus';

export const DeviceFrame: React.FC = () => {
  const { deviceMode, actualDevice, isFolded, wallpaper, isKiosk } = useSystem();
  const { windows } = useWindow();

  const [isShelfOpen, setIsShelfOpen] = useState(false);
  const [appLockState, setAppLockState] = useState<{
    isOpen: boolean;
    targetAppName: string;
    targetAppId?: string;
    onSuccessCallback?: () => void;
  }>({
    isOpen: false,
    targetAppName: '',
  });

  useEffect(() => {
    const unsubToggle = systemBus.on('shelf:toggle', () => {
      setIsShelfOpen((prev) => !prev);
    });
    const unsubOpen = systemBus.on('shelf:open', () => {
      setIsShelfOpen(true);
    });
    const unsubClose = systemBus.on('shelf:close', () => {
      setIsShelfOpen(false);
    });
    const unsubLock = systemBus.on('security:request_app_lock', (event) => {
      setAppLockState({
        isOpen: true,
        targetAppName: event.payload?.name || 'Protected App',
        targetAppId: event.payload?.appId,
        onSuccessCallback: event.payload?.onSuccess,
      });
    });

    return () => {
      unsubToggle();
      unsubOpen();
      unsubClose();
      unsubLock();
    };
  }, []);

  // Detect if running on a physical Android/touch device or in full launcher mode
  const isPhysicalAndroid = typeof navigator !== 'undefined' && 
    (navigator.maxTouchPoints > 0 || /Android|Tablet|Mobile/i.test(navigator.userAgent));

  // Determine physical frame wrapper style based on explicit simulator mode
  const getDeviceFrameClass = () => {
    // If running in Kiosk mode, on a real Android device, or in full screen / auto mode: cover the entire screen edge-to-edge!
    if (isKiosk || isPhysicalAndroid || deviceMode === 'auto' || deviceMode === 'desktop') {
      return 'w-full h-full rounded-none border-none shadow-none';
    }
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
    return 'w-full h-full rounded-none border-none shadow-none';
  };

  const isSimulatedFrame = !isKiosk && !isPhysicalAndroid && (deviceMode === 'phone' || deviceMode === 'tablet' || deviceMode === 'foldable');

  return (
    <div className={`w-full h-full h-[100dvh] bg-[#0d0d11] flex items-center justify-center p-0 overflow-hidden relative ${isSimulatedFrame ? 'pt-12 sm:pt-14 pb-2' : ''}`}>
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
        {/* Infinity-V Waterdrop Camera Notch for Samsung Galaxy M14 / Phone */}
        {isSimulatedFrame && deviceMode === 'phone' && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-5 bg-black rounded-b-2xl z-40 flex items-center justify-center pointer-events-none shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0a192f] mt-0.5 opacity-90 ring-1 ring-neutral-800" />
          </div>
        )}

        {/* Foldable Hinge Crease Simulator */}
        {isSimulatedFrame && deviceMode === 'foldable' && !isFolded && (
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

        {/* Global Overlays: Quick Settings, App Drawer, Recents, Assistant, Lock Screen & Power Menu */}
        <QuickSettingsPanel />
        <AppDrawer />
        <RecentsView />
        <OmniAssistant />
        <LockScreen />
        <PowerMenuDialog />

        {/* ColorOS / OxygenOS 14 Specific Subsystems */}
        <SmartSidebar />
        <SmartShelfOverlay isOpen={isShelfOpen} onClose={() => setIsShelfOpen(false)} />
        <AppLockModal
          isOpen={appLockState.isOpen}
          targetAppName={appLockState.targetAppName}
          targetAppId={appLockState.targetAppId}
          onSuccess={() => {
            setAppLockState((prev) => ({ ...prev, isOpen: false }));
            if (appLockState.onSuccessCallback) {
              appLockState.onSuccessCallback();
            }
          }}
          onCancel={() => {
            setAppLockState((prev) => ({ ...prev, isOpen: false }));
          }}
        />

        {/* Samsung One UI Edge Panel Subsystem */}
        <EdgePanel />

        {/* Bottom Navigation: High-priority system layer (z-50) so Home & Back are always accessible */}
        {actualDevice === 'desktop' ? (
          <Taskbar />
        ) : (
          <NavigationBar />
        )}
      </div>
    </div>
  );
};
