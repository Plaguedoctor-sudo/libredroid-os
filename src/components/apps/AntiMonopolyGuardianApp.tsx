import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Download, 
  Share2, 
  Radio, 
  Database, 
  Plus, 
  Check, 
  ExternalLink,
  Layers,
  AlertTriangle,
  Server,
  Zap,
  DollarSign
} from 'lucide-react';
import { 
  TrackerBlockEvent, 
  AppRepositoryConfig, 
  UnifiedPushServer,
  DEFAULT_REPOSITORIES,
  DEFAULT_UNIFIED_PUSH_SERVERS,
  generateInitialBlockedTrackers,
  exportFullSystemData
} from '../../services/antiMonopolyEngine';
import { useSystem } from '../../context/SystemContext';

export const AntiMonopolyGuardianApp: React.FC = () => {
  const { addNotification } = useSystem();
  const [activeTab, setActiveTab] = useState<'overview' | 'unifiedpush' | 'repos' | 'trackers' | 'portability'>('overview');
  const [repos, setRepos] = useState<AppRepositoryConfig[]>(DEFAULT_REPOSITORIES);
  const [pushServers, setPushServers] = useState<UnifiedPushServer[]>(DEFAULT_UNIFIED_PUSH_SERVERS);
  const [trackers, setTrackers] = useState<TrackerBlockEvent[]>(generateInitialBlockedTrackers());
  const [strictFirewall, setStrictFirewall] = useState(true);

  const toggleRepo = (id: string) => {
    setRepos((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const selectPushServer = (id: string) => {
    setPushServers((prev) =>
      prev.map((s) => ({ ...s, active: s.id === id }))
    );
    const chosen = pushServers.find((s) => s.id === id);
    addNotification({
      appId: 'guardian',
      appName: 'Anti-Monopoly Guardian',
      title: 'UnifiedPush Provider Switched',
      body: `Routing app push notifications independently through ${chosen?.name}.`,
    });
  };

  const handleExport = () => {
    exportFullSystemData();
    addNotification({
      appId: 'guardian',
      appName: 'Zero-Lockin Guarantee',
      title: 'Data Portability Export Complete',
      body: 'Your complete OS state, apps, and notes have been exported to an open JSON archive.',
    });
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col sm:flex-row bg-neutral-900 text-white select-none overflow-hidden">
      {/* Sidebar Tabs */}
      <div className="w-full sm:w-60 bg-neutral-950 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-neutral-800 flex sm:flex-col gap-1.5 shrink-0 overflow-x-auto">
        <div className="hidden sm:block text-xs font-bold uppercase tracking-wider text-emerald-400 px-3 py-2 flex items-center gap-1.5">
          <ShieldCheck size={16} />
          <span>Anti-Monopoly Core</span>
        </div>

        {[
          { id: 'overview', label: 'Freedom Architecture', icon: ShieldCheck },
          { id: 'unifiedpush', label: 'UnifiedPush Dispatcher', icon: Radio },
          { id: 'repos', label: 'Open App Repositories', icon: Database },
          { id: 'trackers', label: 'Telemetry & Firewall', icon: Lock },
          { id: 'portability', label: '100% Data Portability', icon: Download },
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* TAB 1: OVERVIEW & COMPARISON */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-medium mb-2 border border-emerald-500/30">
                <ShieldCheck size={14} />
                <span>Future-Proof Open Architecture</span>
              </div>
              <h2 className="text-xl font-bold">Preventing Corporate Monopolies</h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Google captured Android by moving core OS APIs into proprietary closed-source Google Play Services and forcing OEMs into restrictive anti-forking agreements (MADA/AFA). LibreDroid solves this fundamentally through architectural decentralization.
              </p>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-2xl space-y-2">
                <span className="font-bold text-red-400 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <AlertTriangle size={14} />
                  <span>The Corporate Monopoly Model</span>
                </span>
                <ul className="space-y-1.5 text-neutral-300 text-[11px] leading-relaxed">
                  <li>• Single gatekeeper app store with mandatory 30% revenue tax</li>
                  <li>• Proprietary GmsCore / FCM server lock-in</li>
                  <li>• Mandatory advertising ID (GAID) tracking user habits</li>
                  <li>• Hardware anti-forking contracts (MADA/AFA) restricting competition</li>
                  <li>• Data locked inside proprietary cloud ecosystems</li>
                </ul>
              </div>

              <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl space-y-2">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <ShieldCheck size={14} />
                  <span>The LibreDroid Sovereign Model</span>
                </span>
                <ul className="space-y-1.5 text-neutral-300 text-[11px] leading-relaxed">
                  <li>• Pluggable, decentralized repositories (F-Droid, IPFS, sideloading)</li>
                  <li>• UnifiedPush open protocol: any server can deliver notifications</li>
                  <li>• Operating-system level packet firewall blocking all tracking</li>
                  <li>• Zero platform tax: direct developer commerce (Stripe, Lightning, FOSS)</li>
                  <li>• 100% complete data export & portability at any moment</li>
                </ul>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-neutral-800/60 rounded-2xl border border-neutral-700">
                <div className="text-lg font-bold text-emerald-400 font-mono">100%</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Free Software (FOSS)</div>
              </div>
              <div className="p-3 bg-neutral-800/60 rounded-2xl border border-neutral-700">
                <div className="text-lg font-bold text-emerald-400 font-mono">0%</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">App Store Commission</div>
              </div>
              <div className="p-3 bg-neutral-800/60 rounded-2xl border border-neutral-700">
                <div className="text-lg font-bold text-emerald-400 font-mono">6,902+</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Verified FOSS APKs</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UNIFIEDPUSH DISPATCHER */}
        {activeTab === 'unifiedpush' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">UnifiedPush Decentralized Dispatcher</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Replaces Google Firebase Cloud Messaging (FCM) and Apple APNs. UnifiedPush is an open standard that allows push notifications to be delivered by any server you trust, including self-hosted nodes.
              </p>
            </div>

            <div className="space-y-2.5">
              {pushServers.map((server) => (
                <div
                  key={server.id}
                  onClick={() => selectPushServer(server.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    server.active
                      ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                      : 'bg-neutral-800/40 border-neutral-700 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Radio size={20} className={server.active ? 'text-emerald-400' : 'text-neutral-400'} />
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>{server.name}</span>
                        {server.isSelfHosted && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                            Self-Hosted
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 font-mono mt-0.5">{server.endpoint}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-emerald-400">{server.latencyMs}ms</span>
                    {server.active && <Check size={18} className="text-emerald-400" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-neutral-800/50 border border-neutral-700/60 rounded-2xl text-xs space-y-2">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Server size={14} className="text-emerald-400" />
                <span>Why This Prevents Monopolies:</span>
              </span>
              <p className="text-neutral-300 leading-relaxed text-[11px]">
                In standard Android, developers are forced to include Google Play Services just to wake their app up for incoming chats or alerts. With UnifiedPush, applications remain 100% functional even if Google bans the developer or locks their account.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: OPEN APP REPOSITORIES */}
        {activeTab === 'repos' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">Pluggable App Repositories & Anti-30% Tax</h2>
              <p className="text-xs text-neutral-400 mt-1">
                LibreDroid treats all app repositories equally. No developer is forced to pay a 30% platform fee, and users can add any independent catalog or direct P2P mesh.
              </p>
            </div>

            <div className="space-y-2.5">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="p-3.5 bg-neutral-800/50 border border-neutral-700 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>{repo.name}</span>
                        <span className="text-[10px] bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded font-mono uppercase">
                          {repo.type}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 font-mono mt-0.5">{repo.url}</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">{repo.appCount} verified packages</div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleRepo(repo.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      repo.enabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-neutral-700 text-neutral-400'
                    }`}
                  >
                    {repo.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-xs space-y-1.5">
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <DollarSign size={14} />
                <span>Zero Platform Tax Guarantee:</span>
              </span>
              <p className="text-neutral-300 leading-relaxed text-[11px]">
                Apps can integrate direct Stripe payments, OpenCollective, GitHub Sponsors, or Bitcoin Lightning without being removed from the system. 100% of revenue goes directly to developers.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: TELEMETRY & FIREWALL */}
        {activeTab === 'trackers' && (
          <div className="space-y-5 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Operating-System Level Packet Firewall</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Intercepts and drops telemetry, advertising IDs, and surveillance trackers at the kernel network stack before they ever leave your device.
                </p>
              </div>

              <button
                onClick={() => setStrictFirewall(!strictFirewall)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  strictFirewall
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {strictFirewall ? 'Strict Shield ON' : 'Firewall OFF'}
              </button>
            </div>

            {/* Blocked Trackers Log */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex justify-between">
                <span>Recent Interceptions ({trackers.length})</span>
                <span className="text-emerald-400 font-mono">Status: Dropped 100%</span>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {trackers.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-neutral-850/80 border border-neutral-700/60 rounded-xl flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="text-white font-semibold flex items-center gap-2">
                        <span className="text-red-400 font-bold">BLOCKED:</span>
                        <span>{t.trackerDomain}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        App: {t.app} • Type: {t.category}
                      </div>
                    </div>
                    <span className="text-neutral-500 text-[10px]">{t.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: 100% DATA PORTABILITY & ZERO LOCK-IN */}
        {activeTab === 'portability' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold">Zero-Lockin Guarantee & Data Sovereignty</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Monopolies trap users by making it difficult or impossible to export their complete digital life. In LibreDroid, your files, notes, configurations, and app state belong exclusively to you and can be exported at any moment.
              </p>
            </div>

            <div className="p-5 bg-neutral-800/50 border border-neutral-700 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                  <Download size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Full System Archive Exporter</h3>
                  <p className="text-xs text-neutral-400">
                    Exports notes, sideloaded APK manifests, settings, and encryption keys to standard JSON/ZIP.
                  </p>
                </div>
              </div>

              <button
                onClick={handleExport}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} />
                <span>Export Complete System Data (One-Click Migration)</span>
              </button>
            </div>

            <div className="text-xs text-neutral-400 space-y-1">
              <span className="font-semibold text-white">Open Standard Guarantee:</span>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Exported files use open industry standards (Markdown for notes, standard APK manifests, open JSON configuration). You can import your data into any other Linux, Android, or desktop distribution with zero vendor restriction.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
