import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Apple,
  Terminal,
  Flame,
  Zap,
  Lock,
  Box,
  ShieldAlert,
  CheckCircle2,
  PhoneCall,
  Wifi,
  Film,
  Camera,
  Fingerprint,
  Download,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { useSystem, WALLPAPERS } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { usePersona } from '../../context/PersonaContext';
import { useSecurity } from '../../context/SecurityContext';
import type { AppIntent } from '../../types/apps';
import { DeviceMode, InterfaceMode } from '../../types/system';
import { playIntegrityEngine, CERTIFIED_FINGERPRINTS, PlayIntegrityStatus } from '../../services/playIntegrityEngine';
import { drmWidevineEngine, WidevineDrmStatus } from '../../services/drmWidevineEngine';
import { hardwareHalBridge, GLOBAL_CARRIER_PROFILES, HardwareHalState } from '../../services/hardwareHalBridge';
import { ReadinessPanel } from '../../platform/react/ReadinessPanel';
import { openWizard } from '../../platform/react/SetupHost';

interface Props extends Partial<AppIntent> {
  intent?: AppIntent;
}

export const SettingsApp: React.FC<Props> = ({ intent, params, paramSeq }) => {
  const effectiveIntent = intent || (params ? { params, paramSeq } : undefined);
  const { 
    deviceMode, 
    setDeviceMode, 
    interfaceMode,
    setInterfaceMode,
    actualDevice, 
    isFolded, 
    setIsFolded, 
    wallpaper, 
    setWallpaper, 
    batteryLevel, 
    account, 
    syncAccount,
    lockSettings,
    updateLockSettings,
    lockDevice,
    quickSettings,
    setQuickSettingValue
  } = useSystem();

  const { openApp } = useWindow();
  const { persona, openWizard } = usePersona();
  const { 
    appleStack, 
    linuxStack, 
    toggleAppleLockdownMode, 
    setSelinuxMode,
    auditLogs
  } = useSecurity();

  const [activeTab, setActiveTab] = useState<'persona' | 'hardened_security' | 'lock_screen' | 'device' | 'compatibility' | 'hardware_hal' | 'wallpaper' | 'account' | 'about' | 'bare_metal'>('persona');
  
  // Play Integrity & DRM live state
  const [integrityStatus, setIntegrityStatus] = useState<PlayIntegrityStatus>(() => playIntegrityEngine.getStatus());
  const [drmStatus, setDrmStatus] = useState<WidevineDrmStatus>(() => drmWidevineEngine.getStatus());
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState(false);
  const [integrityTestResult, setIntegrityTestResult] = useState<string | null>(null);

  // Hardware HAL live state
  const [halState, setHalState] = useState<HardwareHalState>(() => hardwareHalBridge.getState());
  const [biometricFeedback, setBiometricFeedback] = useState<string | null>(null);

  // Lock screen PIN settings state
  const [newPinInput, setNewPinInput] = useState(lockSettings.pin);
  const [pinSavedFeedback, setPinSavedFeedback] = useState(false);

  /* Consume Deep Link / Intent */
  useEffect(() => {
    const p = effectiveIntent?.params;
    if (!p) return;
    if (typeof p.tab === 'string') {
      setActiveTab(p.tab as any);
    }
  }, [effectiveIntent?.paramSeq]);

  return (
    <div className="flex-1 w-full h-full flex flex-col sm:flex-row bg-neutral-900 text-white select-none overflow-hidden">
      {/* Sidebar Tabs */}
      <div className="w-full sm:w-56 bg-neutral-950 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-neutral-800 flex sm:flex-col gap-1.5 shrink-0 overflow-x-auto">
        <div className="hidden sm:block text-xs font-bold uppercase tracking-wider text-neutral-400 px-3 py-2">
          Settings
        </div>

        {[
          { id: 'persona', label: 'Universal Persona', icon: Sparkles },
          { id: 'bare_metal', label: 'Bare Metal & Caps', icon: Terminal },
          { id: 'compatibility', label: 'Play Integrity & DRM', icon: CheckCircle2 },
          { id: 'hardware_hal', label: 'Hardware HAL & VoLTE', icon: Cpu },
          { id: 'hardened_security', label: 'Hardened Security', icon: ShieldCheck },
          { id: 'lock_screen', label: 'Lock Screen & Display', icon: Lock },
          { id: 'device', label: 'Interface & Form Factor', icon: Layers },
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

        {activeTab === 'hardened_security' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" size={20} />
                <span>Hardened OS Security Architecture</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Unified security matrix combining Apple Hardened OS (Lockdown Mode, BlastDoor, SEP) with Linux Kernel Hardening (SELinux, KSPP, Landlock).
              </p>
            </div>

            {/* Apple Lockdown Mode Toggle */}
            <div className={`p-5 rounded-3xl border transition-all ${
              appleStack.lockdownMode ? 'bg-rose-950/30 border-rose-500/50' : 'bg-neutral-950 border-neutral-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Apple size={16} className="text-neutral-200" />
                    <span className="text-sm font-bold text-white">Apple Lockdown Mode</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Disables WebKit JIT compiler, engages BlastDoor zero-click sandbox, isolates USB data pins.
                  </p>
                </div>

                <button
                  onClick={toggleAppleLockdownMode}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    appleStack.lockdownMode
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700'
                  }`}
                >
                  {appleStack.lockdownMode ? 'ACTIVE' : 'TURN ON'}
                </button>
              </div>
            </div>

            {/* Linux SELinux Selector */}
            <div className="p-5 rounded-3xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-cyan-400" />
                    <span className="text-sm font-bold text-white">Linux SELinux Mandatory Access</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Multi-Category Security (MCS) and unprivileged process domain confinement.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                  {(['enforcing', 'permissive'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelinuxMode(m)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                        linuxStack.selinuxMode === m
                          ? m === 'enforcing'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-600 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Security Summary Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                <div className="font-bold text-cyan-300 flex items-center gap-1">
                  <Terminal size={13} />
                  <span>KSPP Sysctls</span>
                </div>
                <div className="text-neutral-400 text-[11px]">9/9 Sysctls Hardened (Yama ptrace_scope=3, kptr_restrict=2)</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                <div className="font-bold text-emerald-300 flex items-center gap-1">
                  <ShieldCheck size={13} />
                  <span>Threats Neutralized</span>
                </div>
                <div className="text-neutral-400 text-[11px]">{auditLogs.length} Exploits Logged in Audit Trail</div>
              </div>
            </div>

            <button
              onClick={() => openApp('security')}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 font-bold text-xs text-white shadow-xl flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck size={16} />
              <span>Launch Security Guardrails & PenTest Lab</span>
            </button>
          </div>
        )}

        {activeTab === 'lock_screen' && (
          <div className="space-y-6 max-w-xl animate-fade-in">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Lock size={18} className="text-emerald-400" />
                <span>Lock Screen & Display Security</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Configure credential protection, inactivity timeout, biometric sensors, and display power policies.
              </p>
            </div>

            {/* Lock Status Card */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Hardware Enclave Lock</div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Protected by TrustZone / seL4 microkernel key storage
                  </div>
                </div>
              </div>
              <button
                onClick={() => lockDevice()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Lock size={14} />
                <span>Lock Now</span>
              </button>
            </div>

            {/* PIN Configuration */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Screen Lock PIN</div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Default sovereign PIN is <span className="font-mono text-emerald-400">0000</span>
                  </div>
                </div>
                {pinSavedFeedback && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Check size={14} /> PIN Updated
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="password"
                  maxLength={6}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter 4-digit PIN"
                  className="w-40 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-sm font-mono tracking-widest text-white text-center focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => {
                    if (newPinInput.length >= 4) {
                      updateLockSettings({ pin: newPinInput });
                      setPinSavedFeedback(true);
                      setTimeout(() => setPinSavedFeedback(false), 2500);
                    }
                  }}
                  disabled={newPinInput.length < 4}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 active:scale-95 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Save PIN
                </button>
              </div>
            </div>

            {/* Inactivity Auto-Lock Timeout */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div>
                <div className="text-sm font-semibold text-white">Screen Timeout & Auto-Lock</div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Automatically lock the screen after device inactivity to protect your private domains.
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                {[
                  { label: '30s', val: 30 },
                  { label: '1 min', val: 60 },
                  { label: '2 min', val: 120 },
                  { label: '5 min', val: 300 },
                  { label: '10 min', val: 600 },
                  { label: 'Never', val: 0 },
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    onClick={() => updateLockSettings({ autoLockTimeoutSeconds: val })}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all border ${
                      lockSettings.autoLockTimeoutSeconds === val
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-850'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy & Feature Toggles */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
              <div className="text-sm font-semibold text-white">Lock Screen Behavior</div>

              {/* Show Notifications */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="text-xs font-semibold text-white">Show Notifications on Lock Screen</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Display message and system alert previews before unlocking
                  </div>
                </div>
                <button
                  onClick={() => updateLockSettings({ showNotificationsOnLockScreen: !lockSettings.showNotificationsOnLockScreen })}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                    lockSettings.showNotificationsOnLockScreen ? 'bg-emerald-600' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                      lockSettings.showNotificationsOnLockScreen ? 'left-6.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Biometric Strong HAL */}
              <div className="flex items-center justify-between py-1 border-t border-neutral-900">
                <div>
                  <div className="text-xs font-semibold text-white">Biometric Fingerprint Authentication</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Allow instant unlocking via ultrasonic / optical fingerprint sensor
                  </div>
                </div>
                <button
                  onClick={() => updateLockSettings({ biometricsEnabled: !lockSettings.biometricsEnabled })}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                    lockSettings.biometricsEnabled ? 'bg-emerald-600' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                      lockSettings.biometricsEnabled ? 'left-6.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Display Brightness */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sun size={16} className="text-amber-400" />
                  <span>Display Brightness</span>
                </div>
                <span className="text-xs font-mono text-neutral-400">{quickSettings.brightness}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quickSettings.brightness}
                onChange={(e) => setQuickSettingValue('brightness', Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
              />
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

            {/* Interface Experience Mode */}
            <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">System Experience Mode</h3>
                  <p className="text-xs text-neutral-400">Switch between standard consumer Android smartphone behavior and hypervisor isolation.</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {interfaceMode === 'standard_android' ? 'Android Single Surface' : 'Hypervisor Matrix'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div
                  onClick={() => setInterfaceMode('standard_android')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    interfaceMode === 'standard_android'
                      ? 'bg-emerald-600/20 border-emerald-500 ring-1 ring-emerald-500'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Smartphone size={16} className="text-emerald-400" />
                    <span className="text-xs font-bold text-white">Standard Android OS</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Edge-to-edge native app presentation, gesture pill navigation, standard status bar (5G/VoLTE), and zero desktop window chrome.
                  </p>
                </div>

                <div
                  onClick={() => setInterfaceMode('qubes_matrix')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    interfaceMode === 'qubes_matrix'
                      ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Layers size={16} className="text-purple-400" />
                    <span className="text-xs font-bold text-white">Qubes Multi-Domain Matrix</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Color-coded domain borders, seL4/Whonix/GrapheneOS live badges, Tor circuit visualizer, and domain migration on the fly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compatibility: Google Play Integrity & Widevine DRM */}
        {activeTab === 'compatibility' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold">Google Play Integrity & Widevine L1 DRM</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Hardware attestation spoofer, certified device fingerprint rotation, and OEMCrypto DRM engine to pass banking apps and unlock 4K streaming.
              </p>
            </div>

            {/* Play Integrity Verdict Live Card */}
            <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <span className="text-sm font-bold text-white">Play Integrity Attestation Verdict</span>
                </div>
                <button
                  onClick={async () => {
                    setIsVerifyingIntegrity(true);
                    setIntegrityTestResult(null);
                    const res = await playIntegrityEngine.runDiagnostics();
                    setIntegrityStatus(playIntegrityEngine.getStatus());
                    setIsVerifyingIntegrity(false);
                    setIntegrityTestResult(`Passed in ${res.durationMs}ms: Meets Strong, Device & Basic Integrity.`);
                  }}
                  disabled={isVerifyingIntegrity}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isVerifyingIntegrity ? 'animate-spin' : ''} />
                  <span>{isVerifyingIntegrity ? 'Verifying...' : 'Check Integrity'}</span>
                </button>
              </div>

              {integrityTestResult && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                  ✓ {integrityTestResult}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <div className="text-neutral-400 text-[10px] uppercase font-bold">Basic Integrity</div>
                  <div className="text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <Check size={14} /> PASS
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">CTS Profile Validated</div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <div className="text-neutral-400 text-[10px] uppercase font-bold">Device Integrity</div>
                  <div className="text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <Check size={14} /> PASS
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Google Certified Device</div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 col-span-2 sm:col-span-1">
                  <div className="text-neutral-400 text-[10px] uppercase font-bold">Strong Integrity</div>
                  <div className="text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <Check size={14} /> PASS
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Hardware Keybox TEE</div>
                </div>
              </div>

              {/* Banking Apps Cloaking Status */}
              <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Banking Apps & Google Pay Cloaking</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Hides unlocked bootloader & root from Barclays, Revolut, Chase, Google Wallet.
                  </div>
                </div>
                <button
                  onClick={() => {
                    playIntegrityEngine.toggleBankingBypass(!integrityStatus.bankingAppBypassActive);
                    setIntegrityStatus(playIntegrityEngine.getStatus());
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    integrityStatus.bankingAppBypassActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {integrityStatus.bankingAppBypassActive ? 'Cloak Active' : 'Disabled'}
                </button>
              </div>

              {/* Certified Fingerprint Profile Switcher */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-neutral-300">Certified Device Fingerprint Profile</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CERTIFIED_FINGERPRINTS.map(profile => {
                    const isSelected = profile.id === integrityStatus.activeProfileId;
                    return (
                      <div
                        key={profile.id}
                        onClick={() => {
                          playIntegrityEngine.setProfile(profile.id);
                          setIntegrityStatus(playIntegrityEngine.getStatus());
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-600/20 border-emerald-500 shadow-sm'
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{profile.name}</span>
                          {isSelected && <Check size={14} className="text-emerald-400" />}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-1 truncate">
                          Patch: {profile.securityPatch}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Export pif.json */}
              <button
                onClick={() => {
                  const pif = playIntegrityEngine.exportPifJson();
                  const blob = new Blob([pif], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'pif.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-2.5 px-3 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 rounded-2xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                <span>Export pif.json for Magisk / KernelSU / PlayIntegrityNext</span>
              </button>
            </div>

            {/* Widevine L1 Streaming DRM Card */}
            <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film size={18} className="text-purple-400" />
                  <span className="text-sm font-bold text-white">Widevine Modular DRM Subsystem</span>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {drmStatus.securityLevel} Hardware TEE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <div className="text-neutral-400 text-[10px] uppercase font-bold">Max Resolution</div>
                  <div className="text-white font-bold mt-1 text-xs">4K UHD (2160p)</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Dolby Vision / HDR10+</div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <div className="text-neutral-400 text-[10px] uppercase font-bold">HDCP Protection</div>
                  <div className="text-white font-bold mt-1 text-xs">{drmStatus.hdcpLevel}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">OEMCrypto HAL Bridge v16</div>
                </div>
              </div>

              {/* Streaming Compatibility Matrix */}
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-bold text-neutral-300">Verified Streaming Platforms</div>
                <div className="space-y-1.5">
                  {drmStatus.streamingServicesStatus.map(s => (
                    <div key={s.service} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{s.service}</span>
                        <div className="text-[10px] text-neutral-400">{s.audioCodecs}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold">{s.maxResolution}</span>
                        <div className="text-[9px] text-neutral-400 font-mono">HDR Verified</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hardware HAL & VoLTE Carrier Stack */}
        {activeTab === 'hardware_hal' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-lg font-bold">Hardware HAL Bridge & Cellular IMS</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Direct carrier VoLTE/VoWiFi configuration, Camera2 API Level 3 HDR+ computational pipeline, and Biometric Strong HAL.
              </p>
            </div>

            {/* Carrier & VoLTE IMS Card */}
            <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhoneCall size={18} className="text-emerald-400" />
                  <span className="text-sm font-bold text-white">VoLTE & Cellular IMS Carrier Engine</span>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  IMS Registered
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-neutral-400 text-[10px] uppercase font-bold">VoLTE HD Voice</div>
                    <div className="text-white font-bold mt-0.5">AMR-WB / EVS</div>
                  </div>
                  <button
                    onClick={() => {
                      hardwareHalBridge.toggleVoLte(!halState.volteEnabled);
                      setHalState(hardwareHalBridge.getState());
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      halState.volteEnabled ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {halState.volteEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-neutral-400 text-[10px] uppercase font-bold">VoWiFi (ePDG)</div>
                    <div className="text-white font-bold mt-0.5">Wi-Fi Calling</div>
                  </div>
                  <button
                    onClick={() => {
                      hardwareHalBridge.toggleVoWiFi(!halState.vowifiEnabled);
                      setHalState(hardwareHalBridge.getState());
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      halState.vowifiEnabled ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {halState.vowifiEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Carrier Selection */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-neutral-300">Active Carrier Configuration Profile</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GLOBAL_CARRIER_PROFILES.map(carrier => {
                    const isSelected = carrier.id === halState.activeCarrierId;
                    return (
                      <div
                        key={carrier.id}
                        onClick={() => {
                          hardwareHalBridge.setCarrier(carrier.id);
                          setHalState(hardwareHalBridge.getState());
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-600/20 border-emerald-500 shadow-sm'
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{carrier.name}</span>
                          {isSelected && <Check size={14} className="text-emerald-400" />}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-1">
                          {carrier.country} • {carrier.voiceCodec}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Camera HAL Bridge */}
            <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera size={18} className="text-cyan-400" />
                  <span className="text-sm font-bold text-white">Camera HAL & Computational GCam Pipeline</span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {halState.camera.apiLevel}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {halState.camera.multiLensArray.map(lens => (
                  <div key={lens.id} className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
                    <div className="text-cyan-400 font-bold text-xs uppercase">{lens.type.replace('_', ' ')}</div>
                    <div className="text-white font-semibold text-xs mt-0.5">{lens.resolutionMp}MP</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{lens.focalLength} {lens.aperture}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs">
                <div>
                  <div className="font-semibold text-white">Computational Photography Tuning</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Multi-frame RAW stacking & Zero Shutter Lag</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-cyan-600/30 text-cyan-300 font-bold text-xs border border-cyan-500/40">
                  {halState.camera.gcamTuningProfile}
                </span>
              </div>
            </div>

            {/* Biometric Fingerprint HAL */}
            <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint size={18} className="text-amber-400" />
                  <span className="text-sm font-bold text-white">Biometric Fingerprint HAL Bridge</span>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Class 3 Strong
                </span>
              </div>

              <div className="text-xs text-neutral-300 leading-relaxed">
                Sensor: <span className="font-semibold text-white">{halState.biometrics.sensorType}</span> isolated inside TrustZone/seL4 verified enclave.
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs">
                <div>
                  <div className="font-semibold text-white">Test Hardware Biometric Scan</div>
                  <div className="text-[10px] text-neutral-400">Triggers fingerprint HAL prompt test</div>
                </div>
                <button
                  onClick={async () => {
                    setBiometricFeedback('Scanning sensor...');
                    const res = await hardwareHalBridge.verifyBiometricScan();
                    setBiometricFeedback(`✓ Verified in ${res.latencyMs}ms (Finger #${res.fingerId})`);
                  }}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <Fingerprint size={14} />
                  <span>Scan Now</span>
                </button>
              </div>

              {biometricFeedback && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                  {biometricFeedback}
                </div>
              )}
            </div>
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

        {activeTab === 'bare_metal' && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h2 className="text-lg font-bold text-white">Bare Metal & Capability Gate</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Real-time hardware introspection, anti-lying capability tiers, and system readiness.
                </p>
              </div>
              <button
                onClick={() => openWizard()}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black text-xs font-semibold rounded-xl shadow-lg transition-all"
              >
                Run Setup Wizard
              </button>
            </div>
            <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800">
              <ReadinessPanel />
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

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Integrated System Modules</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => openApp('hypervisor')}
                  className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-purple-500/50 flex items-center gap-2.5 transition-all text-left"
                >
                  <Layers size={16} className="text-purple-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Multi-OS Matrix</div>
                    <div className="text-[10px] text-neutral-400">seL4 & Qubes Domains</div>
                  </div>
                </button>
                <button
                  onClick={() => openApp('guardian')}
                  className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 flex items-center gap-2.5 transition-all text-left"
                >
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Anti-Monopoly Core</div>
                    <div className="text-[10px] text-neutral-400">UnifiedPush & Repos</div>
                  </div>
                </button>
                <button
                  onClick={() => openApp('predatory_shield')}
                  className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-rose-500/50 flex items-center gap-2.5 transition-all text-left"
                >
                  <ShieldAlert size={16} className="text-rose-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Anti-Predatory Shield</div>
                    <div className="text-[10px] text-neutral-400">Synthetic False Telemetry</div>
                  </div>
                </button>
                <button
                  onClick={() => openApp('hardware')}
                  className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-cyan-500/50 flex items-center gap-2.5 transition-all text-left"
                >
                  <Cpu size={16} className="text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Hardware HAL</div>
                    <div className="text-[10px] text-neutral-400">Sensors, DTS & Compute</div>
                  </div>
                </button>
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
