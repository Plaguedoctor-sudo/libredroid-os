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

  return (
    <header 
      onClick={() => setIsShadeOpen(true)}
      className="w-full h-8 px-4 flex items-center justify-between text-white text-xs select-none cursor-pointer hover:bg-white/5 transition-colors z-30 shrink-0 font-medium"
      title="Click or pull to expand Quick Settings & Notifications"
    >
      {/* Left: Live Time & App notification indicator */}
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
