import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  Bluetooth, 
  BluetoothOff, 
  Flashlight, 
  FlashlightOff, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  RotateCw, 
  BatteryMedium, 
  ShieldAlert, 
  Settings, 
  Power, 
  X, 
  Smartphone, 
  Tablet, 
  Laptop, 
  RefreshCw,
  Bell,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';

export const QuickSettingsPanel: React.FC = () => {
  const { 
    isShadeOpen, 
    setIsShadeOpen, 
    quickSettings, 
    toggleQuickSetting, 
    setQuickSettingValue,
    batteryLevel,
    currentTime,
    notifications,
    dismissNotification,
    clearAllNotifications,
    account,
    syncAccount,
    deviceMode,
    setDeviceMode,
    actualDevice
  } = useSystem();

  const { openApp } = useWindow();

  if (!isShadeOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col justify-start items-center p-2 sm:p-4 animate-fade-in"
      onClick={() => setIsShadeOpen(false)}
    >
      <div 
        className="w-full max-w-xl bg-neutral-900/95 text-white border border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 overflow-y-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-sm text-neutral-400">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setIsShadeOpen(false);
                openApp('settings');
              }}
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-300 hover:text-white"
              title="System Settings"
            >
              <Settings size={18} />
            </button>
            <button 
              onClick={() => setIsShadeOpen(false)}
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-300 hover:text-white"
              title="Close Panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* User Account Bar & Cloud Sync */}
        <div className="flex items-center justify-between bg-neutral-800/60 p-3 rounded-2xl border border-neutral-700/50">
          <div className="flex items-center gap-3">
            <img 
              src={account.avatarUrl} 
              alt={account.name} 
              className="w-10 h-10 rounded-full object-cover border border-purple-400"
            />
            <div>
              <div className="text-sm font-semibold flex items-center gap-1.5">
                {account.name}
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-medium">
                  Universal ID
                </span>
              </div>
              <div className="text-xs text-neutral-400">{account.email}</div>
            </div>
          </div>
          <button 
            onClick={syncAccount}
            className="flex items-center gap-1.5 text-xs bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 px-3 py-1.5 rounded-xl transition-colors"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
            <span>Sync</span>
          </button>
        </div>

        {/* Device Adaptive Switcher */}
        <div className="bg-neutral-800/40 p-3 rounded-2xl border border-neutral-700/40">
          <div className="text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider flex items-center justify-between">
            <span>Adaptive Form Factor</span>
            <span className="text-[11px] text-purple-400 capitalize">Active: {actualDevice}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'auto', label: 'Auto', icon: RefreshCw },
              { id: 'phone', label: 'Phone', icon: Smartphone },
              { id: 'tablet', label: 'Tablet', icon: Tablet },
              { id: 'desktop', label: 'Dex/Desktop', icon: Laptop },
            ].map((d) => {
              const Icon = d.icon;
              const isSelected = deviceMode === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setDeviceMode(d.id as any)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium transition-all ${
                    isSelected 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-300'
                  }`}
                >
                  <Icon size={16} className="mb-1" />
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Settings Grid (Material You Pill Tiles) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Wi-Fi */}
          <button
            onClick={() => toggleQuickSetting('wifi')}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
              quickSettings.wifi 
                ? 'bg-blue-600 text-white font-medium' 
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <div className={`p-2 rounded-xl ${quickSettings.wifi ? 'bg-blue-700' : 'bg-neutral-700'}`}>
              {quickSettings.wifi ? <Wifi size={18} /> : <WifiOff size={18} />}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Internet</div>
              <div className="text-xs opacity-80">{quickSettings.wifi ? 'Omni-WiFi 6' : 'Off'}</div>
            </div>
          </button>

          {/* Bluetooth */}
          <button
            onClick={() => toggleQuickSetting('bluetooth')}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
              quickSettings.bluetooth 
                ? 'bg-blue-600 text-white font-medium' 
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <div className={`p-2 rounded-xl ${quickSettings.bluetooth ? 'bg-blue-700' : 'bg-neutral-700'}`}>
              {quickSettings.bluetooth ? <Bluetooth size={18} /> : <BluetoothOff size={18} />}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Bluetooth</div>
              <div className="text-xs opacity-80">{quickSettings.bluetooth ? 'Pixel Buds Pro' : 'Off'}</div>
            </div>
          </button>

          {/* Flashlight */}
          <button
            onClick={() => toggleQuickSetting('flashlight')}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
              quickSettings.flashlight 
                ? 'bg-amber-500 text-black font-semibold' 
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <div className={`p-2 rounded-xl ${quickSettings.flashlight ? 'bg-amber-600/30' : 'bg-neutral-700'}`}>
              {quickSettings.flashlight ? <Flashlight size={18} /> : <FlashlightOff size={18} />}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Flashlight</div>
              <div className="text-xs opacity-80">{quickSettings.flashlight ? 'On' : 'Off'}</div>
            </div>
          </button>

          {/* Do Not Disturb */}
          <button
            onClick={() => toggleQuickSetting('dnd')}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
              quickSettings.dnd 
                ? 'bg-purple-600 text-white font-medium' 
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <div className={`p-2 rounded-xl ${quickSettings.dnd ? 'bg-purple-700' : 'bg-neutral-700'}`}>
              <ShieldAlert size={18} />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Do Not Disturb</div>
              <div className="text-xs opacity-80">{quickSettings.dnd ? 'Total Silence' : 'Off'}</div>
            </div>
          </button>

          {/* Auto Rotate */}
          <button
            onClick={() => toggleQuickSetting('autoRotate')}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
              quickSettings.autoRotate 
                ? 'bg-blue-600 text-white font-medium' 
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <div className={`p-2 rounded-xl ${quickSettings.autoRotate ? 'bg-blue-700' : 'bg-neutral-700'}`}>
              <RotateCw size={18} />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Auto-rotate</div>
              <div className="text-xs opacity-80">{quickSettings.autoRotate ? 'On' : 'Locked'}</div>
            </div>
          </button>

          {/* Battery Saver */}
          <button
            onClick={() => toggleQuickSetting('batterySaver')}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
              quickSettings.batterySaver 
                ? 'bg-emerald-600 text-white font-medium' 
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <div className={`p-2 rounded-xl ${quickSettings.batterySaver ? 'bg-emerald-700' : 'bg-neutral-700'}`}>
              <BatteryMedium size={18} />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Battery ({batteryLevel}%)</div>
              <div className="text-xs opacity-80">{quickSettings.batterySaver ? 'Saver On' : 'Optimal'}</div>
            </div>
          </button>
        </div>

        {/* Sliders: Brightness & Volume */}
        <div className="space-y-3 bg-neutral-800/40 p-3 rounded-2xl border border-neutral-700/40">
          <div className="flex items-center gap-3">
            <Sun size={18} className="text-neutral-400 shrink-0" />
            <input 
              type="range"
              min="10"
              max="100"
              value={quickSettings.brightness}
              onChange={(e) => setQuickSettingValue('brightness', Number(e.target.value))}
              className="w-full accent-purple-400 h-2 bg-neutral-700 rounded-lg cursor-pointer"
            />
            <span className="text-xs text-neutral-400 w-8 text-right">{quickSettings.brightness}%</span>
          </div>

          <div className="flex items-center gap-3">
            {quickSettings.volume === 0 ? (
              <VolumeX size={18} className="text-neutral-400 shrink-0" />
            ) : (
              <Volume2 size={18} className="text-neutral-400 shrink-0" />
            )}
            <input 
              type="range"
              min="0"
              max="100"
              value={quickSettings.volume}
              onChange={(e) => setQuickSettingValue('volume', Number(e.target.value))}
              className="w-full accent-blue-400 h-2 bg-neutral-700 rounded-lg cursor-pointer"
            />
            <span className="text-xs text-neutral-400 w-8 text-right">{quickSettings.volume}%</span>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Bell size={14} />
              <span>Notifications ({notifications.length})</span>
            </div>
            {notifications.length > 0 && (
              <button 
                onClick={clearAllNotifications}
                className="hover:text-red-400 transition-colors flex items-center gap-1 text-[11px]"
              >
                <Trash2 size={12} />
                <span>Clear All</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-xs text-neutral-500 italic">
                No new notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="bg-neutral-800/80 border border-neutral-700/60 p-3 rounded-2xl flex items-start justify-between gap-3 relative group"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                      <span className="font-medium text-purple-300">{notif.appName}</span>
                      <span>{notif.time}</span>
                    </div>
                    <div className="text-sm font-medium text-white mb-0.5">{notif.title}</div>
                    <div className="text-xs text-neutral-300 leading-relaxed">{notif.body}</div>
                  </div>
                  <button 
                    onClick={() => dismissNotification(notif.id)}
                    className="p-1 text-neutral-500 hover:text-neutral-300 rounded-md transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
