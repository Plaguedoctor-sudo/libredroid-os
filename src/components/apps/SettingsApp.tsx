import React, { useState } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Laptop, 
  FoldHorizontal, 
  Palette, 
  Sun, 
  Battery, 
  User, 
  Info, 
  RefreshCw, 
  Check, 
  Layers, 
  Monitor,
  Cpu
} from 'lucide-react';
import { useSystem, WALLPAPERS } from '../../context/SystemContext';
import { DeviceMode } from '../../types/system';

export const SettingsApp: React.FC = () => {
  const { 
    deviceMode, 
    setDeviceMode, 
    actualDevice, 
    isFolded, 
    setIsFolded, 
    wallpaper, 
    setWallpaper, 
    batteryLevel, 
    account, 
    syncAccount 
  } = useSystem();

  const [activeTab, setActiveTab] = useState<'device' | 'wallpaper' | 'account' | 'about'>('device');

  return (
    <div className="flex-1 w-full h-full flex flex-col sm:flex-row bg-neutral-900 text-white select-none overflow-hidden">
      {/* Sidebar Tabs */}
      <div className="w-full sm:w-56 bg-neutral-950 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-neutral-800 flex sm:flex-col gap-1.5 shrink-0 overflow-x-auto">
        <div className="hidden sm:block text-xs font-bold uppercase tracking-wider text-neutral-400 px-3 py-2">
          Settings
        </div>

        {[
          { id: 'device', label: 'Device & Form Factor', icon: Layers },
          { id: 'wallpaper', label: 'Wallpaper & Style', icon: Palette },
          { id: 'account', label: 'Universal Account', icon: User },
          { id: 'about', label: 'About OmniOS', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {activeTab === 'device' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold">Universal Device Adaptation</h2>
              <p className="text-xs text-neutral-400 mt-1">
                OmniOS smoothly reconfigures its UI, window manager, navigation gestures, and app scaling to match your target form factor.
              </p>
            </div>

            {/* Device Mode Switcher Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: 'auto',
                  title: 'Auto Adaptive',
                  desc: 'Detects screen width & switches dynamically',
                  icon: RefreshCw,
                },
                {
                  id: 'phone',
                  title: 'Smartphone',
                  desc: 'Portrait gesture bar & full-screen apps',
                  icon: Smartphone,
                },
                {
                  id: 'tablet',
                  title: 'Tablet',
                  desc: 'High-density grid & dual-column dock',
                  icon: Tablet,
                },
                {
                  id: 'desktop',
                  title: 'Desktop (DeX)',
                  desc: 'Freeform resizable multi-window desktop',
                  icon: Laptop,
                },
                {
                  id: 'foldable',
                  title: 'Foldable Device',
                  desc: 'Dual-panel hinge simulation',
                  icon: FoldHorizontal,
                },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = deviceMode === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setDeviceMode(m.id as DeviceMode)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 shadow-md ring-1 ring-purple-500'
                        : 'bg-neutral-800/40 border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon size={20} className={isSelected ? 'text-purple-400' : 'text-neutral-400'} />
                      {isSelected && <Check size={16} className="text-purple-400" />}
                    </div>
                    <div className="text-sm font-semibold text-white">{m.title}</div>
                    <div className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{m.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Foldable Hinge Toggle if in foldable mode */}
            {(deviceMode === 'foldable' || actualDevice === 'foldable') && (
              <div className="p-4 bg-neutral-800/60 border border-neutral-700 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Fold / Unfold Hinge State</div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Currently: {isFolded ? 'Folded (Compact Outer Cover Screen)' : 'Unfolded (Large Inner Canvas)'}
                  </div>
                </div>
                <button
                  onClick={() => setIsFolded(!isFolded)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold text-white transition-colors"
                >
                  {isFolded ? 'Unfold Screen' : 'Fold Screen'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'wallpaper' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold">Material You & Wallpapers</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Select an adaptive wallpaper. The system extracts accent colors to dynamically tint navigation, pills, and system controls.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {WALLPAPERS.map((wp) => {
                const isSelected = wallpaper.id === wp.id;
                return (
                  <div
                    key={wp.id}
                    onClick={() => setWallpaper(wp)}
                    className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all group aspect-[16/10] ${
                      isSelected ? 'border-purple-500 ring-2 ring-purple-500' : 'border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    <img 
                      src={wp.url} 
                      alt={wp.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-medium text-white">{wp.name}</span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white">
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold">Universal Google Identity</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Manage single sign-on sync, cloud drive, bookmarks, and cross-device continuity.
              </p>
            </div>

            <div className="bg-neutral-800/60 border border-neutral-700 p-5 rounded-3xl flex items-center gap-4">
              <img 
                src={account.avatarUrl} 
                alt={account.name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-400 shadow-lg"
              />
              <div className="flex-1">
                <div className="text-base font-bold text-white">{account.name}</div>
                <div className="text-xs text-neutral-400">{account.email}</div>
                <div className="text-xs text-purple-300 font-medium mt-1">
                  Active on {account.syncedDevicesCount} paired devices
                </div>
              </div>
              <button
                onClick={syncAccount}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
              >
                <RefreshCw size={14} />
                <span>Sync Now</span>
              </button>
            </div>

            <div className="bg-neutral-800/40 border border-neutral-700/60 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Cloud Storage Quota</span>
                <span className="font-semibold text-white">{account.storageUsedGb} GB of {account.storageTotalGb} GB</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Last Synced</span>
                <span className="text-neutral-300">{account.lastSynced}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Cross-Device Handoff</span>
                <span className="text-emerald-400 font-medium">Enabled</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold">About OmniOS</h2>
              <p className="text-xs text-neutral-400 mt-1">
                System specification and hardware emulation layer.
              </p>
            </div>

            <div className="bg-neutral-800/50 border border-neutral-700 rounded-3xl p-5 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Platform</span>
                <span className="font-semibold text-white">OmniOS Universal Android System</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Base Compatibility</span>
                <span className="text-neutral-200">Android 15 (AOSP) + ChromeOS DeX</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Current Viewport Mode</span>
                <span className="text-purple-300 font-mono capitalize">{actualDevice}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Runtime Engine</span>
                <span className="text-neutral-200 font-mono">React 18 / Vite / WebAssembly / Tailwind</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Battery Simulation</span>
                <span className="text-emerald-400 font-mono">{batteryLevel}% (Health: Good)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
