import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { SystemProvider, useSystem } from './context/SystemContext';
import { SecurityProvider } from './context/SecurityContext';
import { PersonaProvider } from './context/PersonaContext';
import { WindowProvider } from './context/WindowContext';
import { KeyboardProvider } from './context/KeyboardContext';
import { DeviceSwitcherBar } from './components/device/DeviceSwitcherBar';
import { DeviceFrame } from './components/device/DeviceFrame';
import { SecurityDialogOverlay } from './components/security/SecurityDialogOverlay';
import { UniversalAdaptationWizard } from './components/persona/UniversalAdaptationWizard';
import { VirtualKeyboard } from './components/common/VirtualKeyboard';
import { systemBus } from './services/systemBus';
import { onNative, watchNative, focusShell } from './platform/native';
import { Magnifier } from './platform/react/Magnifier';
import { OSKBridge } from './platform/react/OSKBridge';
import { OverlayHost } from './platform/react/Overlay';

function ScreenWakeLockManager() {
  useEffect(() => {
    let sentinel: any = null;
    const requestLock = async () => {
      try {
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && (navigator as any).wakeLock) {
          sentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    };

    requestLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestLock();
      }
    };

    const handleGesture = () => {
      requestLock();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pointerdown', handleGesture, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pointerdown', handleGesture);
      sentinel?.release?.().catch(() => {});
    };
  }, []);

  return null;
}

function KioskBackHandler() {
  useEffect(() => {
    // Lock viewport scroll / touch bouncing
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    // Push initial history state so popstate triggers when user hits Android back button or gesture
    try {
      window.history.pushState({ lrd: 1 }, '', window.location.href);
    } catch {}

    const handlePopState = () => {
      // Re-push state so user remains inside the LibreDroid PWA / kiosk
      try {
        window.history.pushState({ lrd: 1 }, '', window.location.href);
      } catch {}
      systemBus.emit('system:back', {});
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        systemBus.emit('system:back', {});
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}

function AutoFullscreenAffordance() {
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (typeof document !== 'undefined') return !!document.fullscreenElement;
    return false;
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      if (typeof document !== 'undefined') {
        setIsFullscreen(!!document.fullscreenElement);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);

    // Auto-enter fullscreen on user gesture
    const handleFirstTouch = () => {
      if (typeof document !== 'undefined' && !document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    };
    window.addEventListener('pointerup', handleFirstTouch, { once: true });

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('pointerup', handleFirstTouch);
    };
  }, []);

  if (isFullscreen || dismissed) return null;

  return (
    <OverlayHost>
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto animate-bounce">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (typeof document !== 'undefined') {
              document.documentElement.requestFullscreen?.().catch(() => {});
            }
            setDismissed(true);
          }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xl backdrop-blur border border-emerald-400/50 active:scale-95 transition-all cursor-pointer"
        >
          <span>⛶ Tap for Fullscreen Kiosk Mode</span>
        </button>
      </div>
    </OverlayHost>
  );
}

function HeadsUpNotificationBanner() {
  const { notifications, dismissNotification } = useSystem();
  const [activeToast, setActiveToast] = useState<any>(null);

  useEffect(() => {
    if (notifications.length > 0 && !notifications[0].read) {
      setActiveToast(notifications[0]);
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  if (!activeToast) return null;

  return (
    <OverlayHost>
      <div className="fixed top-11 left-1/2 -translate-x-1/2 z-[9998] w-[92%] max-w-lg pointer-events-auto transition-all">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-900/95 border border-emerald-500/50 text-white shadow-2xl backdrop-blur-md">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
                {activeToast.appName}
              </span>
              <span className="text-[10px] text-neutral-400">{activeToast.time}</span>
            </div>
            <h4 className="text-xs font-bold text-white mt-0.5 truncate">{activeToast.title}</h4>
            <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed line-clamp-2">{activeToast.body}</p>
          </div>
          <button
            onClick={() => {
              dismissNotification(activeToast.id);
              setActiveToast(null);
            }}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>
    </OverlayHost>
  );
}

export function App() {
  const [focusedNative, setFocusedNative] = useState<string | null>(null);

  useEffect(() => {
    return onNative(({ focused }) => setFocusedNative(focused));
  }, []);
  useEffect(() => {
    return watchNative();
  }, []);

  return (
    <SystemProvider>
      <SecurityProvider>
        <PersonaProvider>
          <WindowProvider>
            <KeyboardProvider>
              <ScreenWakeLockManager />
              <KioskBackHandler />
              <AutoFullscreenAffordance />
              <HeadsUpNotificationBanner />
              <OSKBridge nativeFocused={!!focusedNative} />
              <Magnifier />
              <div className="lrd-content h-[100dvh]">
                <div
                  id="lrd-app-layer"
                  className={`relative w-screen h-[100dvh] h-screen overflow-hidden bg-black select-none transition-opacity duration-200 ${
                    focusedNative ? 'opacity-0 pointer-events-none' : ''
                  }`}
                >
                  {/* Universal Device Mode Switcher Floating Bar */}
                  <DeviceSwitcherBar />

                  {/* Core Device Shell */}
                  <DeviceFrame />

                  {/* Global Security Permission & Cross-Domain Modals */}
                  <SecurityDialogOverlay />

                  {/* Universal Persona Adaptation Wizard */}
                  <UniversalAdaptationWizard />

                  {/* Sovereign LibreDroid Virtual Keyboard */}
                  <VirtualKeyboard />
                </div>
              </div>

              {/* Floating Return Affordance when Native Window is Focused */}
              {focusedNative && (
                <button
                  onClick={focusShell}
                  className="fixed bottom-3 left-1/2 z-[9999] -translate-x-1/2 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white border border-neutral-700/80 px-5 py-2.5 text-xs font-semibold shadow-2xl backdrop-blur flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <span>←</span> Return to LibreDroid
                </button>
              )}
            </KeyboardProvider>
          </WindowProvider>
        </PersonaProvider>
      </SecurityProvider>
    </SystemProvider>
  );
}

export default App;
