import React, { useState } from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Trash2, 
  Play, 
  Radio, 
  Lock, 
  Unlock, 
  HardDrive, 
  Share2, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Globe,
  Eye,
  EyeOff,
  Flame,
  FileCode,
  Key,
  Shield,
  Smartphone,
  Terminal,
  Zap,
  ArrowRight,
  WifiOff,
  Cloud,
  Check,
  Copy,
  QrCode,
  Apple
} from 'lucide-react';
import { 
  OsDomainConfig, 
  OsDomainId, 
  InterDomainTransfer,
  MULTI_OS_DOMAINS, 
  INITIAL_INTER_DOMAIN_TRANSFERS,
  generateNewTorCircuit,
  TorCircuitNode
} from '../../services/multiOsHypervisor';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { useSecurity } from '../../context/SecurityContext';
import { AppId } from '../../types/apps';

export const MultiOsHypervisorApp: React.FC = () => {
  const { openApp, purgeDisposableWindows } = useWindow();
  const { addNotification } = useSystem();
  const { isAppNetworkAllowed, toggleAppNetworkAccess } = useSecurity();

  const [activeTab, setActiveTab] = useState<'matrix' | 'domain-detail' | 'launcher' | 'transfers'>('matrix');
  const [domains, setDomains] = useState<OsDomainConfig[]>(MULTI_OS_DOMAINS);
  const [transfers] = useState<InterDomainTransfer[]>(INITIAL_INTER_DOMAIN_TRANSFERS);
  const [selectedDomainId, setSelectedDomainId] = useState<OsDomainId>('vault-airgap');

  // Vault Interactive State
  const [vaultSocketTest, setVaultSocketTest] = useState<string | null>(null);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);

  // Whonix Interactive State
  const [torCircuit, setTorCircuit] = useState<TorCircuitNode[]>(
    domains.find(d => d.id === 'anonymity-whonix')?.details.torCircuit || []
  );
  const [isRotatingTor, setIsRotatingTor] = useState(false);
  const [torLeakResult, setTorLeakResult] = useState<string | null>(null);

  // GrapheneOS Interactive State
  const [grapheneAppsFirewall, setGrapheneAppsFirewall] = useState<Record<string, boolean>>({
    'org.videolan.vlc': true,
    'org.schabi.newpipe': true,
    'net.osmand.plus': false,
    'im.vector.app': true,
    'com.fsck.k9': true,
  });

  // Disposable Alpine Interactive State
  const [detonationTarget, setDetonationTarget] = useState('https://suspicious-tracker-domain.xyz/dropper.sh');
  const [detonationLog, setDetonationLog] = useState<string[]>([]);
  const [isDetonating, setIsDetonating] = useState(false);
  const [isZeroingRam, setIsZeroingRam] = useState(false);
  const [ramWipedStatus, setRamWipedStatus] = useState<string | null>(null);

  // Workstation Interactive State
  const [isNextcloudSyncing, setIsNextcloudSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('2 minutes ago');

  const selectedDomain = domains.find((d) => d.id === selectedDomainId) || domains[0];

  const handleLaunch = (appId: AppId, domainId: OsDomainId) => {
    openApp(appId, undefined, domainId);
    const domain = domains.find((d) => d.id === domainId);
    addNotification({
      appId: 'hypervisor',
      appName: 'Hypervisor Dispatcher',
      title: `App Launched in ${domain?.name}`,
      body: `Isolated in ${domain?.baseOs} container with ${domain?.securityRole}.`,
    });
  };

  // 1. Vault test: Attempt network socket creation
  const handleTestVaultSocket = () => {
    setVaultSocketTest('probing');
    setTimeout(() => {
      setVaultSocketTest('blocked');
    }, 600);
  };

  // 2. Whonix test: Request new Tor Identity (SIGNAL NEWNYM)
  const handleRotateTorIdentity = () => {
    setIsRotatingTor(true);
    setTimeout(() => {
      const newCircuit = generateNewTorCircuit();
      setTorCircuit(newCircuit);
      setIsRotatingTor(false);
      addNotification({
        appId: 'hypervisor',
        appName: 'Whonix Tor Gateway',
        title: 'New Tor Identity Established',
        body: `Rotated circuit through ${newCircuit[0].country} -> ${newCircuit[1].country} -> ${newCircuit[2].country}. Exit IP: ${newCircuit[2].ip}`,
      });
    }, 1200);
  };

  // Whonix IP Leak Check
  const handleCheckTorLeaks = () => {
    setTorLeakResult('testing');
    setTimeout(() => {
      setTorLeakResult(`Real WAN IP: 100% MASKED / UNREACHABLE | Tor Exit IP: ${torCircuit[2]?.ip || '185.220.101.5'} (${torCircuit[2]?.country || 'Switzerland'}) | DNS: 0 Leaks (Port 5300 Tor DNS)`);
    }, 800);
  };

  // 3. GrapheneOS toggle APK network
  const handleToggleApkNetwork = (pkg: string) => {
    setGrapheneAppsFirewall(prev => ({
      ...prev,
      [pkg]: !prev[pkg]
    }));
  };

  // 4. Disposable Alpine detonation
  const handleDetonateTarget = () => {
    if (!detonationTarget.trim()) return;
    setIsDetonating(true);
    setDetonationLog([]);

    const steps = [
      `[Ephemeral VM 0x7FA0] Initializing RAM sandbox at /dev/shm/detonate_tmpfs...`,
      `[Alpine Musl] Downloading target: "${detonationTarget}" in volatile memory...`,
      `[Seccomp-BPF] Intercepted socket connect() call: redirected through honeypot NAT.`,
      `[Static Heuristics] Target payload unpacked: 0 disk persistence hooks detected.`,
      `[Isolation Verification] Host filesystem strictly read-only. 0 host bytes affected.`,
      `[Detonation Complete] Ready to zero-fill and destroy ephemeral microVM.`,
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setDetonationLog(prev => [...prev, step]);
        if (idx === steps.length - 1) {
          setIsDetonating(false);
        }
      }, (idx + 1) * 350);
    });
  };

  // Disposable Alpine Zero-Fill RAM
  const handleZeroFillRam = () => {
    setIsZeroingRam(true);
    setRamWipedStatus(null);
    setTimeout(() => {
      setIsZeroingRam(false);
      setRamWipedStatus('Memory pages zeroed with 0x00 pattern. 128 MB RAM returned to physical pool. 0 residual artifacts remain.');
      addNotification({
        appId: 'hypervisor',
        appName: 'Disposable MicroVM',
        title: 'RAM Overwritten & Sanitized',
        body: 'All volatile pages zero-filled. 100% forensic recovery impossible.',
      });
    }, 1000);
  };

  // 5. Workstation Nextcloud sync
  const handleSyncNextcloud = () => {
    setIsNextcloudSyncing(true);
    setTimeout(() => {
      setIsNextcloudSyncing(false);
      setLastSyncTime('Just now');
      addNotification({
        appId: 'hypervisor',
        appName: 'Debian Workstation',
        title: 'Nextcloud Encrypted Sync Complete',
        body: 'Local LUKS2 vault synchronized with sovereign self-hosted cloud.',
      });
    }, 900);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col md:flex-row bg-neutral-900 text-white select-none overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-neutral-950 p-3 sm:p-4 border-b md:border-b-0 md:border-r border-neutral-800 flex md:flex-col gap-1.5 shrink-0 overflow-x-auto">
        <div className="hidden md:block text-xs font-bold uppercase tracking-wider text-purple-400 px-3 py-2 flex items-center gap-1.5">
          <Layers size={16} />
          <span>Multi-OS Hypervisor</span>
        </div>

        {[
          { id: 'matrix', label: 'Overview Matrix', icon: Layers, badge: '5 OSes' },
          { id: 'domain-detail', label: 'Domain Consoles', icon: Shield, badge: 'Active' },
          { id: 'launcher', label: 'Domain App Launcher', icon: Play },
          { id: 'transfers', label: 'qvm-copy Inter-OS', icon: Share2, badge: transfers.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} />
                <span>{tab.label}</span>
              </div>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-white text-purple-700' : 'bg-neutral-800 text-neutral-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Domain Quick Selectors in Sidebar */}
        <div className="hidden md:block mt-4 pt-3 border-t border-neutral-850 space-y-1">
          <div className="text-[10px] uppercase font-bold text-neutral-500 px-3 py-1">Security Domains</div>
          {domains.map((dom) => (
            <button
              key={dom.id}
              onClick={() => {
                setSelectedDomainId(dom.id);
                setActiveTab('domain-detail');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-colors ${
                selectedDomainId === dom.id && activeTab === 'domain-detail'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dom.colorHex }} />
              <span className="truncate text-left">{dom.badgeLabel}</span>
            </button>
          ))}
        </div>

        <div className="hidden md:block mt-auto pt-4 border-t border-neutral-850">
          <button
            onClick={purgeDisposableWindows}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 rounded-2xl text-xs font-bold transition-colors"
          >
            <Trash2 size={14} />
            <span>Purge Disposable VMs</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* TAB 1: MULTI-OS COMPARTMENT MATRIX */}
        {activeTab === 'matrix' && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium mb-2 border border-purple-500/30">
                <ShieldCheck size={14} />
                <span>Qubes-Style Security by Multi-OS Isolation</span>
              </div>
              <h2 className="text-xl font-bold">5 Specialized Operating System Domains</h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Monolithic operating systems allow any single zero-day compromise to read your cryptographic keys. LibreDroid runs 5 specialized, hardware-isolated operating system domains concurrently.
              </p>
            </div>

            {/* Domains Grid */}
            <div className="space-y-3">
              {domains.map((dom) => (
                <div
                  key={dom.id}
                  onClick={() => {
                    setSelectedDomainId(dom.id);
                    setActiveTab('domain-detail');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedDomainId === dom.id
                      ? `bg-neutral-800 ${dom.colorBorder} ring-1`
                      : 'bg-neutral-850/80 border-neutral-700/80 hover:bg-neutral-800/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow"
                        style={{ backgroundColor: dom.colorHex }}
                      />
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                          <span>{dom.name}</span>
                          <span className="text-[10px] bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded font-mono">
                            {dom.baseOs}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5">{dom.securityRole}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:text-right text-xs font-mono">
                      <span className="text-emerald-400 font-semibold">{dom.status.toUpperCase()}</span>
                      <span className="text-neutral-500">{dom.memoryAllocatedMb} MB RAM</span>
                      <span className="text-purple-400 text-[11px] underline sm:no-underline">Inspect &rarr;</span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 mt-3 pt-2 border-t border-neutral-800/80 leading-relaxed">
                    {dom.technicalGuarantee}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-neutral-400 pt-2 gap-2">
                    <span>Network: <span className="text-purple-300">{dom.networkMode}</span></span>
                    <span>Storage: <span className="text-cyan-300">{dom.persistence}</span></span>
                    <span>vCPUs: <span className="text-emerald-300">{dom.vCpuCores} Cores</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DEEP DOMAIN CONSOLES & INTERACTION */}
        {activeTab === 'domain-detail' && (
          <div className="space-y-6 max-w-3xl">
            {/* Domain Switcher Pill Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {domains.map((dom) => (
                <button
                  key={dom.id}
                  onClick={() => setSelectedDomainId(dom.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedDomainId === dom.id
                      ? 'bg-neutral-800 text-white shadow-md'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                  style={{
                    borderColor: selectedDomainId === dom.id ? dom.colorHex : undefined
                  }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dom.colorHex }} />
                  <span>{dom.badgeLabel}</span>
                </button>
              ))}
            </div>

            {/* DOMAIN 1: 🔵 VAULT (AIR-GAPPED) */}
            {selectedDomainId === 'vault-airgap' && (
              <div className="space-y-5 bg-neutral-850 border border-blue-500/40 rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-700/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center">
                      <Lock size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Air-Gapped Vault OS</span>
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono border border-blue-500/30">
                          seL4 / OpenBSD Pledge
                        </span>
                      </h2>
                      <p className="text-xs text-neutral-400">Master Passwords, Cryptographic Keys, Root Identity</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLaunch('notes', 'vault-airgap')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Play size={13} />
                    <span>Open Joplin Vault</span>
                  </button>
                </div>

                {/* Isabelle Proof & Air-Gap Guarantees */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1.5">
                    <div className="text-[11px] font-mono text-blue-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      <span>Mathematical Verification</span>
                    </div>
                    <div className="text-xs text-white font-medium">Isabelle/HOL Interactive Theorem Prover</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Microkernel is formally proved to be mathematically free of buffer overflows, null-pointer dereferences, and privilege escalations.
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1.5">
                    <div className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                      <WifiOff size={14} />
                      <span>Hardware Network Isolation</span>
                    </div>
                    <div className="text-xs text-white font-medium">0 Network Drivers Loaded</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      PCI pass-through denied. Network stack completely omitted from memory. The vault cannot send or receive network packets under any circumstance.
                    </p>
                  </div>
                </div>

                {/* OpenBSD Pledge Status */}
                <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl font-mono text-xs space-y-2">
                  <div className="text-neutral-400 text-[11px] uppercase tracking-wider font-bold">OpenBSD Syscall Restriction</div>
                  <div className="text-blue-300 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                    pledge("stdio rpath wpath", NULL); // Strictly no "inet", "bpf", or "dns"
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Any thread attempting network socket allocation is terminated instantly by kernel signal <code>SIGKILL</code>.
                  </div>
                </div>

                {/* Live Socket Attack Simulation */}
                <div className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Live Network Attack Simulation</div>
                      <div className="text-[11px] text-neutral-400">Attempt to create a TCP socket from inside the Vault</div>
                    </div>
                    <button
                      onClick={handleTestVaultSocket}
                      disabled={vaultSocketTest === 'probing'}
                      className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      {vaultSocketTest === 'probing' ? 'Testing...' : 'Test Network Socket Probe'}
                    </button>
                  </div>

                  {vaultSocketTest === 'blocked' && (
                    <div className="p-2.5 bg-red-950/40 border border-red-500/40 rounded-xl text-[11px] font-mono text-red-300 flex items-center gap-2 animate-fade-in">
                      <AlertTriangle size={15} className="shrink-0 text-red-400" />
                      <span>syscall: socket(AF_INET, SOCK_STREAM, 0) returned -1 EAFNOSUPPORT (Operation prohibited by seL4 verification proof & pledge promises).</span>
                    </div>
                  )}
                </div>

                {/* Root Keyring & Air-Gapped Optical QR Bridge */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key size={16} className="text-blue-400" />
                      <span className="text-xs font-bold text-white">Air-Gapped Sovereign Keyring</span>
                    </div>
                    <button
                      onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                      className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      {showSeedPhrase ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showSeedPhrase ? 'Hide Root Secrets' : 'Reveal Root Secrets'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex justify-between items-center">
                      <span className="text-neutral-400">Master GPG Fingerprint:</span>
                      <span className="text-blue-300 font-bold">ED25519 0x98A1_C40D_FE31_7942</span>
                    </div>
                    {showSeedPhrase && (
                      <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 animate-fade-in">
                        <div className="text-[11px] text-amber-400 font-bold">BIP-39 24-Word Root Enclave Seed:</div>
                        <p className="text-[11px] text-neutral-300 leading-relaxed select-all">
                          arctic obsidian bunker quantum horizon sovereign cipher citadel anchor fortress vector zero pulse bastion shield dynamic orbit zenith echo vault
                        </p>
                        <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                          <QrCode size={12} />
                          <span>Air-Gapped Optical QR ready: transfer without cables or wireless antennas.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DOMAIN 2: 🟣 WHONIX (TOR ROUTED) */}
            {selectedDomainId === 'anonymity-whonix' && (
              <div className="space-y-5 bg-neutral-850 border border-purple-500/40 rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-700/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center">
                      <Globe size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Whonix Anonymity OS</span>
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono border border-purple-500/30">
                          Tor Gateway VM Isolation
                        </span>
                      </h2>
                      <p className="text-xs text-neutral-400">Private Web Research & Whistleblower Comms</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLaunch('browser', 'anonymity-whonix')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Play size={13} />
                    <span>Launch LibreBrowse Tor</span>
                  </button>
                </div>

                {/* Whonix Tor Architecture Overview */}
                <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs space-y-1.5">
                  <div className="text-purple-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    <span>Two-VM Security Architecture</span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    Whonix consists of two isolated virtual machines: the <strong>Whonix-Gateway ({domains[1].details.torGatewayIp})</strong> which routes all traffic through Tor, and the <strong>Whonix-Workstation ({domains[1].details.torWorkstationIp})</strong> where applications execute. Even if a browser exploit achieves root execution in the workstation, it can never discover your real IP address or hardware MAC.
                  </p>
                </div>

                {/* Live 3-Hop Tor Circuit */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio size={16} className="text-purple-400 animate-pulse" />
                      <span className="text-xs font-bold text-white">Active 3-Hop Onion Circuit</span>
                    </div>
                    <button
                      onClick={handleRotateTorIdentity}
                      disabled={isRotatingTor}
                      className="px-3 py-1 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw size={12} className={isRotatingTor ? 'animate-spin' : ''} />
                      <span>{isRotatingTor ? 'Building Circuit...' : 'New Tor Identity'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                    {torCircuit.map((node, i) => (
                      <div key={i} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                        <div className="text-[10px] uppercase font-bold text-purple-400">
                          {node.type === 'guard' ? '1. Entry Guard' : node.type === 'middle' ? '2. Middle Relay' : '3. Exit Relay'}
                        </div>
                        <div className="text-white font-semibold flex items-center gap-1.5">
                          <span>{node.flag}</span>
                          <span>{node.country}</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">{node.ip}</div>
                        <div className="text-[10px] text-emerald-400">{node.latencyMs} ms latency</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leak Test Simulator */}
                <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Whonix-Check & Leak Verification</div>
                      <div className="text-[11px] text-neutral-400">Verifies Tor stream isolation, DNS integrity & MAC cloaking</div>
                    </div>
                    <button
                      onClick={handleCheckTorLeaks}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold"
                    >
                      Run Leak Audit
                    </button>
                  </div>

                  {torLeakResult && (
                    <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] font-mono text-emerald-300 animate-fade-in">
                      {torLeakResult}
                    </div>
                  )}
                </div>

                {/* Whistleblower Onion Directory */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2">
                  <div className="text-xs font-bold text-neutral-300">Curated Whistleblower & Freedom Services</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { name: 'Freedom of the Press SecureDrop', onion: 'securedrop.onion', desc: 'Encrypted document dropbox for sources' },
                      { name: 'ProPublica Onion Portal', onion: 'propub3r6bdkg...onion', desc: 'Investigative journalism leak line' },
                      { name: 'The Tor Project Repository', onion: '2gzyxa5ihm7...onion', desc: 'Official signed onion mirrors' },
                      { name: 'DuckDuckGo Onion Search', onion: 'duckduckgogg42xj...onion', desc: 'Zero-log search engine' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-850 flex flex-col justify-between">
                        <div>
                          <div className="font-semibold text-purple-300 text-xs">{item.name}</div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">{item.desc}</div>
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500 mt-1 truncate">{item.onion}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DOMAIN 3: 🟡 GRAPHENEOS ANDROID */}
            {selectedDomainId === 'hardened-android' && (
              <div className="space-y-5 bg-neutral-850 border border-amber-500/40 rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-700/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                      <Smartphone size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>GrapheneOS Android Subsystem</span>
                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/30">
                          Hardened AOSP 15 + SELinux
                        </span>
                      </h2>
                      <p className="text-xs text-neutral-400">Untrusted Android APK Execution (.apk)</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLaunch('apk_installer', 'hardened-android')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Play size={13} />
                    <span>Install & Run APK</span>
                  </button>
                </div>

                {/* Hardened Malloc & MTE Telemetry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1.5">
                    <div className="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1.5">
                      <Zap size={14} />
                      <span>Hardened Memory Allocator</span>
                    </div>
                    <div className="text-xs text-white font-medium">hardened_malloc + Guard Pages</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Slab randomization, canary byte verification, out-of-line metadata, and synchronous memory zeroing on free neutralize heap exploits.
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1.5">
                    <div className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      <span>Sandboxed microG Compatibility</span>
                    </div>
                    <div className="text-xs text-white font-medium">0 Privileged Signature Spoofing</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Google Play Services compatibility runs strictly as an unprivileged, sandboxed app without root or special system hooks.
                    </p>
                  </div>
                </div>

                {/* Per-App Network Firewall Toggles */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Per-App Network Permission Firewall</div>
                      <div className="text-[11px] text-neutral-400">Revoke raw socket & INTERNET permission per APK</div>
                    </div>
                    <span className="text-[10px] font-mono bg-neutral-800 text-amber-300 px-2 py-0.5 rounded">
                      SELinux Enforcing
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { pkg: 'org.videolan.vlc', name: 'VLC Media Player', desc: 'Offline media playback' },
                      { pkg: 'org.schabi.newpipe', name: 'NewPipe Streaming', desc: 'Private YouTube client' },
                      { pkg: 'net.osmand.plus', name: 'OsmAnd+ Maps', desc: 'Offline vector navigation' },
                      { pkg: 'im.vector.app', name: 'Element Messenger', desc: 'Matrix encrypted communications' },
                      { pkg: 'com.fsck.k9', name: 'K-9 Mail', desc: 'Open source email client' },
                    ].map((app) => {
                      const isAllowed = grapheneAppsFirewall[app.pkg] ?? true;
                      return (
                        <div
                          key={app.pkg}
                          className="flex items-center justify-between p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs"
                        >
                          <div>
                            <div className="font-semibold text-white">{app.name}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">{app.pkg} &bull; {app.desc}</div>
                          </div>
                          <button
                            onClick={() => handleToggleApkNetwork(app.pkg)}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                              isAllowed
                                ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/40'
                                : 'bg-red-900/40 text-red-300 border border-red-500/40'
                            }`}
                          >
                            {isAllowed ? 'NET: ALLOWED' : 'NET: BLOCKED'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* DOMAIN 4: 🔴 DISPOSABLE VM (RAM ONLY) */}
            {selectedDomainId === 'disposable-alpine' && (
              <div className="space-y-5 bg-neutral-850 border border-red-500/40 rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-700/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center">
                      <Flame size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Disposable Ephemeral MicroVM</span>
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-mono border border-red-500/30">
                          Alpine Linux / RAM Only
                        </span>
                      </h2>
                      <p className="text-xs text-neutral-400">Untrusted Downloads, Suspicious Files, Unknown URLs</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLaunch('terminal', 'disposable-alpine')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Play size={13} />
                    <span>Launch RAM Shell</span>
                  </button>
                </div>

                {/* 100% Volatile RAM Execution Meter */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Volatile Memory Pool (/dev/shm tmpfs):</span>
                    <span className="text-red-400 font-bold">128 MB / 512 MB (0 Bytes on Disk)</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div className="w-1/4 h-full bg-red-500 rounded-full animate-pulse" />
                  </div>
                  <p className="text-[11px] text-neutral-400 pt-1">
                    Operating system kernel, root filesystem, and downloaded payloads run 100% in volatile RAM. <strong>When this window closes, all data vanishes forever.</strong>
                  </p>
                </div>

                {/* Suspicious URL & Malware Detonation Chamber */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-white">Untrusted URL & Binary Detonation Chamber</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={detonationTarget}
                      onChange={(e) => setDetonationTarget(e.target.value)}
                      placeholder="Paste suspicious URL or file name..."
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                    />
                    <button
                      onClick={handleDetonateTarget}
                      disabled={isDetonating}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
                    >
                      {isDetonating ? 'Detonating in RAM...' : 'Detonate in MicroVM'}
                    </button>
                  </div>

                  {detonationLog.length > 0 && (
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-[11px] text-neutral-300 space-y-1">
                      {detonationLog.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span className="text-red-400">&gt;</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Instant Zero-Fill RAM Action */}
                <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">Forensic Memory Zero-Fill Sanitizer</div>
                    <div className="text-[11px] text-neutral-400">Overwrites all RAM blocks allocated to this microVM with 0x00 zeroes</div>
                  </div>
                  <button
                    onClick={handleZeroFillRam}
                    disabled={isZeroingRam}
                    className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-lg"
                  >
                    {isZeroingRam ? 'Sanitizing Pages...' : 'Wipe VM & Zero-Fill RAM'}
                  </button>
                </div>

                {ramWipedStatus && (
                  <div className="p-3 bg-neutral-950 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>{ramWipedStatus}</span>
                  </div>
                )}
              </div>
            )}

            {/* DOMAIN 5: 🟢 WORKSTATION OS (DEBIAN 12) */}
            {selectedDomainId === 'workstation-debian' && (
              <div className="space-y-5 bg-neutral-850 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-700/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                      <Server size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Debian Workstation OS</span>
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-500/30">
                          Debian 12 Bookworm + LUKS2
                        </span>
                      </h2>
                      <p className="text-xs text-neutral-400">Everyday Office Work, Documents, Nextcloud Sync</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLaunch('files', 'workstation-debian')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Play size={13} />
                    <span>Open Nextcloud Files</span>
                  </button>
                </div>

                {/* Persistent LUKS2 Volume Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1.5">
                    <div className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                      <HardDrive size={14} />
                      <span>Encrypted Persistent Storage</span>
                    </div>
                    <div className="text-xs text-white font-medium">LUKS2 / AES-256-XTS + Argon2id</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      512-bit cipher key derivation protects office documents, local code repos, and configuration state against physical theft.
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1.5">
                    <div className="text-[11px] font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                      <Cloud size={14} />
                      <span>Self-Hosted Nextcloud Sync</span>
                    </div>
                    <div className="text-xs text-white font-medium">14.8 GB / 100 GB Encrypted Storage</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Zero-knowledge client-side encryption. Completely independent of Google Drive and corporate cloud lock-in.
                    </p>
                  </div>
                </div>

                {/* Nextcloud Live Sync Panel */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Nextcloud End-to-End Encrypted Sync</div>
                      <div className="text-[11px] text-neutral-400">Last synchronized: {lastSyncTime}</div>
                    </div>
                    <button
                      onClick={handleSyncNextcloud}
                      disabled={isNextcloudSyncing}
                      className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw size={13} className={isNextcloudSyncing ? 'animate-spin' : ''} />
                      <span>{isNextcloudSyncing ? 'Synchronizing...' : 'Sync Vault Now'}</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-850 flex justify-between items-center">
                      <span className="text-neutral-400">Server Endpoint:</span>
                      <span className="text-emerald-300">https://cloud.libredroid.internal</span>
                    </div>
                    <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-850 flex justify-between items-center">
                      <span className="text-neutral-400">APT Package Archive:</span>
                      <span className="text-neutral-300">deb.debian.org (GPG Signed 2026)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOMAIN 6: 🍎 APPLE DARWIN / COCOATOUCH BRIDGE */}
            {selectedDomainId === 'darwin-apple' && (
              <div className="space-y-5 bg-neutral-850 border border-rose-500/40 rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-700/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                      <Apple size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Apple Darwin / CocoaTouch Bridge</span>
                        <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono border border-rose-500/30">
                          Darwin 23.4 (XNU) + touchHLE
                        </span>
                      </h2>
                      <p className="text-xs text-neutral-400">iOS & macOS Application Binary Translation & Cocoa Sandbox</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLaunch('darwin_bridge', 'darwin-apple')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Play size={13} />
                    <span>Open Darwin Bridge</span>
                  </button>
                </div>

                {/* Darwin Emulation Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1.5">
                    <div className="text-[11px] font-mono text-rose-400 font-bold flex items-center gap-1.5">
                      <Cpu size={14} />
                      <span>Mach-O Binary Translation</span>
                    </div>
                    <div className="text-xs text-white font-medium">99.4% Native ARM64 Passthrough</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Zero-overhead ARM64 execution on compatible hardware; JIT translation dynamic linking for x86_64 host kernels.
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1.5">
                    <div className="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1.5">
                      <Zap size={14} />
                      <span>Metal-to-Vulkan Shader Pipeline</span>
                    </div>
                    <div className="text-xs text-white font-medium">MoltenVK / ANGLE SPIR-V Active</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Compiles Apple Metal MSL shaders into Vulkan SPIR-V with hardware desktop GPU acceleration.
                    </p>
                  </div>
                </div>

                {/* Sideloaded Apple Apps Status */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Active Cocoa Dylibs & Frameworks</span>
                    <span className="text-rose-400 font-mono">48 Frameworks Loaded</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                    {['UIKit.framework', 'Foundation.framework', 'Metal.framework', 'CoreGraphics.framework', 'AVFoundation.framework', 'Security.framework'].map((fw) => (
                      <div key={fw} className="p-2 bg-neutral-950 rounded-lg border border-neutral-800 text-neutral-300 flex items-center justify-between">
                        <span className="truncate">{fw}</span>
                        <span className="text-emerald-400 text-[10px]">OK</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DOMAIN APP LAUNCHER */}
        {activeTab === 'launcher' && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold">Launch Apps in Specialized Security OSes</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Choose the operating system domain with the appropriate security profile for your current task.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  appId: 'browser' as AppId,
                  appName: 'LibreBrowse Tor Edition',
                  domainId: 'anonymity-whonix' as OsDomainId,
                  domainName: 'Whonix Tor Gateway OS',
                  color: 'border-purple-500 text-purple-300',
                  desc: 'All web traffic routed through 3-hop Tor relays. Protects real IP.',
                },
                {
                  appId: 'notes' as AppId,
                  appName: 'Joplin Passwords & Vault',
                  domainId: 'vault-airgap' as OsDomainId,
                  domainName: 'seL4 Air-Gapped Vault OS',
                  color: 'border-blue-500 text-blue-300',
                  desc: 'Formally verified microkernel with zero network drivers. Master secrets.',
                },
                {
                  appId: 'terminal' as AppId,
                  appName: 'Disposable Alpine Shell',
                  domainId: 'disposable-alpine' as OsDomainId,
                  domainName: 'Disposable Ephemeral MicroVM',
                  color: 'border-red-500 text-red-300',
                  desc: 'RAM-only VM. Entire OS is wiped immediately when window is closed.',
                },
                {
                  appId: 'apk_installer' as AppId,
                  appName: 'Untrusted Android APK Sandbox',
                  domainId: 'hardened-android' as OsDomainId,
                  domainName: 'GrapheneOS Android Container',
                  color: 'border-amber-500 text-amber-300',
                  desc: 'SELinux enforcing, memory tagged AOSP container with microG.',
                },
                {
                  appId: 'files' as AppId,
                  appName: 'Nextcloud Work Files',
                  domainId: 'workstation-debian' as OsDomainId,
                  domainName: 'Debian Workstation OS',
                  color: 'border-emerald-500 text-emerald-300',
                  desc: 'Persistent encrypted storage for everyday office and document work.',
                },
                {
                  appId: 'darwin_bridge' as AppId,
                  appName: 'Apple Darwin CocoaTouch Bridge',
                  domainId: 'darwin-apple' as OsDomainId,
                  domainName: 'Apple Darwin (Cocoa)',
                  color: 'border-rose-500 text-rose-300',
                  desc: 'Run native iOS (.ipa) and macOS (.app) binaries using Mach-O translation.',
                },
              ].map((item) => (
                <div
                  key={item.appId + item.domainId}
                  className="p-4 bg-neutral-850 border border-neutral-700 rounded-2xl flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{item.appName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono border ${item.color}`}>
                        {item.domainName.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">{item.desc}</p>
                  </div>

                  <button
                    onClick={() => handleLaunch(item.appId, item.domainId)}
                    className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Play size={13} />
                    <span>Launch in {item.domainName.split(' ')[0]}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: QVM-COPY INTER-OS BRIDGE */}
        {activeTab === 'transfers' && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-medium mb-2 border border-cyan-500/30">
                <Share2 size={14} />
                <span>Qubes Inter-Domain RPC Protocol (qvm-copy)</span>
              </div>
              <h2 className="text-lg font-bold">Inter-OS Sanitized Bridge & Clipboard</h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Operating systems are strictly isolated. No domain can access the clipboard or files of another domain without passing through cryptographic serialization and explicit user consent.
              </p>
            </div>

            <div className="space-y-3">
              {transfers.map((tx) => (
                <div
                  key={tx.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    tx.status === 'quarantined'
                      ? 'bg-red-950/20 border-red-500/40 text-red-200'
                      : 'bg-neutral-850 border-neutral-750 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{tx.sourceDomain}</span>
                      <ArrowRight size={12} className="text-neutral-500" />
                      <span className="text-white font-bold">{tx.targetDomain}</span>
                      <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded uppercase">
                        {tx.type}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tx.status === 'quarantined'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {tx.status === 'quarantined' ? 'BLOCKED & LOGGED' : 'AUDITED & ALLOWED'}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 mt-2">{tx.summary}</p>
                  <div className="text-[10px] text-neutral-500 mt-1 font-mono">{tx.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
