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
  RotateCw, 
  BatteryMedium, 
  ShieldCheck, 
  Settings, 
  X, 
  Smartphone, 
  Tablet, 
  Laptop, 
  RefreshCw, 
  Bell, 
  Trash2, 
  HardDrive, 
  Box, 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  Layers 
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { useSecurity } from '../../context/SecurityContext';

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

  const { openApp, purgeDisposableWindows } = useWindow();
  const { cameraKillswitch, setCameraKillswitch, micKillswitch, setMicKillswitch } = useSecurity();

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
                openApp('security');
              }}
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-emerald-400 hover:text-white"
              title="Security Guardrails"
            >
              <ShieldCheck size={18} />
            </button>
            <button 
              onClick={() => {
                setIsShadeOpen(false);
                openApp('hypervisor');
              }}
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-purple-400 hover:text-white"
              title="Multi-OS Matrix"
            >
              <Layers size={18} />
            </button>
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

        {/* Master Hardware Killswitches Bar */}
        <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
          <button
            onClick={() => setCameraKillswitch((prev) => !prev)}
            className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition-all ${
              cameraKillswitch
                ? 'bg-rose-600 text-white shadow-lg'
                : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {cameraKillswitch ? <CameraOff size={16} /> : <Camera size={16} />}
            <span>Camera: {cameraKillswitch ? 'CUT OFF' : 'Active'}</span>
          </button>

          <button
            onClick={() => setMicKillswitch((prev) => !prev)}
            className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition-all ${
              micKillswitch
                ? 'bg-rose-600 text-white shadow-lg'
                : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {micKillswitch ? <MicOff size={16} /> : <Mic size={16} />}
            <span>Mic: {micKillswitch ? 'CUT OFF' : 'Active'}</span>
          </button>
        </div>

        {/* Quick Settings Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Internet */}
          <button
            onClick={() => toggleQuickSetting('wifi')}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
              quickSettings.wifi 
                ? 'bg-emerald-600 text-white font-medium' 
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <div className={`p-2 rounded-xl ${quickSettings.wifi ? 'bg-emerald-700' : 'bg-neutral-700'}`}>
              {quickSettings.wifi ? <Wifi size={18} /> : <WifiOff size={18} />}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Internet</div>
              <div className="text-xs opacity-80">{quickSettings.wifi ? 'Mesh Tor/DoH' : 'Off'}</div>
            </div>
          </button>

          {/* Privacy Shield */}
          <button
            onClick={() => toggleQuickSetting('dnd')}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
              quickSettings.dnd 
                ? 'bg-purple-600 text-white font-medium' 
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            <div className={`p-2 rounded-xl ${quickSettings.dnd ? 'bg-purple-700' : 'bg-neutral-700'}`}>
              <ShieldCheck size={18} />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Privacy Shield</div>
              <div className="text-xs opacity-80">{quickSettings.dnd ? 'Zero Telemetry' : 'Normal'}</div>
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

          {/* Purge Disposable MicroVMs */}
          <button
            onClick={() => {
              purgeDisposableWindows();
              setIsShadeOpen(false);
            }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-800 hover:bg-red-950/60 text-neutral-300 hover:text-red-300 transition-all border border-neutral-750"
          >
            <div className="p-2 rounded-xl bg-neutral-700 text-neutral-300">
              <Trash2 size={18} />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Purge Ephemeral</div>
              <div className="text-xs opacity-80">Wipe Disposable VMs</div>
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
              className="w-full accent-emerald-400 h-2 bg-neutral-700 rounded-lg cursor-pointer"
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
                      <span className="font-medium text-emerald-300">{notif.appName}</span>
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
