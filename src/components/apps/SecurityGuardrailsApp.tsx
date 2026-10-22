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
  Power,
  Apple,
  Layers,
  Key,
  Flame,
  FileCheck2,
  Bug,
  Eye,
  Crosshair
} from 'lucide-react';
import { 
  SecurityGuardrail, 
  AppPermissionRule, 
  CORE_GUARDRAILS, 
  DEFAULT_APP_RULES 
} from '../../services/securityGuardrailsEngine';
import { 
  PENETRATION_TEST_VECTORS, 
  PenetrationTestVector 
} from '../../services/hardenedSecurityEngine';
import { useSecurity } from '../../context/SecurityContext';
import { useSystem } from '../../context/SystemContext';

export const SecurityGuardrailsApp: React.FC = () => {
  const { addNotification } = useSystem();
  const {
    cameraKillswitch,
    setCameraKillswitch,
    micKillswitch,
    setMicKillswitch,
    locationKillswitch,
    setLocationKillswitch,
    usbDataLock,
    setUsbDataLock,
    appleStack,
    linuxStack,
    auditLogs,
    toggleAppleLockdownMode,
    updateAppleFeature,
    setSelinuxMode,
    updateLinuxFeature,
    toggleSysctlParameter,
    executePenetrationTest,
    clearAuditLogs,
    blockedNetworkApps,
    toggleAppNetworkAccess,
  } = useSecurity();

  const [activeTab, setActiveTab] = useState<'apple_hardened' | 'linux_hardened' | 'pentest' | 'guardrails' | 'killswitches' | 'audit'>('apple_hardened');
  const [guardrails, setGuardrails] = useState<SecurityGuardrail[]>(CORE_GUARDRAILS);
  const [appRules, setAppRules] = useState<AppPermissionRule[]>(DEFAULT_APP_RULES);
  const [activeTestingId, setActiveTestingId] = useState<string | null>(null);

  const handleRunPenetrationTest = (attackId: string) => {
    setActiveTestingId(attackId);
    setTimeout(() => {
      executePenetrationTest(attackId);
      setActiveTestingId(null);
    }, 700);
  };

  const triggerEmergencyLockdown = () => {
    setMicKillswitch(true);
    setCameraKillswitch(true);
    setLocationKillswitch(true);
    setUsbDataLock(true);
    if (!appleStack.lockdownMode) {
      toggleAppleLockdownMode();
    }
    setSelinuxMode('enforcing');

    addNotification({
      appId: 'security',
      appName: 'Emergency Panic Protocol',
      title: 'Full Apple & Linux Fortress Lockdown Engaged',
      body: 'Hardware killswitches cut, USB data bus isolated, WebKit JIT disabled, SELinux enforcing.',
    });
  };

  const activeCount = guardrails.filter((g) => g.status === 'active').length;

  return (
    <div className="flex-1 w-full h-full flex flex-col sm:flex-row bg-neutral-900 text-white select-none overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <div className="w-full sm:w-64 bg-neutral-950 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-neutral-800 flex sm:flex-col gap-1.5 shrink-0 overflow-x-auto">
        <div className="hidden sm:block text-xs font-bold uppercase tracking-wider text-emerald-400 px-3 py-2 flex items-center gap-1.5">
          <ShieldCheck size={16} />
          <span>Hardened Defense OS</span>
        </div>

        {[
          { id: 'apple_hardened', label: 'Apple Hardened OS', icon: Apple, badge: appleStack.lockdownMode ? 'LOCKDOWN' : 'SECURE' },
          { id: 'linux_hardened', label: 'Linux Hardened Kernel', icon: Terminal, badge: linuxStack.selinuxMode.toUpperCase() },
          { id: 'pentest', label: 'Threat & PenTest Lab', icon: Crosshair, badge: 'SIMULATOR' },
          { id: 'guardrails', label: 'Core Guardrails', icon: Layers, badge: `${activeCount}/${guardrails.length}` },
          { id: 'killswitches', label: 'Hardware Killswitches', icon: Power, badge: usbDataLock ? 'USB LOCKED' : undefined },
          { id: 'audit', label: 'Audit & Intercept Logs', icon: ShieldAlert, badge: auditLogs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} />
                <span>{tab.label}</span>
              </div>
              {tab.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold tracking-tight ${
                  isActive 
                    ? 'bg-white text-emerald-800' 
                    : tab.badge === 'LOCKDOWN'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-neutral-800 text-neutral-300'
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
        {/* ================================================================ */}
        {/* TAB 1: APPLE HARDENED OS (Lockdown Mode, BlastDoor, Gatekeeper, SEP) */}
        {/* ================================================================ */}
        {activeTab === 'apple_hardened' && (
          <div className="space-y-6 max-w-3xl">
            {/* Header Banner */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Apple size={20} className="text-neutral-200" />
                  <span>Apple Hardened OS Architecture</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Integrates Apple's extreme defense stack: Lockdown Mode, BlastDoor zero-click sandbox, Hardened Runtime, Gatekeeper notarization, and Secure Enclave (SEP).
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                appleStack.lockdownMode 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-900/40 shadow-sm' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {appleStack.lockdownMode ? 'Lockdown Mode Active' : 'Hardened Runtime'}
              </span>
            </div>

            {/* Apple Lockdown Mode Master Card */}
            <div className={`p-5 rounded-3xl border transition-all ${
              appleStack.lockdownMode 
                ? 'bg-gradient-to-b from-rose-950/40 to-neutral-900 border-rose-500/50 shadow-xl' 
                : 'bg-neutral-950 border-neutral-800'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Flame className={`w-5 h-5 ${appleStack.lockdownMode ? 'text-rose-400 animate-pulse' : 'text-neutral-400'}`} />
                    <h3 className="text-base font-bold text-white">Apple Lockdown Mode</h3>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed max-w-xl">
                    Extreme, optional protection designed for individuals who might be personally targeted by sophisticated digital threats like Pegasus and N-day zero-click exploits.
                  </p>
                </div>

                <button
                  onClick={toggleAppleLockdownMode}
                  className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 shrink-0 ${
                    appleStack.lockdownMode
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                  }`}
                >
                  <Lock size={14} />
                  <span>{appleStack.lockdownMode ? 'Disable Lockdown' : 'Turn On Lockdown Mode'}</span>
                </button>
              </div>

              {/* Lockdown Mode Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 mt-4 border-t border-neutral-800/80 text-xs">
                <div className="p-3 rounded-2xl bg-black/40 border border-neutral-800">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                    <Zap size={14} />
                    <span>JIT Engine Stripped</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    WebKit JavaScript JIT compilation is completely disabled, neutralizing 80% of browser heap-spray vulnerabilities.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-neutral-800">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
                    <ShieldCheck size={14} />
                    <span>BlastDoor Sandbox</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Incoming message attachments, PDFs, and fonts are parsed in an isolated, non-executable Mach task with zero syscall rights.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-neutral-800">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5 mb-1">
                    <Power size={14} />
                    <span>Wired Bus Severed</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Lightning & USB data connections are completely severed when the device is locked, defeating forensic hardware extractors.
                  </p>
                </div>
              </div>
            </div>

            {/* Subsystem Protections Matrix */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider">
                Apple Silicon & OS Security Primitives
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: 'blastDoorSandboxing' as const,
                    name: 'BlastDoor Message & Media Decoder',
                    desc: 'Zero-click exploit isolation. Evaluates all incoming image streams (JBIG2, HEIC, TIFF, PNG) inside a memory-isolated Mach container.',
                    icon: ShieldCheck,
                    active: appleStack.blastDoorSandboxing,
                  },
                  {
                    key: 'pointerAuthentication' as const,
                    name: 'Pointer Authentication Codes (ARM64 PAC)',
                    desc: 'Signs and validates return addresses and function pointers with cryptographic hashes to block ROP/JOP execution hijacks.',
                    icon: Key,
                    active: appleStack.pointerAuthentication,
                  },
                  {
                    key: 'wxMemoryProtection' as const,
                    name: 'Strict W^X (Write XOR Execute)',
                    desc: 'Memory pages can be writable or executable, but never both. Dynamic shellcode injection is trapped immediately with SIGKILL.',
                    icon: Lock,
                    active: appleStack.wxMemoryProtection,
                  },
                  {
                    key: 'gatekeeperNotarization' as const,
                    name: 'Gatekeeper & CloudKit Notarization',
                    desc: 'Enforces cryptographic developer ID signatures and notarization tickets before any Mach-O binary or IPA package executes.',
                    icon: FileCheck2,
                    active: appleStack.gatekeeperNotarization,
                  },
                  {
                    key: 'secureEnclaveProcessor' as const,
                    name: 'Secure Enclave Processor (SEP) Emulation',
                    desc: 'Hardware-isolated coprocessor for biometric authentication and AES-256 master key storage with hardware anti-replay counters.',
                    icon: Cpu,
                    active: appleStack.secureEnclaveProcessor,
                  },
                  {
                    key: 'signedSystemVolume' as const,
                    name: 'Signed System Volume (SSV) Sealed Snapshots',
                    desc: 'APFS cryptographic Merkle-tree verification of the OS root filesystem. Tampering or rooting results in immediate panic and rollback.',
                    icon: HardDrive,
                    active: appleStack.signedSystemVolume,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-neutral-900 text-emerald-400 border border-neutral-800 shrink-0 mt-0.5">
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{item.name}</div>
                          <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => updateAppleFeature(item.key, !item.active)}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                          item.active ? 'bg-emerald-600' : 'bg-neutral-800'
                        }`}
                        title="Toggle protection"
                      >
                        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                          item.active ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: LINUX HARDENED KERNEL (SELinux, KSPP, Landlock, Seccomp) */}
        {/* ================================================================ */}
        {activeTab === 'linux_hardened' && (
          <div className="space-y-6 max-w-3xl">
            {/* Header Banner */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Terminal size={20} className="text-cyan-400" />
                  <span>Linux Hardened Kernel Architecture</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Enforces SELinux Mandatory Access Control, Kernel Self-Protection Project (KSPP) sysctl parameters, Landlock LSM filesystem sandboxing, and Seccomp-BPF syscall whitelisting.
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                linuxStack.selinuxMode === 'enforcing'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                SELinux: {linuxStack.selinuxMode.toUpperCase()}
              </span>
            </div>

            {/* SELinux Mode Selector */}
            <div className="p-5 rounded-3xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">SELinux Policy Enforcement Mode</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Controls Multi-Category Security (MCS) labels and strict Type Transitions.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-2xl border border-neutral-800">
                  {(['enforcing', 'permissive', 'disabled'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelinuxMode(mode)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-all ${
                        linuxStack.selinuxMode === mode
                          ? mode === 'enforcing'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-amber-600 text-white shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Linux Primitives Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  key: 'landlockLsm' as const,
                  name: 'Landlock LSM Unprivileged Sandboxing',
                  desc: 'Linux Security Module allowing unprivileged apps to strictly confine their own filesystem access, hiding /etc, /proc, and /sys entirely.',
                  active: linuxStack.landlockLsm,
                },
                {
                  key: 'seccompBpfWhitelist' as const,
                  name: 'Seccomp-BPF Syscall Filtering',
                  desc: 'Whitelist policy blocking 380+ dangerous system calls (ptrace, kexec_load, process_vm_writev, raw sockets) from sandboxed processes.',
                  active: linuxStack.seccompBpfWhitelist,
                },
                {
                  key: 'hardenedMalloc' as const,
                  name: 'Hardened Memory Allocator (GrapheneOS style)',
                  desc: 'Zero-on-free memory purging, metadata randomization, and guard pages preventing use-after-free and heap-overflow exploitation.',
                  active: linuxStack.hardenedMalloc,
                },
                {
                  key: 'bubblewrapNamespaces' as const,
                  name: 'Bubblewrap Ephemeral Mount Namespaces',
                  desc: 'Every app executes in private mount and PID namespaces with an isolated tmpfs /tmp, preventing cross-app process inspection.',
                  active: linuxStack.bubblewrapNamespaces,
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${item.active ? 'bg-cyan-400' : 'bg-neutral-600'}`} />
                      <span>{item.name}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">{item.desc}</p>
                  </div>

                  <button
                    onClick={() => updateLinuxFeature(item.key, !item.active)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                      item.active ? 'bg-cyan-600' : 'bg-neutral-800'
                    }`}
                  >
                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      item.active ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            {/* Kernel Self-Protection Project (KSPP) Sysctl Matrix */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider">
                  Kernel Self-Protection Project (KSPP) Sysctl Registry
                </h3>
                <span className="text-[11px] font-mono text-emerald-400">9/9 Parameters Hardened</span>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-850">
                {Object.entries(linuxStack.sysctlParameters).map(([key, param]) => (
                  <div key={key} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-300">{key}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-750 text-neutral-300">
                          = {param.value}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">{param.description}</p>
                    </div>

                    <button
                      onClick={() => toggleSysctlParameter(key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                        param.isHardened
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
                      }`}
                    >
                      {param.isHardened ? 'STRICT' : 'STANDARD'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: THREAT & PENETRATION TEST LAB (Live Exploit Simulator) */}
        {/* ================================================================ */}
        {activeTab === 'pentest' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Crosshair size={20} className="text-rose-400" />
                <span>Exploit Penetration Test Laboratory</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Trigger real-world attack vectors against LibreDroid's defenses to inspect how the Apple Lockdown Mode and Linux Kernel layers coordinate to intercept, isolate, and neutralize threats.
              </p>
            </div>

            <div className="space-y-3">
              {PENETRATION_TEST_VECTORS.map((vector) => {
                const isTesting = activeTestingId === vector.id;
                return (
                  <div
                    key={vector.id}
                    className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{vector.name}</h3>
                          {vector.cveReference && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {vector.cveReference}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{vector.attackVector}</p>
                      </div>

                      <button
                        onClick={() => handleRunPenetrationTest(vector.id)}
                        disabled={isTesting}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow ${
                          isTesting 
                            ? 'bg-amber-600 text-white cursor-wait animate-pulse' 
                            : 'bg-rose-600 hover:bg-rose-500 text-white active:scale-95'
                        }`}
                      >
                        <Zap size={14} />
                        <span>{isTesting ? 'Injecting Attack...' : 'Simulate Exploit'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-neutral-850 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <div className="font-bold text-neutral-200 flex items-center gap-1 mb-0.5">
                          <Apple size={12} className="text-neutral-400" />
                          <span>Apple Defense Response:</span>
                        </div>
                        <p className="text-neutral-400 leading-normal">{vector.appleDefense}</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <div className="font-bold text-cyan-300 flex items-center gap-1 mb-0.5">
                          <Terminal size={12} className="text-cyan-400" />
                          <span>Linux Defense Response:</span>
                        </div>
                        <p className="text-neutral-400 leading-normal">{vector.linuxDefense}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 4: CORE GUARDRAILS MATRIX */}
        {/* ================================================================ */}
        {activeTab === 'guardrails' && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Hardened OS Guardrails</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Active cryptographic protections, hardware isolation, and anti-surveillance mitigations.
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {activeCount} Active Subsystems
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guardrails.map((rail) => (
                <div
                  key={rail.id}
                  className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{rail.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {rail.enforcementLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">{rail.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 5: HARDWARE KILLSWITCHES & EMERGENCY PANIC */}
        {/* ================================================================ */}
        {activeTab === 'killswitches' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold">Hardware Killswitches & Physical Isolation</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Directly severs power to hardware buses and locks data pins at the physical level.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: 'camera',
                  label: 'Camera Sensor Bus',
                  desc: 'Physically severs CSI/MIPI camera sensor bus power.',
                  icon: Camera,
                  disabledIcon: CameraOff,
                  isCut: cameraKillswitch,
                  toggle: () => setCameraKillswitch((prev) => !prev),
                },
                {
                  id: 'mic',
                  label: 'Microphone ADC Array',
                  desc: 'Cuts microphone bias voltage, rendering acoustic eavesdropping impossible.',
                  icon: Mic,
                  disabledIcon: MicOff,
                  isCut: micKillswitch,
                  toggle: () => setMicKillswitch((prev) => !prev),
                },
                {
                  id: 'location',
                  label: 'GNSS Satellite Baseband',
                  desc: 'Disables GPS/GLONASS/Galileo hardware radio receiver entirely.',
                  icon: MapPin,
                  disabledIcon: Radio,
                  isCut: locationKillswitch,
                  toggle: () => setLocationKillswitch((prev) => !prev),
                },
                {
                  id: 'usb',
                  label: 'USB Data Pins Isolation',
                  desc: 'Disconnects USB D+/D- and SuperSpeed pins when locked, neutralizing BadUSB & JuiceJacking.',
                  icon: Unlock,
                  disabledIcon: Lock,
                  isCut: usbDataLock,
                  toggle: () => setUsbDataLock((prev) => !prev),
                },
              ].map((sw) => {
                const Icon = sw.isCut ? sw.disabledIcon : sw.icon;
                return (
                  <div
                    key={sw.id}
                    className={`p-4 rounded-3xl border transition-all ${
                      sw.isCut
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : 'bg-neutral-950 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-3 rounded-2xl ${
                        sw.isCut ? 'bg-rose-600/30 text-rose-400' : 'bg-neutral-900 text-neutral-400'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <button
                        onClick={sw.toggle}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          sw.isCut
                            ? 'bg-rose-600 text-white shadow-lg'
                            : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {sw.isCut ? 'HARDWARE CUT' : 'CONNECTED'}
                      </button>
                    </div>

                    <div className="text-sm font-bold text-white">{sw.label}</div>
                    <p className="text-xs text-neutral-400 mt-1">{sw.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Emergency Panic Protocol Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-950/50 via-neutral-950 to-neutral-950 border border-rose-500/40 space-y-3">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
                <AlertTriangle size={18} />
                <span>Emergency Panic Protocol</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Immediately turns on Apple Lockdown Mode, forces SELinux into Strict Enforcing, severs all 4 hardware buses, flushes ephemeral RAM keys, and drops active network routes.
              </p>
              <button
                onClick={triggerEmergencyLockdown}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xl transition-all flex items-center gap-2"
              >
                <Power size={14} />
                <span>Execute Total Panic Lockdown</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 6: AUDIT & INTERCEPT LOGS */}
        {/* ================================================================ */}
        {activeTab === 'audit' && (
          <div className="space-y-5 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Trapped Threats & Audit Trail</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Real-time cryptographic forensic log recording attacks dropped by BlastDoor, Lockdown Mode JIT blockers, SELinux, and Seccomp-BPF filters.
                </p>
              </div>

              {auditLogs.length > 0 && (
                <button
                  onClick={clearAuditLogs}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-xs font-semibold text-neutral-300 transition-colors"
                >
                  Clear Log
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                      <span>{log.attackName}</span>
                    </span>
                    <span className="text-neutral-500 font-mono text-[11px]">{log.timestamp}</span>
                  </div>

                  <p className="text-xs text-neutral-300 font-mono leading-relaxed">{log.forensicSummary}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-850 text-[11px] font-mono">
                    <span className="text-cyan-400">Target Process: {log.processName}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Neutralized by: {log.interceptedBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
