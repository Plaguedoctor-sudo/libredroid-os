import React, { useState } from 'react';
import { ShoppingBag, Download, Check, Search, ShieldCheck, Code, ExternalLink, Star } from 'lucide-react';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { AppIcon } from '../common/AppIcon';
import { saveInstalledApk, SideloadedApk } from '../../services/apkManager';

interface FDroidPackage {
  id: string;
  name: string;
  packageName: string;
  version: string;
  category: string;
  license: string;
  size: string;
  description: string;
  installed: boolean;
  sourceUrl: string;
}

export const FDroidApp: React.FC = () => {
  const { openApp } = useWindow();
  const { addNotification } = useSystem();
  const [search, setSearch] = useState('');
  const [installingId, setInstallingId] = useState<string | null>(null);

  const [apps, setApps] = useState<FDroidPackage[]>([
    {
      id: 'org.videolan.vlc',
      name: 'VLC Media Player',
      packageName: 'org.videolan.vlc',
      version: '3.5.4',
      category: 'Multimedia',
      license: 'GPLv3',
      size: '34 MB',
      description: 'Plays all video/audio formats, network streams, and local shares with zero trackers.',
      installed: true,
      sourceUrl: 'https://code.videolan.org/videolan/vlc-android',
    },
    {
      id: 'org.schabi.newpipe',
      name: 'NewPipe',
      packageName: 'org.schabi.newpipe',
      version: '0.27.0',
      category: 'Internet',
      license: 'GPLv3',
      size: '14 MB',
      description: 'Privacy-focused lightweight streaming client without proprietary Google Services.',
      installed: true,
      sourceUrl: 'https://github.com/TeamNewPipe/NewPipe',
    },
    {
      id: 'net.osmand.plus',
      name: 'OsmAnd',
      packageName: 'net.osmand.plus',
      version: '4.7.2',
      category: 'Navigation',
      license: 'GPLv3',
      size: '58 MB',
      description: 'Comprehensive global offline maps and turn-by-turn navigation based on OpenStreetMap.',
      installed: true,
      sourceUrl: 'https://github.com/osmandapp/Osmand',
    },
    {
      id: 'im.vector.app',
      name: 'Element Messenger',
      packageName: 'im.vector.app',
      version: '1.6.8',
      category: 'Communication',
      license: 'Apache-2.0',
      size: '42 MB',
      description: 'Decentralized, end-to-end encrypted chat powered by the open Matrix protocol.',
      installed: true,
      sourceUrl: 'https://github.com/vector-im/element-android',
    },
    {
      id: 'com.fsck.k9',
      name: 'K-9 Mail (Thunderbird)',
      packageName: 'com.fsck.k9',
      version: '6.800',
      category: 'Productivity',
      license: 'Apache-2.0',
      size: '18 MB',
      description: 'Independent open-source email client with PGP end-to-end encryption support.',
      installed: true,
      sourceUrl: 'https://github.com/thunderbird/thunderbird-android',
    },
    {
      id: 'org.signal.android',
      name: 'Molly (Signal FOSS)',
      packageName: 'im.molly.app',
      version: '7.1.0',
      category: 'Security',
      license: 'GPLv3',
      size: '39 MB',
      description: 'Hardened, de-googled Signal fork with passphrase database encryption and unified push.',
      installed: false,
      sourceUrl: 'https://github.com/mollyim/mollyim-android',
    },
    {
      id: 'org.fossify.gallery',
      name: 'Fossify Gallery',
      packageName: 'org.fossify.gallery',
      version: '1.1.2',
      category: 'Multimedia',
      license: 'GPLv3',
      size: '8 MB',
      description: 'Lightweight offline photo & video gallery with no internet permissions requested.',
      installed: false,
      sourceUrl: 'https://github.com/FossifyOrg/Gallery',
    },
    {
      id: 'org.kde.kdeconnect_tp',
      name: 'KDE Connect',
      packageName: 'org.kde.kdeconnect_tp',
      version: '1.29.0',
      category: 'System',
      license: 'GPLv2',
      size: '12 MB',
      description: 'Seamless wireless clipboard sharing, notification sync, and file transfer across devices.',
      installed: false,
      sourceUrl: 'https://invent.kde.org/network/kdeconnect-android',
    },
  ]);

  const handleInstall = (app: FDroidPackage) => {
    if (app.installed) {
      openApp(app.id, app.name);
      return;
    }

    setInstallingId(app.id);
    setTimeout(() => {
      setApps((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, installed: true } : a))
      );
      setInstallingId(null);

      // Register into installed APKs
      saveInstalledApk({
        id: app.id,
        name: app.name,
        packageName: app.packageName,
        version: app.version,
        size: app.size,
        iconBg: 'bg-gradient-to-tr from-blue-600 to-indigo-700',
        iconName: 'Box',
        permissions: ['NETWORK', 'STORAGE'],
        installedAt: 'Just now',
        category: 'foss',
        description: app.description,
      });

      addNotification({
        appId: 'store',
        appName: 'F-Droid',
        title: `${app.name} Installed`,
        body: `Free & Open Source APK ${app.packageName} successfully installed.`,
      });
    }, 1200);
  };

  const filtered = apps.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-xl">
            <ShoppingBag size={18} />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              F-Droid Repository
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                100% Free Software
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Verified Open Source Android APKs • No Trackers • No Ads
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-sm flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1.5 border border-neutral-700">
          <Search size={14} className="text-neutral-400" />
          <input
            type="text"
            placeholder="Search FOSS apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Repository Stats Strip */}
      <div className="bg-neutral-950/80 px-4 py-2 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck size={14} />
            <span>Anti-Features Audit: Clean</span>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Repo: f-droid.org main</span>
        </div>
        <span className="text-[11px] font-mono text-blue-300">microG Verified</span>
      </div>

      {/* App List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {filtered.map((app) => (
          <div
            key={app.id}
            className="bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
          >
            <div className="flex items-start gap-3">
              <AppIcon appId={app.id} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{app.name}</span>
                  <span className="text-[10px] bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded font-mono">
                    {app.license}
                  </span>
                </div>
                <div className="text-xs text-neutral-400 font-mono mt-0.5">{app.packageName} • v{app.version}</div>
                <div className="text-xs text-neutral-300 mt-1 leading-relaxed max-w-xl">{app.description}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <a
                href={app.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-xl transition-colors"
                title="View Source Code Repository"
              >
                <Code size={16} />
              </a>

              <button
                onClick={() => handleInstall(app)}
                disabled={installingId === app.id}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  installingId === app.id
                    ? 'bg-neutral-700 text-neutral-400'
                    : app.installed
                    ? 'bg-neutral-700 hover:bg-neutral-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
                }`}
              >
                {installingId === app.id ? (
                  'Installing...'
                ) : app.installed ? (
                  'Launch'
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Download size={13} />
                    <span>Install APK</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
