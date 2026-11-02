import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Bluetooth, 
  BatteryMedium, 
  BatteryCharging, 
  Bell, 
  Signal, 
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  Maximize,
  Minimize
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { MULTI_OS_DOMAINS } from '../../services/multiOsHypervisor';
import { hardwareHalBridge, CarrierProfile } from '../../services/hardwareHalBridge';
import { playIntegrityEngine } from '../../services/playIntegrityEngine';

export const StatusBar: React.FC = () => {
  const { 
    currentTime, 
    batteryLevel, 
    isCharging, 
    quickSettings, 
    notifications,
    setIsShadeOpen,
    actualDevice,
    interfaceMode,
  } = useSystem();

  const { windows, activeWindowId, openApp } = useWindow();
  const activeWin = windows.find((w) => w.id === activeWindowId && !w.isMinimized);
  const activeDomain = activeWin?.osDomain ? MULTI_OS_DOMAINS.find(d => d.id === activeWin.osDomain) : null;

  const [carrier, setCarrier] = useState<CarrierProfile>(() => hardwareHalBridge.getActiveCarrier());
  const [halState, setHalState] = useState(() => hardwareHalBridge.getState());
  const [integrityStatus, setIntegrityStatus] = useState(() => playIntegrityEngine.getStatus());

  useEffect(() => {
    const handleUpdate = () => {
      setCarrier(hardwareHalBridge.getActiveCarrier());
      setHalState(hardwareHalBridge.getState());
      setIntegrityStatus(playIntegrityEngine.getStatus());
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const isStandardAndroid = interfaceMode === 'standard_android';

  return (
    <header 
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(12);
        setIsShadeOpen(true);
      }}
      className="w-full h-9 px-3 sm:px-4 flex items-center justify-between text-white text-xs select-none cursor-pointer hover:bg-white/10 active:bg-white/15 transition-colors z-30 shrink-0 font-medium touch-manipulation"
      title="Click or pull to expand Quick Settings & Notifications"
    >
      {/* Left: Live Time & App notification indicator & Active Mode Indicators */}
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-wide">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>

        {isStandardAndroid && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-neutral-300 font-medium">
            <span>{carrier.name.split(' ')[0]}</span>
            <span className="text-[10px] font-bold px-1 rounded bg-white/10 text-white font-mono">5G</span>
            {halState.volteEnabled && (
              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                <PhoneCall size={9} /> VoLTE
              </span>
            )}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="flex items-center gap-1 text-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            <Bell size={12} />
          </div>
        )}

        {!isStandardAndroid && activeDomain && (
          <div 
            className="flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold"
            style={{
              backgroundColor: `${activeDomain.colorHex}25`,
              color: activeDomain.colorHex,
              border: `1px solid ${activeDomain.colorHex}50`
            }}
            title={`Active security domain: ${activeDomain.name}`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeDomain.colorHex }} />
            <span>{activeDomain.badgeLabel.split(' ')[0]}</span>
          </div>
        )}
      </div>

      {/* Center: Subtle Grab Handle indicator on mobile / tablet */}
      {actualDevice !== 'desktop' && (
        <div className="w-10 h-1 bg-white/20 rounded-full"></div>
      )}

      {/* Right: Connectivity, VoLTE, Play Integrity, Bluetooth, Battery */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {integrityStatus.meetsDeviceIntegrity && (
          <div 
            className="flex items-center text-emerald-400 hover:text-emerald-300"
            title="Google Play Integrity Verified (Device + Basic + Strong passing)"
          >
            <ShieldCheck size={13} />
          </div>
        )}

        {quickSettings.wifi ? (
          <Wifi size={14} className="text-white" />
        ) : (
          <WifiOff size={14} className="text-neutral-500" />
        )}

        <div className="flex items-center gap-1">
          <Signal size={13} className="text-white" />
          {quickSettings.network5g !== false && (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                openApp('network_5g');
              }}
              className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono tracking-tight cursor-pointer hover:bg-cyan-500/30 transition-all"
              title="5G Adaptor Active — Click to manage 5G bands & network slices"
            >
              5G
            </span>
          )}
        </div>

        {quickSettings.bluetooth && (
          <Bluetooth size={13} className="text-blue-400" />
        )}

        {/* Fullscreen Kiosk Affordance */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (typeof document !== 'undefined') {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => {});
              } else {
                document.exitFullscreen?.().catch(() => {});
              }
            }
          }}
          className="p-1 rounded hover:bg-white/10 active:scale-95 text-neutral-300 hover:text-white transition-all flex items-center"
          title="Toggle Fullscreen Kiosk Mode"
        >
          {typeof document !== 'undefined' && document.fullscreenElement ? (
            <Minimize size={13} />
          ) : (
            <Maximize size={13} />
          )}
        </button>

        <div className="flex items-center gap-1">
          <span className="text-[11px] font-mono">{batteryLevel}%</span>
          {isCharging ? (
            <BatteryCharging size={16} className="text-emerald-400" />
          ) : (
            <BatteryMedium size={16} className={batteryLevel <= 20 ? 'text-red-400' : 'text-white'} />
          )}
        </div>
      </div>
    </header>
  );
};
