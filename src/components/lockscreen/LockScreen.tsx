import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Fingerprint, 
  Flashlight, 
  Camera, 
  Power, 
  ShieldCheck, 
  Battery, 
  Wifi, 
  Radio, 
  Phone, 
  Delete, 
  X, 
  ChevronUp, 
  Bell,
  AlertCircle
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { OverlayHost } from '../../platform/react/Overlay';

export const LockScreen: React.FC = () => {
  const { 
    isLocked, 
    unlockDevice, 
    lockSettings, 
    currentTime, 
    batteryLevel, 
    isCharging, 
    wallpaper, 
    quickSettings, 
    toggleQuickSetting,
    notifications,
    setIsPowerMenuOpen
  } = useSystem();

  const { openApp } = useWindow();

  const [enteredPin, setEnteredPin] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);

  useEffect(() => {
    if (!isLocked) {
      setEnteredPin('');
      setShowKeypad(false);
      setPinError(false);
      setIsUnlocking(false);
      setShowEmergency(false);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (enteredPin.length >= 6) return;
    const next = enteredPin + digit;
    setEnteredPin(next);
    setPinError(false);

    // Auto-check PIN when reaching 4 digits (standard Android PIN)
    if (next.length === 4) {
      const ok = unlockDevice(next);
      if (ok) {
        setIsUnlocking(true);
      } else {
        // Wrong PIN: shake feedback
        setPinError(true);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setTimeout(() => {
          setEnteredPin('');
        }, 600);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setPinError(false);
  };

  const handleBiometricAuth = () => {
    setIsUnlocking(true);
    if (navigator.vibrate) navigator.vibrate(35);
    setTimeout(() => {
      unlockDevice();
    }, 300);
  };

  const handleCameraShortcut = (e: React.MouseEvent) => {
    e.stopPropagation();
    unlockDevice();
    setTimeout(() => {
      openApp('camera');
    }, 150);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartY === null) return;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    const diff = dragStartY - clientY;
    // Swipe up or tap anywhere unlocks ambient screen to show keypad
    if (diff > 25 || Math.abs(diff) < 20) {
      if (!showKeypad) {
        setShowKeypad(true);
      }
    }
    setDragStartY(null);
  };

  // Formatted date and time
  const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <OverlayHost>
      <div 
        className={`fixed inset-0 z-[9990] flex flex-col justify-between overflow-hidden select-none bg-black transition-all duration-300 ${
          isUnlocking ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
        }`}
        onClick={() => {
          if (!showKeypad) setShowKeypad(true);
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
        {/* Background Wallpaper with Ambient Blur */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 transform scale-105 filter brightness-75 contrast-105 pointer-events-none"
          style={{ backgroundImage: `url(${wallpaper.url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/85 backdrop-blur-[2px] pointer-events-none" />

        {/* Lock Screen Top System Bar */}
        <header className="relative z-10 w-full px-6 pt-4 flex items-center justify-between text-white/90 text-xs">
          {/* Operator / Network Info */}
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wider text-[11px] uppercase">LibreDroid 5G SA</span>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Radio size={12} className="text-emerald-400" />
              <Wifi size={12} />
            </div>
          </div>

          {/* Center Lock Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-neutral-200">
            {isUnlocking ? (
              <Unlock size={13} className="text-emerald-400 animate-bounce" />
            ) : (
              <Lock size={13} className="text-neutral-300" />
            )}
            <span className="text-[10px] font-medium tracking-wide">
              {isUnlocking ? 'Unlocked' : 'Encrypted'}
            </span>
          </div>

          {/* Battery & Power Menu Shortcut */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px]">
              <Battery size={13} className={isCharging ? 'text-emerald-400' : 'text-neutral-300'} />
              <span>{batteryLevel}%</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPowerMenuOpen(true);
              }}
              className="p-1 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Power Menu"
            >
              <Power size={14} />
            </button>
          </div>
        </header>

        {/* Main Center Content: Hero Clock & Notifications OR Numeric PIN Pad */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 w-full max-w-md mx-auto">
          {!showKeypad ? (
            /* Ambient Clock & Notification View */
            <div 
              className="w-full flex flex-col items-center text-center cursor-pointer py-6"
              onClick={() => setShowKeypad(true)}
            >
              {/* Big Digital Clock */}
              <h1 className="text-7xl sm:text-8xl font-light tracking-tighter text-white drop-shadow-[0_8px_25px_rgba(0,0,0,0.8)] font-sans">
                {timeStr}
              </h1>
              
              {/* Date String */}
              <p className="text-base sm:text-lg font-medium text-neutral-200 mt-2 tracking-wide drop-shadow">
                {dateStr}
              </p>

              {/* Charging / Security Badge */}
              <div className="mt-3 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs text-neutral-300">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>{isCharging ? `⚡ Fast Charging (${batteryLevel}%)` : 'Hardware Enclave Guarded'}</span>
              </div>

              {/* Unread Notifications Stack on Lock Screen */}
              {lockSettings.showNotificationsOnLockScreen && notifications.length > 0 && (
                <div className="w-full max-w-xs mt-6 space-y-2">
                  {notifications.slice(0, 2).map((notif) => (
                    <div 
                      key={notif.id}
                      className="p-3 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 text-left text-white shadow-lg flex items-start gap-2.5"
                    >
                      <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                        <Bell size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 text-[10px] text-neutral-400">
                          <span className="font-semibold text-emerald-400 uppercase tracking-wider">{notif.appName}</span>
                          <span>{notif.time}</span>
                        </div>
                        <h4 className="text-xs font-bold truncate mt-0.5">{notif.title}</h4>
                        <p className="text-[11px] text-neutral-300 truncate">{notif.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tap / Swipe Up Affordance */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowKeypad(true);
                }}
                className="mt-8 flex flex-col items-center gap-1.5 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-neutral-200 transition-all cursor-pointer backdrop-blur-md shadow-lg"
              >
                <ChevronUp size={20} className="animate-bounce" />
                <span className="text-xs font-semibold tracking-wider uppercase">Tap or Swipe up to unlock</span>
              </button>
            </div>
          ) : (
            /* Sovereign PIN Keypad Entry */
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs flex flex-col items-center animate-fade-in"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto mb-3 backdrop-blur-md">
                  <Lock size={20} />
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide">Enter PIN</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Default PIN is <span className="font-mono text-emerald-400 font-bold">0000</span>
                </p>
              </div>

              {/* PIN Dots Indicator */}
              <div className={`flex items-center gap-4 mb-8 ${pinError ? 'animate-shake' : ''}`}>
                {[0, 1, 2, 3].map((idx) => {
                  const filled = idx < enteredPin.length;
                  return (
                    <div 
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                        pinError 
                          ? 'bg-rose-500 border border-rose-400 scale-110' 
                          : filled 
                            ? 'bg-emerald-400 border border-emerald-300 scale-110 shadow-[0_0_10px_rgba(52,211,153,0.6)]' 
                            : 'bg-transparent border border-white/40'
                      }`}
                    />
                  );
                })}
              </div>

              {/* 0-9 Keypad Matrix */}
              <div className="grid grid-cols-3 gap-3.5 w-full mb-6">
                {[
                  { num: '1', letters: '' },
                  { num: '2', letters: 'ABC' },
                  { num: '3', letters: 'DEF' },
                  { num: '4', letters: 'GHI' },
                  { num: '5', letters: 'JKL' },
                  { num: '6', letters: 'MNO' },
                  { num: '7', letters: 'PQRS' },
                  { num: '8', letters: 'TUV' },
                  { num: '9', letters: 'WXYZ' },
                ].map(({ num, letters }) => (
                  <button
                    key={num}
                    onClick={() => handleDigit(num)}
                    className="h-16 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/15 backdrop-blur-md flex flex-col items-center justify-center text-white transition-all active:scale-95 cursor-pointer shadow-lg"
                  >
                    <span className="text-xl font-medium leading-none">{num}</span>
                    {letters && <span className="text-[9px] font-medium tracking-widest text-neutral-400 mt-0.5">{letters}</span>}
                  </button>
                ))}

                {/* Biometric Button */}
                <button
                  onClick={handleBiometricAuth}
                  className="h-16 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/15 backdrop-blur-md flex items-center justify-center text-emerald-400 transition-all active:scale-95 cursor-pointer"
                  title="Biometric Fingerprint Unlock"
                >
                  <Fingerprint size={24} />
                </button>

                {/* Digit 0 */}
                <button
                  onClick={() => handleDigit('0')}
                  className="h-16 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/15 backdrop-blur-md flex flex-col items-center justify-center text-white transition-all active:scale-95 cursor-pointer shadow-lg"
                >
                  <span className="text-xl font-medium leading-none">0</span>
                  <span className="text-[9px] font-medium tracking-widest text-neutral-400 mt-0.5">+</span>
                </button>

                {/* Backspace */}
                <button
                  onClick={handleBackspace}
                  className="h-16 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/15 backdrop-blur-md flex items-center justify-center text-neutral-300 transition-all active:scale-95 cursor-pointer"
                  title="Backspace"
                >
                  <Delete size={20} />
                </button>
              </div>

              {/* Bottom Keypad Navigation: Cancel & Emergency */}
              <div className="w-full flex items-center justify-between text-xs text-neutral-300 px-2">
                <button
                  onClick={() => {
                    setShowEmergency(true);
                  }}
                  className="hover:text-white py-1.5 px-3 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Emergency
                </button>

                <button
                  onClick={() => {
                    setShowKeypad(false);
                    setEnteredPin('');
                  }}
                  className="hover:text-white py-1.5 px-3 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Quick Action Dock: Flashlight & Camera */}
        <footer className="relative z-10 w-full px-8 pb-6 flex items-center justify-between text-white">
          {/* Flashlight Shortcut */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleQuickSetting('flashlight');
            }}
            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
              quickSettings.flashlight 
                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)]' 
                : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
            }`}
            title="Toggle Flashlight"
          >
            <Flashlight size={20} />
          </button>

          {/* Camera Shortcut */}
          <button
            onClick={handleCameraShortcut}
            className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md hover:scale-105 active:scale-95"
            title="Open Camera"
          >
            <Camera size={20} />
          </button>
        </footer>

        {/* Emergency Call Modal */}
        {showEmergency && (
          <div 
            className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-6 animate-fade-in"
            onClick={() => setShowEmergency(false)}
          >
            <div className="w-full flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-rose-400 tracking-wider uppercase">Emergency SOS</span>
              <button 
                onClick={() => setShowEmergency(false)}
                className="p-1 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-w-xs mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4">
                <Phone size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Emergency Calls Only</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                Connected to local emergency satellite and cellular tower relays without carrier SIM lock.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {['911', '112', '999', '000'].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      alert(`Initiating Sovereign Emergency Call to ${num}...`);
                    }}
                    className="p-3.5 rounded-2xl bg-neutral-900 border border-rose-500/30 text-rose-300 hover:bg-rose-950/40 font-mono text-base font-bold transition-all active:scale-95"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center text-[11px] text-neutral-500 pb-2">
              Tap anywhere outside to return
            </div>
          </div>
        )}
      </div>
    </OverlayHost>
  );
};
