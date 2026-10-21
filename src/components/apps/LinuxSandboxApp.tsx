import React, { useState } from 'react';
import { 
  Box, 
  Layers, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  HardDrive, 
  Folder, 
  Camera, 
  Radio, 
  EyeOff, 
  Sliders, 
  Info,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  LinuxEvolutionEra, 
  AppContainerSandbox, 
  XdgPortalRequest,
  LINUX_EVOLUTION_TIMELINE, 
  DEFAULT_APP_CONTAINERS, 
  INITIAL_XDG_PORTAL_REQUESTS 
} from '../../services/linuxSandboxEngine';
import { useSystem } from '../../context/SystemContext';

export const LinuxSandboxApp: React.FC = () => {
  const { addNotification } = useSystem();
  const [activeTab, setActiveTab] = useState<'timeline' | 'containers' | 'portals' | 'landlock'>('containers');
  const [timeline] = useState<LinuxEvolutionEra[]>(LINUX_EVOLUTION_TIMELINE);
  const [containers, setContainers] = useState<AppContainerSandbox[]>(DEFAULT_APP_CONTAINERS);
  const [selectedAppId, setSelectedAppId] = useState<string>(DEFAULT_APP_CONTAINERS[0].appId);
  const [portalRequests, setPortalRequests] = useState<XdgPortalRequest[]>(INITIAL_XDG_PORTAL_REQUESTS);

  const selectedContainer = containers.find((c) => c.appId === selectedAppId) || containers[0];

  const updateMemoryLimit = (appId: string, limitMb: number) => {
    setContainers((prev) =>
      prev.map((c) =>
        c.appId === appId
          ? { ...c, cgroupsV2: { ...c.cgroupsV2, memoryLimitMb: limitMb } }
          : c
      )
    );
    addNotification({
      appId: 'linux_sandbox',
      appName: 'Linux cgroups v2',
      title: 'Memory Limit Updated',
      body: `Set ${selectedContainer.appName} cgroups.memory.max = ${limitMb} MB.`,
    });
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col sm:flex-row bg-neutral-900 text-white select-none overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-full sm:w-60 bg-neutral-950 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-neutral-800 flex sm:flex-col gap-1.5 shrink-0 overflow-x-auto">
        <div className="hidden sm:block text-xs font-bold uppercase tracking-wider text-cyan-400 px-3 py-2 flex items-center gap-1.5">
          <Box size={16} />
          <span>Linux Sandboxing</span>
        </div>

        {[
          { id: 'containers', label: 'App Containers', icon: Box, badge: containers.length },
          { id: 'timeline', label: 'Linux Evolution', icon: Clock },
          { id: 'portals', label: 'XDG Portals', icon: Folder, badge: portalRequests.length },
          { id: 'landlock', label: 'Landlock & Wayland', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} />
                <span>{tab.label}</span>
              </div>
              {tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-white text-cyan-700' : 'bg-neutral-800 text-neutral-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* TAB 1: APP CONTAINERS INSPECTOR */}
        {activeTab === 'containers' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-medium mb-2 border border-cyan-500/30">
                <Box size={14} />
                <span>Bubblewrap & Namespaces Layer</span>
              </div>
              <h2 className="text-xl font-bold">Linux App Container Inspector</h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Every application in LibreDroid executes inside an unprivileged user namespace container with dedicated mount, network, and process boundaries, managed by cgroups v2 resource controllers.
              </p>
            </div>

            {/* App Selection Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {containers.map((app) => (
                <button
                  key={app.appId}
                  onClick={() => setSelectedAppId(app.appId)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                    selectedAppId === app.appId
                      ? 'bg-cyan-600 text-white shadow'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {app.appName}
                </button>
              ))}
            </div>

            {/* Container Details Card */}
            <div className="p-4 bg-neutral-850 border border-neutral-700 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedContainer.appName}</h3>
                  <div className="text-xs text-neutral-400 font-mono mt-0.5">
                    LXC/bwrap Container ID: {selectedContainer.containerId}
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg font-mono">
                  Unprivileged Root Mapped (UID 10001)
                </span>
              </div>

              {/* 6 Linux Namespaces Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Kernel Namespaces Isolation:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { name: 'PID Namespace', active: selectedContainer.namespaces.pid, desc: 'Hides host processes' },
                    { name: 'Mount Namespace', active: selectedContainer.namespaces.mnt, desc: 'Private chroot /tmp' },
                    { name: 'Network Namespace', active: selectedContainer.namespaces.net, desc: selectedContainer.namespaces.net ? 'Veth bridged' : 'Network isolated' },
                    { name: 'User Namespace', active: selectedContainer.namespaces.user, desc: 'Root mapped to non-root' },
                    { name: 'IPC Namespace', active: selectedContainer.namespaces.ipc, desc: 'Zero cross-app memory' },
                    { name: 'UTS Namespace', active: selectedContainer.namespaces.uts, desc: 'Virtual hostname' },
                  ].map((ns) => (
                    <div key={ns.name} className="p-2.5 bg-neutral-800/60 rounded-xl border border-neutral-700/60">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{ns.name}</span>
                        <span className={`w-2 h-2 rounded-full ${ns.active ? 'bg-cyan-400' : 'bg-neutral-500'}`} />
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{ns.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* cgroups v2 Controls */}
              <div className="space-y-3 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    cgroups v2 Resource Governor
                  </span>
                  <span className="text-xs font-mono text-cyan-300">
                    {selectedContainer.cgroupsV2.currentMemoryMb} MB / {selectedContainer.cgroupsV2.memoryLimitMb} MB RAM
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Memory Ceiling (cgroups.memory.max)</span>
                    <span className="font-mono">{selectedContainer.cgroupsV2.memoryLimitMb} MB</span>
                  </div>
                  <input
                    type="range"
                    min="128"
                    max="2048"
                    step="128"
                    value={selectedContainer.cgroupsV2.memoryLimitMb}
                    onChange={(e) => updateMemoryLimit(selectedContainer.appId, Number(e.target.value))}
                    className="w-full accent-cyan-400 h-2 bg-neutral-700 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-neutral-400 pt-1">
                  <div className="p-2 bg-neutral-800/40 rounded-xl border border-neutral-700/40">
                    <span>cpu.max: {selectedContainer.cgroupsV2.cpuQuotaPercent}% quota</span>
                  </div>
                  <div className="p-2 bg-neutral-800/40 rounded-xl border border-neutral-700/40">
                    <span>pids.max: {selectedContainer.cgroupsV2.maxPids} processes</span>
                  </div>
                </div>
              </div>

              {/* Seccomp-BPF Policy */}
              <div className="space-y-2 pt-2 border-t border-neutral-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-neutral-400">
                    Seccomp-BPF Syscall Filter
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {selectedContainer.seccompBpf.allowedSyscallsCount} of ~450 Syscalls Allowed
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedContainer.seccompBpf.blockedSyscalls.map((sc) => (
                    <span
                      key={sc}
                      className="text-[10px] bg-rose-950/40 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded font-mono"
                    >
                      BLOCKED: {sc}()
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THE 8 ERAS OF LINUX EVOLUTION */}
        {activeTab === 'timeline' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">The Complete Evolution of Linux Security</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Tracing 35 years of Linux security innovations (from 1991 Unix DAC to 2026 Landlock and Wayland). LibreDroid implements all 8 security layers simultaneously.
              </p>
            </div>

            <div className="relative border-l-2 border-neutral-800 ml-4 pl-5 space-y-6">
              {timeline.map((era) => (
                <div key={era.id} className="relative group">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-black group-hover:scale-125 transition-transform" />
                  <div className="p-3.5 bg-neutral-850 border border-neutral-700/80 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{era.name}</span>
                        <span className="text-[10px] bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded font-mono">
                          {era.year}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono capitalize">
                        {era.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300">{era.mechanism}</p>
                    <p className="text-[11px] text-neutral-400 italic mt-1 font-mono">{era.securityImpact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: XDG DESKTOP PORTALS GATEWAY */}
        {activeTab === 'portals' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">XDG Desktop Portals Gateway</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Modern Linux capability-based access model. Sandboxed applications cannot directly read files, access microphones, or stream webcams. Access is mediated exclusively through trusted desktop portals where the user explicitly chooses what is shared.
              </p>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Recent Portal Requests & Mediation
              </h3>

              {portalRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 bg-neutral-850 border border-neutral-700/80 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      req.status === 'granted' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      <Folder size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>{req.app}</span>
                        <span className="text-[10px] bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded font-mono">
                          org.freedesktop.portal.{req.portal}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-300 mt-0.5">{req.requestedAction}</div>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                    req.status === 'granted' ? 'bg-emerald-600/30 text-emerald-300' : 'bg-rose-600/30 text-rose-300'
                  }`}>
                    {req.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: LANDLOCK LSM & WAYLAND ISOLATION */}
        {activeTab === 'landlock' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">Landlock LSM & Wayland Compositor Isolation</h2>
              <p className="text-xs text-neutral-400 mt-1">
                The newest 2021-2026 frontiers of Linux safety. Landlock enables in-process unprivileged filesystem sandboxing, while Wayland replaces insecure X11 to eliminate cross-window keystroke snooping.
              </p>
            </div>

            <div className="p-4 bg-neutral-850 border border-neutral-700 rounded-3xl space-y-3 text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Lock size={16} className="text-cyan-400" />
                <span>Landlock LSM Filesystem Boundaries:</span>
              </span>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800">
                  <span className="text-emerald-400">READ-ONLY ALLOWED:</span>
                  <div className="text-neutral-300 mt-0.5">/app/{selectedContainer.appId}/runtime, /usr/share/fonts</div>
                </div>
                <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800">
                  <span className="text-blue-400">WRITE ALLOWED (EPHEMERAL):</span>
                  <div className="text-neutral-300 mt-0.5">/tmp/sandbox-storage, /app/cache</div>
                </div>
                <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800">
                  <span className="text-rose-400">STRICTLY BLOCKED:</span>
                  <div className="text-neutral-300 mt-0.5">/home/user, /etc/shadow, /sys/firmware, /proc/kcore</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl text-xs space-y-2">
              <span className="font-bold text-cyan-300 flex items-center gap-2">
                <EyeOff size={16} />
                <span>Wayland Surface Buffer Isolation:</span>
              </span>
              <p className="text-neutral-300 leading-relaxed text-[11px]">
                Under legacy X11, any application could secretly capture keyboard events and record other application windows. Under LibreDroid's Wayland compositor architecture, each window communicates via an isolated memory surface buffer, rendering cross-app keyloggers technically impossible.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
