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
  Server
} from 'lucide-react';
import { 
  OsDomainConfig, 
  OsDomainId, 
  InterDomainTransfer,
  MULTI_OS_DOMAINS, 
  INITIAL_INTER_DOMAIN_TRANSFERS 
} from '../../services/multiOsHypervisor';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { AppId } from '../../types/apps';

export const MultiOsHypervisorApp: React.FC = () => {
  const { openApp, purgeDisposableWindows } = useWindow();
  const { addNotification } = useSystem();
  const [activeTab, setActiveTab] = useState<'matrix' | 'launcher' | 'transfers'>('matrix');
  const [domains, setDomains] = useState<OsDomainConfig[]>(MULTI_OS_DOMAINS);
  const [transfers] = useState<InterDomainTransfer[]>(INITIAL_INTER_DOMAIN_TRANSFERS);
  const [selectedDomain, setSelectedDomain] = useState<OsDomainId>('vault-airgap');

  const activeDomainConfig = domains.find((d) => d.id === selectedDomain) || domains[0];

  const handleLaunch = (appId: AppId, domainId: OsDomainId) => {
    openApp(appId, undefined, domainId);
    const domain = domains.find((d) => d.id === domainId);
    addNotification({
      appId: 'hypervisor',
      appName: 'Hypervisor Dispatcher',
      title: `App Launched in ${domain?.name}`,
      body: `Isolated in hardware container with ${domain?.securityRole}.`,
    });
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col sm:flex-row bg-neutral-900 text-white select-none overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-full sm:w-60 bg-neutral-950 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-neutral-800 flex sm:flex-col gap-1.5 shrink-0 overflow-x-auto">
        <div className="hidden sm:block text-xs font-bold uppercase tracking-wider text-purple-400 px-3 py-2 flex items-center gap-1.5">
          <Layers size={16} />
          <span>Multi-OS Hypervisor</span>
        </div>

        {[
          { id: 'matrix', label: 'Multi-OS Compartments', icon: Layers, badge: '5 OSes' },
          { id: 'launcher', label: 'Domain App Launcher', icon: Play },
          { id: 'transfers', label: 'qvm-copy Inter-OS Bridge', icon: Share2, badge: transfers.length },
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

        <div className="hidden sm:block mt-auto pt-4 border-t border-neutral-850">
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
          <div className="space-y-5 max-w-2xl">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium mb-2 border border-purple-500/30">
                <ShieldCheck size={14} />
                <span>Qubes-Style Security by Compartmentalization</span>
              </div>
              <h2 className="text-xl font-bold">Multiple Operating Systems Matrix</h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Rather than trusting a single monolithic OS with all tasks, LibreDroid runs 5 specialized operating system micro-domains simultaneously. Compromise in one domain (e.g. browser in Whonix) cannot compromise other domains (e.g. seL4 Vault).
              </p>
            </div>

            {/* Domains Grid */}
            <div className="space-y-3">
              {domains.map((dom) => (
                <div
                  key={dom.id}
                  onClick={() => setSelectedDomain(dom.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedDomain === dom.id
                      ? `bg-neutral-800 ${dom.colorBorder} ring-1`
                      : 'bg-neutral-850/80 border-neutral-700/80 hover:bg-neutral-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow"
                        style={{ backgroundColor: dom.colorHex }}
                      />
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{dom.name}</span>
                          <span className="text-[10px] bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded font-mono">
                            {dom.baseOs}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5">{dom.securityRole}</div>
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono">
                      <span className="text-emerald-400 font-semibold">{dom.status.toUpperCase()}</span>
                      <div className="text-[11px] text-neutral-500 mt-0.5">{dom.memoryAllocatedMb} MB RAM</div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 mt-3 pt-2 border-t border-neutral-800/80 leading-relaxed">
                    {dom.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-2">
                    <span>Network: <span className="text-purple-300">{dom.networkMode}</span></span>
                    <span>Storage: <span className="text-cyan-300">{dom.persistence}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DOMAIN APP LAUNCHER */}
        {activeTab === 'launcher' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">Launch Apps in Specialized Security OSes</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Choose the operating system domain with the appropriate security profile for your current activity.
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

        {/* TAB 3: QVM-COPY INTER-OS BRIDGE */}
        {activeTab === 'transfers' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">qvm-copy Inter-OS Bridge & Clipboard Mediation</h2>
              <p className="text-xs text-neutral-400 mt-1">
                In a multi-OS architecture, malicious software in an untrusted OS cannot silently read your clipboard or access files in other operating systems. Transfers require explicit cryptographic verification.
              </p>
            </div>

            <div className="space-y-2.5">
              {transfers.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 bg-neutral-850 border border-neutral-700 rounded-2xl space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Share2 size={14} className="text-purple-400" />
                      <span>{tx.sourceDomain} → {tx.targetDomain}</span>
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      tx.status === 'verified_allowed'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {tx.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed font-mono">{tx.summary}</p>
                  <div className="text-[11px] text-neutral-500 font-mono pt-1 border-t border-neutral-800 flex justify-between">
                    <span>Type: {tx.type.toUpperCase()} payload</span>
                    <span>{tx.timestamp}</span>
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
