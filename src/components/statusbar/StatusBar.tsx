import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  Bluetooth, 
  BatteryMedium, 
  BatteryCharging, 
  Bell, 
  Signal, 
  ChevronDown 
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { MULTI_OS_DOMAINS } from '../../services/multiOsHypervisor';

export const StatusBar: React.FC = () => {
  const { 
    currentTime, 
    batteryLevel, 
    isCharging, 
    quickSettings, 
    notifications,
    setIsShadeOpen,
    actualDevice,
  } = useSystem();

  const { windows, activeWindowId } = useWindow();
  const activeWin = windows.find((w) => w.id === activeWindowId && !w.isMinimized);
  const activeDomain = activeWin?.osDomain ? MULTI_OS_DOMAINS.find(d => d.id === activeWin.osDomain) : null;

  return (
    <header 
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(12);
        setIsShadeOpen(true);
      }}
      className="w-full h-9 px-4 flex items-center justify-between text-white text-xs select-none cursor-pointer hover:bg-white/10 active:bg-white/15 transition-colors z-30 shrink-0 font-medium touch-manipulation"
      title="Click or pull to expand Quick Settings & Notifications"
    >
      {/* Left: Live Time & App notification indicator & Active Security Domain */}
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-wide">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {notifications.length > 0 && (
          <div className="flex items-center gap-1 text-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            <Bell size={12} />
          </div>
        )}
        {activeDomain && (
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

      {/* Right: Connectivity, Bluetooth, Battery */}
      <div className="flex items-center gap-2">
        {quickSettings.wifi ? (
          <Wifi size={14} className="text-white" />
        ) : (
          <WifiOff size={14} className="text-neutral-500" />
        )}

        <Signal size={13} className="text-white" />

        {quickSettings.bluetooth && (
          <Bluetooth size={13} className="text-blue-400" />
        )}

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
