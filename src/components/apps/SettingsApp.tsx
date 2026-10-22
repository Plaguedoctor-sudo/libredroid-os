import React, { useState } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Laptop, 
  FoldHorizontal, 
  Palette, 
  Sun, 
  Battery, 
  ShieldCheck, 
  Info, 
  RefreshCw, 
  Check, 
  Layers, 
  HardDrive,
  Cpu,
  Key,
  Sparkles
} from 'lucide-react';
import { useSystem, WALLPAPERS } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { usePersona } from '../../context/PersonaContext';
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

  const { openApp } = useWindow();
  const { persona, openWizard } = usePersona();

  const [activeTab, setActiveTab] = useState<'persona' | 'device' | 'wallpaper' | 'account' | 'about'>('persona');

  return (
    <div className="flex-1 w-full h-full flex flex-col sm:flex-row bg-neutral-900 text-white select-none overflow-hidden">
      {/* Sidebar Tabs */}
      <div className="w-full sm:w-56 bg-neutral-950 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-neutral-800 flex sm:flex-col gap-1.5 shrink-0 overflow-x-auto">
        <div className="hidden sm:block text-xs font-bold uppercase tracking-wider text-neutral-400 px-3 py-2">
          Settings
        </div>

        {[
          { id: 'persona', label: 'Universal Persona', icon: Sparkles },
          { id: 'device', label: 'Form Factor', icon: Layers },
          { id: 'wallpaper', label: 'Style & Wallpapers', icon: Palette },
          { id: 'account', label: 'Sovereign Identity', icon: Key },
          { id: 'about', label: 'About LibreDroid', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        <div className="hidden sm:block mt-auto pt-4 border-t border-neutral-850">
          <button
            onClick={() => openApp('system_installer')}
            className="w-full flex items-center gap-2 p-2.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-2xl text-xs font-semibold transition-colors"
          >
            <HardDrive size={15} />
            <span>Install to Disk</span>
          </button>
        </div>
      </div>

      {/* Main Settings Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {activeTab === 'persona' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold">Universal User Persona</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Adapts LibreDroid's behavior, navigation, security armor, and layout to the specific human installing the OS.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-950 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Active Profile</div>
                  <div className="text-base font-bold text-white mt-0.5">{persona.name}</div>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {persona.archetype.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">{persona.tagline}</p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <div className="text-neutral-400">Navigation Style</div>
                  <div className="font-bold text-white mt-0.5 capitalize">{persona.navigationStyle.replace('_', ' ')}</div>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <div className="text-neutral-400">Defense Stance</div>
                  <div className="font-bold text-white mt-0.5 capitalize">{persona.securityLevel.replace('_', ' ')}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-neutral-850">
                <button
                  onClick={openWizard}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 font-bold text-xs text-white shadow-lg transition-all"
                >
                  Launch Adaptation Wizard
                </button>
                <button
                  onClick={() => openApp('persona_engine')}
                  className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 font-semibold text-xs text-neutral-200 transition-colors"
                >
                  Fine-Tune Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'device' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold">Universal Device Adaptation</h2>
              <p className="text-xs text-neutral-400 mt-1">
                LibreDroid dynamically adapts its UI, navigation bars, and application layouts to match any target form factor.
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
                        ? 'bg-emerald-600/20 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                        : 'bg-neutral-800/40 border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon size={20} className={isSelected ? 'text-emerald-400' : 'text-neutral-400'} />
                      {isSelected && <Check size={16} className="text-emerald-400" />}
                    </div>
                    <div className="text-sm font-semibold text-white">{m.title}</div>
                    <div className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{m.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Foldable Hinge Toggle */}
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold text-white transition-colors"
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
              <h2 className="text-lg font-bold">Open Style & Wallpapers</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Select an open-source adaptive wallpaper. The system dynamically tints navigation and system pills.
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
                      isSelected ? 'border-emerald-500 ring-2 ring-emerald-500' : 'border-neutral-700 hover:border-neutral-500'
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
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
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
              <h2 className="text-lg font-bold">Self-Sovereign Identity</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Independent authentication managed locally via Matrix, Nextcloud, Passkeys, or OpenPGP keys. No Big Tech account required.
              </p>
            </div>

            <div className="bg-neutral-800/60 border border-neutral-700 p-5 rounded-3xl flex items-center gap-4">
              <img 
                src={account.avatarUrl} 
                alt={account.name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400 shadow-lg"
              />
              <div className="flex-1">
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <span>{account.name}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                    Self-Hosted
                  </span>
                </div>
                <div className="text-xs text-neutral-400 font-mono">user@matrix.libredroid.local</div>
                <div className="text-xs text-emerald-400 font-medium mt-1">
                  PGP Fingerprint: 4E92 A91B 89CF 2410
                </div>
              </div>
              <button
                onClick={syncAccount}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shadow"
              >
                <RefreshCw size={14} />
                <span>Sync Node</span>
              </button>
            </div>

            <div className="bg-neutral-800/40 border border-neutral-700/60 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Nextcloud Hub Quota</span>
                <span className="font-semibold text-white">18.4 GB of 512 GB SSD</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Last Synced to Local Mesh</span>
                <span className="text-neutral-300">{account.lastSynced}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Zero Big Tech Telemetry</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck size={14} />
                  <span>Enforced by microG & Waydroid</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold">About LibreDroid OS</h2>
              <p className="text-xs text-neutral-400 mt-1">
                The independent, non-monopolistic universal operating platform.
              </p>
            </div>

            <div className="bg-neutral-800/50 border border-neutral-700 rounded-3xl p-5 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Distribution</span>
                <span className="font-semibold text-emerald-400">LibreDroid OS Universal (FOSS Edition)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Android Runtime</span>
                <span className="text-neutral-200">Waydroid LXC Container (AOSP 13/15) + microG</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Kernel Specification</span>
                <span className="text-neutral-200 font-mono">Linux 6.6.21-libredroid-gki (Ashmem/Binder IPC)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Package Compatibility</span>
                <span className="text-emerald-300 font-mono">Standard Android .APK & WebAssembly</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Monopoly Independence</span>
                <span className="text-emerald-400 font-bold">100% De-Googled & Open Source</span>
              </div>
            </div>

            <button
              onClick={() => openApp('system_installer')}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <HardDrive size={16} />
              <span>Launch Hardware System Installer Wizard</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
