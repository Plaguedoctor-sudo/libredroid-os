import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  MapPin, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  RefreshCw,
  Terminal,
  Activity,
  Zap,
  Power
} from 'lucide-react';
import { 
  SecurityGuardrail, 
  AppPermissionRule, 
  SecurityIncident,
  CORE_GUARDRAILS, 
  DEFAULT_APP_RULES, 
  INITIAL_SECURITY_INCIDENTS 
} from '../../services/securityGuardrailsEngine';
import { useSystem } from '../../context/SystemContext';

export const SecurityGuardrailsApp: React.FC = () => {
  const { addNotification } = useSystem();
  const [activeTab, setActiveTab] = useState<'guardrails' | 'killswitches' | 'firewall' | 'incidents' | 'panic'>('guardrails');
  const [guardrails, setGuardrails] = useState<SecurityGuardrail[]>(CORE_GUARDRAILS);
  const [appRules, setAppRules] = useState<AppPermissionRule[]>(DEFAULT_APP_RULES);
  const [incidents, setIncidents] = useState<SecurityIncident[]>(INITIAL_SECURITY_INCIDENTS);

  // Global Hardware Killswitches
  const [killswitches, setKillswitches] = useState({
    micDisabled: false,
    cameraDisabled: false,
    locationDisabled: false,
    usbDataLocked: true,
  });

  const toggleKillswitch = (key: keyof typeof killswitches, label: string) => {
    const newState = !killswitches[key];
    setKillswitches((prev) => ({ ...prev, [key]: newState }));
    addNotification({
      appId: 'security',
      appName: 'Security Guardrails',
      title: `${label} ${newState ? 'Cut Off / Disabled' : 'Re-Enabled'}`,
      body: `Hardware subsystem has been ${newState ? 'hardware isolated' : 'unlocked'}.`,
    });
  };

  const toggleAppPermission = (appId: string, perm: keyof Omit<AppPermissionRule, 'appId' | 'appName' | 'isolatedSandbox'>) => {
    setAppRules((prev) =>
      prev.map((app) =>
        app.appId === appId ? { ...app, [perm]: !app[perm] } : app
      )
    );
  };

  const triggerEmergencyLockdown = () => {
    setKillswitches({
      micDisabled: true,
      cameraDisabled: true,
      locationDisabled: true,
      usbDataLocked: true,
    });
    addNotification({
      appId: 'security',
      appName: 'Emergency Panic Protocol',
      title: 'System Locked Down & Sanitized',
      body: 'All external hardware buses cut off. Transient cryptographic keys flushed.',
    });
  };

  const activeCount = guardrails.filter((g) => g.status === 'active').length;

  return (
    <div className="flex-1 w-full h-full flex flex-col sm:flex-row bg-neutral-900 text-white select-none overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-full sm:w-60 bg-neutral-950 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-neutral-800 flex sm:flex-col gap-1.5 shrink-0 overflow-x-auto">
        <div className="hidden sm:block text-xs font-bold uppercase tracking-wider text-emerald-400 px-3 py-2 flex items-center gap-1.5">
          <ShieldCheck size={16} />
          <span>Security Guardrails</span>
        </div>

        {[
          { id: 'guardrails', label: 'Hardened Guardrails', icon: ShieldCheck, badge: `${activeCount}/8` },
          { id: 'killswitches', label: 'Hardware Killswitches', icon: Power },
          { id: 'firewall', label: 'App Network Firewall', icon: Wifi },
          { id: 'incidents', label: 'Trapped Threats', icon: ShieldAlert, badge: incidents.length },
          { id: 'panic', label: 'Emergency Lockdown', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} />
                <span>{tab.label}</span>
              </div>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-white text-emerald-700' : 'bg-neutral-800 text-neutral-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* TAB 1: HARDENED GUARDRAILS STATUS */}
        {activeTab === 'guardrails' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-medium mb-2 border border-emerald-500/30">
                <ShieldCheck size={14} />
                <span>Hardware & Kernel Hardened</span>
              </div>
              <h2 className="text-xl font-bold">OS-Level Security Guardrails</h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Full protection suite inspired by GrapheneOS and hardened Linux. Enforces strict Mandatory Access Control, hardware-verified boot, exploit mitigations, and encrypted storage.
              </p>
            </div>

            {/* Score Banner */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-teal-950/40 border border-emerald-500/30 p-4 rounded-3xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">System Hardening Score</span>
                <div className="text-2xl font-black text-white font-mono mt-0.5">100 / 100 • Enforcing</div>
                <div className="text-xs text-neutral-300 mt-1">Zero vulnerabilities exposed to user-space applications</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg font-mono">
                A+
              </div>
            </div>

            {/* Guardrails List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guardrails.map((g) => (
                <div
                  key={g.id}
                  className="p-3.5 bg-neutral-850/80 border border-neutral-700/80 rounded-2xl flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{g.name}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono">
                        {g.enforcementLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{g.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono pt-1 border-t border-neutral-800">
                    <CheckCircle2 size={12} />
                    <span>Active & Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: HARDWARE KILLSWITCHES */}
        {activeTab === 'killswitches' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">Hardware Subsystem Cutoffs</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Instantly disconnect sensory and data hardware buses at the kernel driver layer. Applications cannot bypass these cutoffs even with root privileges.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: 'micDisabled',
                  title: 'Microphone Hardware Cutoff',
                  desc: 'Completely unbinds the audio capture device node (/dev/snd). Apps receive zero audio bytes.',
                  iconActive: MicOff,
                  iconInactive: Mic,
                  label: 'Microphone',
                },
                {
                  key: 'cameraDisabled',
                  title: 'Camera Sensor Cutoff',
                  desc: 'Powers down the camera sensor controller. Blocks any physical video input.',
                  iconActive: CameraOff,
                  iconInactive: Camera,
                  label: 'Camera',
                },
                {
                  key: 'locationDisabled',
                  title: 'Location & GPS Cutoff',
                  desc: 'Disables GPS chip and cellular tower trilateration subsystem.',
                  iconActive: MapPin,
                  iconInactive: MapPin,
                  label: 'Location/GPS',
                },
                {
                  key: 'usbDataLocked',
                  title: 'USB Port Data Bus Lock',
                  desc: 'Blocks all USB data negotiation while locked. Defends against Juice Jacking and BadUSB exploit dongles.',
                  iconActive: Lock,
                  iconInactive: Unlock,
                  label: 'USB Data Bus',
                },
              ].map((sw) => {
                const isEngaged = (killswitches as any)[sw.key];
                const Icon = isEngaged ? sw.iconActive : sw.iconInactive;
                return (
                  <div
                    key={sw.key}
                    onClick={() => toggleKillswitch(sw.key as any, sw.label)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                      isEngaged
                        ? 'bg-rose-950/30 border-rose-500/50'
                        : 'bg-neutral-800/40 border-neutral-700/60 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isEngaged ? 'bg-rose-600/30 text-rose-300' : 'bg-neutral-700 text-neutral-300'}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{sw.title}</div>
                        <div className="text-xs text-neutral-400 mt-0.5">{sw.desc}</div>
                      </div>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold shrink-0 ${
                      isEngaged ? 'bg-rose-600 text-white' : 'bg-neutral-700 text-neutral-400'
                    }`}>
                      {isEngaged ? 'ISOLATED' : 'ENABLED'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: APP NETWORK FIREWALL (GrapheneOS STYLE) */}
        {activeTab === 'firewall' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">Per-App Network & Hardware Firewall</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Unlike standard Android where apps receive internet permission automatically without user consent, LibreDroid allows revoking network access from any app (e.g. calculator or video player) so it can never leak data.
              </p>
            </div>

            <div className="space-y-3">
              {appRules.map((app) => (
                <div
                  key={app.appId}
                  className="p-4 bg-neutral-850 border border-neutral-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{app.appName}</span>
                      <span className="text-[10px] bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded font-mono">
                        {app.appId}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
                      <span>Sandbox: LXC Isolated</span>
                      <span>•</span>
                      <span>Network: {app.allowNetwork ? 'Allowed' : 'BLOCKED (Firewalled)'}</span>
                    </div>
                  </div>

                  {/* Permission Toggles */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => toggleAppPermission(app.appId, 'allowNetwork')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        app.allowNetwork
                          ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                          : 'bg-rose-600 text-white shadow'
                      }`}
                      title="Toggle Internet Network Permission"
                    >
                      <Wifi size={13} />
                      <span>{app.allowNetwork ? 'Net: ON' : 'Net: OFF'}</span>
                    </button>

                    <button
                      onClick={() => toggleAppPermission(app.appId, 'allowCamera')}
                      className={`p-1.5 rounded-xl text-xs transition-all ${
                        app.allowCamera
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                      title="Camera Permission"
                    >
                      <Camera size={14} />
                    </button>

                    <button
                      onClick={() => toggleAppPermission(app.appId, 'allowMicrophone')}
                      className={`p-1.5 rounded-xl text-xs transition-all ${
                        app.allowMicrophone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                      title="Microphone Permission"
                    >
                      <Mic size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TRAPPED THREATS LOG */}
        {activeTab === 'incidents' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">Trapped Threats & Exploit Mitigations</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Real-time security log displaying attacks neutralized by SELinux, Seccomp-BPF filters, and hardened memory allocations.
              </p>
            </div>

            <div className="space-y-2.5">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-3.5 bg-neutral-850 border border-neutral-700/80 rounded-2xl space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                      <span>{inc.threatType}</span>
                    </span>
                    <span className="text-neutral-500 font-mono text-[11px]">{inc.timestamp}</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed font-mono">{inc.details}</p>
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-neutral-800 text-neutral-400 font-mono">
                    <span>Source: {inc.process}</span>
                    <span className="text-emerald-400">Action: Terminated & Isolated</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: EMERGENCY PANIC PROTOCOL */}
        {activeTab === 'panic' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold text-rose-400">Emergency Panic Protocol</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Instant defensive trigger for high-threat situations. Disconnects all network interfaces, drops hardware buses, and clears cryptographic cache keys from RAM immediately.
              </p>
            </div>

            <div className="p-5 bg-rose-950/20 border border-rose-500/40 rounded-3xl space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Trigger Instant Physical Lockdown</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                  Locks the device, unmounts encrypted file volumes, cuts off camera & microphone, and enables USB data isolation.
                </p>
              </div>

              <button
                onClick={triggerEmergencyLockdown}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl shadow-xl transition-all inline-flex items-center gap-2"
              >
                <Power size={16} />
                <span>Execute Emergency Lockdown Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
