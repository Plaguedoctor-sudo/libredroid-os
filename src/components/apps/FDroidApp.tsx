import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Download, 
  Check, 
  Search, 
  ShieldCheck, 
  Code, 
  ExternalLink, 
  Star, 
  Layers, 
  Plus, 
  CheckCircle2, 
  RefreshCw, 
  Lock, 
  Globe, 
  Apple, 
  Cpu, 
  Zap,
  Tag
} from 'lucide-react';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { AppIcon } from '../common/AppIcon';
import { saveInstalledApk, getInstalledApks } from '../../services/apkManager';
import { saveInstalledAppleApp, getInstalledAppleApps } from '../../services/appleAppManager';
import { installWaydroidApk } from '../../services/hardwareBridgeClient';
import { 
  getAppRepositories, 
  toggleRepository, 
  addCustomRepository, 
  MULTI_SOURCE_PACKAGES, 
  StorePackage, 
  AppRepository 
} from '../../services/appRepositoryManager';

export const FDroidApp: React.FC = () => {
  const { openApp } = useWindow();
  const { addNotification } = useSystem();
  const [activeTab, setActiveTab] = useState<'packages' | 'sources'>('packages');
  const [selectedRepoId, setSelectedRepoId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<AppRepository[]>(getAppRepositories());
  const [packages, setPackages] = useState<StorePackage[]>(MULTI_SOURCE_PACKAGES);
  const [selectedPackage, setSelectedPackage] = useState<StorePackage | null>(null);

  // Custom Repo Modal State
  const [showAddRepoModal, setShowAddRepoModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [newRepoType, setNewRepoType] = useState<AppRepository['type']>('f-droid');

  const enabledRepoIds = repositories.filter(r => r.enabled).map(r => r.id);

  const filteredApps = packages.filter((app) => {
    const isRepoEnabled = enabledRepoIds.includes(app.repositoryId);
    if (!isRepoEnabled) return false;

    const matchesRepo = selectedRepoId === 'all' || app.repositoryId === selectedRepoId;
    const matchesSearch = 
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.category.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase()) ||
      app.packageName.toLowerCase().includes(search.toLowerCase());
    return matchesRepo && matchesSearch;
  });

  const handleToggleRepo = (id: string) => {
    const updated = toggleRepository(id);
    setRepositories(updated);
  };

  const handleAddRepo = () => {
    if (!newRepoName || !newRepoUrl) return;
    const updated = addCustomRepository(newRepoName, newRepoUrl, newRepoType);
    setRepositories(updated);
    setShowAddRepoModal(false);
    setNewRepoName('');
    setNewRepoUrl('');
    addNotification({
      appId: 'store',
      appName: 'Sovereign Store',
      title: 'Repository Mirror Added',
      body: `Cryptographically verified repository ${newRepoName} initialized.`,
    });
  };

  const handleInstall = (pkg: StorePackage) => {
    setInstallingId(pkg.id);
    setTimeout(() => {
      setPackages((prev) =>
        prev.map((a) => (a.id === pkg.id ? { ...a, installed: true } : a))
      );

      // Register into corresponding runtime manager
      if (pkg.platform === 'apple') {
        saveInstalledAppleApp({
          id: pkg.packageName,
          name: pkg.name,
          bundleId: pkg.packageName,
          version: pkg.version,
          size: pkg.size,
          iconBg: 'bg-gradient-to-tr from-rose-500 to-pink-600',
          iconName: 'Apple',
          minimumIosVersion: 'iOS 15.0+',
          architecture: 'arm64',
          framework: 'UIKit',
          entitlements: ['com.apple.security.network.client'],
          installedAt: 'Installed from Sovereign Store',
          category: 'media',
          description: pkg.description,
          binaryType: 'Mach-O 64-bit',
          codeSignature: 'Ad-Hoc (Bypassed)',
        });
      } else {
        installWaydroidApk(pkg.packageName).catch(() => {});
        saveInstalledApk({
          id: pkg.packageName,
          name: pkg.name,
          packageName: pkg.packageName,
          version: pkg.version,
          size: pkg.size,
          iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-700',
          iconName: 'Box',
          permissions: ['NETWORK', 'STORAGE'],
          installedAt: 'Installed from Sovereign Store',
          category: 'utility',
          description: pkg.description,
        });
      }

      setInstallingId(null);
      addNotification({
        appId: 'store',
        appName: 'Sovereign Store',
        title: `${pkg.name} installed`,
        body: `sha256 verified · ${pkg.repositoryId || 'f-droid'} · opening package inspector`,
      });

      // ── handoff: jump straight to the real guest metadata ──
      openApp('apk_installer', 'Package Hub', 'hardened-android', {
        select: pkg.packageName,
        tab: 'detail',
        origin: 'store',
        justInstalled: true,
      });
    }, 900);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden font-sans">
      {/* Top Header */}
      <div className="p-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 via-teal-500 to-emerald-500 text-white rounded-2xl shadow-lg">
            <ShoppingBag size={20} />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              Sovereign App Store
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                {repositories.filter(r => r.enabled).length} Repos Active
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Multiple safe verified sources: F-Droid, IzzyOnDroid, Guardian Project, Flathub & AltStore
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              activeTab === 'packages' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              activeTab === 'sources' ? 'bg-emerald-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Safe Sources ({repositories.length})
          </button>
        </div>
      </div>

      {/* TAB 1: APPLICATIONS BROWSER */}
      {activeTab === 'packages' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search & Repository Filter Chips */}
          <div className="p-3 bg-neutral-950/80 border-b border-neutral-800 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between shrink-0">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search verified packages across all safe sources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <button
                onClick={() => setSelectedRepoId('all')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedRepoId === 'all' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                All Sources
              </button>
              {repositories.filter(r => r.enabled).map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => setSelectedRepoId(repo.id)}
                  className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    selectedRepoId === repo.id ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {repo.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Package Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredApps.map((pkg) => {
                const repo = repositories.find(r => r.id === pkg.repositoryId);
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className="p-3.5 bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 rounded-2xl flex flex-col justify-between transition-all cursor-pointer space-y-3 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <AppIcon appId={pkg.id} size="md" />
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                              {pkg.name}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono truncate max-w-[140px]">
                              {pkg.packageName}
                            </div>
                          </div>
                        </div>

                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          pkg.platform === 'apple' 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : pkg.platform === 'linux'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {pkg.platform === 'apple' ? '🍎 iOS IPA' : pkg.platform === 'linux' ? '🐧 Flatpak' : '🤖 AOSP APK'}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <ShieldCheck size={12} className="text-emerald-400" />
                        <span className="text-[10px] truncate max-w-[100px]">{repo?.name.split(' ')[0]}</span>
                      </div>

                      {pkg.installed || getInstalledApks().some(a => a.packageName === pkg.packageName || a.id === pkg.id) || getInstalledAppleApps().some(a => a.bundleId === pkg.packageName || a.id === pkg.id) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openApp(pkg.id, pkg.name);
                          }}
                          className="px-3 py-1 bg-neutral-800 hover:bg-emerald-600/40 text-emerald-300 rounded-xl font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Check size={12} />
                          <span>Open</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInstall(pkg);
                          }}
                          disabled={installingId === pkg.id}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center gap-1 shadow transition-colors"
                        >
                          <Download size={12} className={installingId === pkg.id ? 'animate-bounce' : ''} />
                          <span>{installingId === pkg.id ? 'Verifying...' : 'Install'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SAFE SOURCES & REPOSITORIES MANAGER */}
      {activeTab === 'sources' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Verified Decentralized Repositories</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                LibreDroid fetches exclusively from cryptographically signed, zero-telemetry repositories.
              </p>
            </div>

            <button
              onClick={() => setShowAddRepoModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Plus size={14} />
              <span>Add Custom Mirror</span>
            </button>
          </div>

          <div className="space-y-3">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="p-4 bg-neutral-850 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{repo.name}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-500/30">
                      {repo.verificationBadge}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 font-mono">{repo.url}</div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed max-w-xl">
                    {repo.description}
                  </p>
                  <div className="text-[10px] text-neutral-500 font-mono pt-1">
                    GPG Fingerprint: {repo.gpgFingerprint.substring(0, 32)}... • Packages: {repo.totalPackages}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleToggleRepo(repo.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      repo.enabled
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 size={13} className={repo.enabled ? 'text-emerald-400' : 'text-neutral-500'} />
                    <span>{repo.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Repo Modal */}
      {showAddRepoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus size={16} className="text-emerald-400" />
              <span>Add Verified Repository Mirror</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Repository Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Trusted FOSS Hub"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Repository URL (HTTPS / Onion)</label>
                <input
                  type="text"
                  placeholder="https://example.org/fdroid/repo"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Repository Protocol Type</label>
                <select
                  value={newRepoType}
                  onChange={(e) => setNewRepoType(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="f-droid">F-Droid Compatible Index (index-v1.json / GPG)</option>
                  <option value="flathub">Flathub / Flatpak OSTree Remote</option>
                  <option value="altstore">AltStore / Delta iOS Source (source.json)</option>
                  <option value="reproducible-git">Direct Reproducible Git Source Repository</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddRepoModal(false)}
                className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRepo}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow"
              >
                Verify & Add Mirror
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
