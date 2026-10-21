import React, { useState } from 'react';
import { ShoppingBag, Star, Download, Check, Search } from 'lucide-react';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { AppIcon } from '../common/AppIcon';
import { AppId } from '../../types/apps';

interface StoreApp {
  id: AppId;
  name: string;
  category: string;
  rating: number;
  reviews: string;
  installed: boolean;
  desc: string;
}

export const PlayStoreApp: React.FC = () => {
  const { openApp } = useWindow();
  const { addNotification } = useSystem();
  const [search, setSearch] = useState('');
  const [installingId, setInstallingId] = useState<string | null>(null);

  const [apps, setApps] = useState<StoreApp[]>([
    {
      id: 'browser',
      name: 'Google Chrome',
      category: 'Productivity',
      rating: 4.8,
      reviews: '24M',
      installed: true,
      desc: 'Fast, secure, universal web browser with built-in sync.',
    },
    {
      id: 'terminal',
      name: 'Omni Terminal Pro',
      category: 'Developer Tools',
      rating: 4.9,
      reviews: '420K',
      installed: true,
      desc: 'Full-featured adaptive Linux shell with AOSP runtime tools.',
    },
    {
      id: 'notes',
      name: 'Google Keep',
      category: 'Productivity',
      rating: 4.7,
      reviews: '18M',
      installed: true,
      desc: 'Capture notes, lists, and photos with cloud sync.',
    },
    {
      id: 'calculator',
      name: 'Omni Calculator',
      category: 'Utility',
      rating: 4.6,
      reviews: '5M',
      installed: true,
      desc: 'Material 3 calculator with basic and scientific functions.',
    },
    {
      id: 'camera',
      name: 'Pixel Camera HDR+',
      category: 'Photography',
      rating: 4.8,
      reviews: '30M',
      installed: true,
      desc: 'Capture incredible photos and videos with computational photography.',
    },
    {
      id: 'files',
      name: 'Google Files & Drive',
      category: 'System',
      rating: 4.7,
      reviews: '12M',
      installed: true,
      desc: 'Clean storage, browse local and cloud files seamlessly.',
    },
  ]);

  const handleInstallToggle = (app: StoreApp) => {
    if (app.installed) {
      openApp(app.id);
      return;
    }

    setInstallingId(app.id);
    setTimeout(() => {
      setApps((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, installed: true } : a))
      );
      setInstallingId(null);
      addNotification({
        appId: app.id,
        appName: 'Play Store',
        title: `${app.name} Installed`,
        body: 'The app is now ready to run across all your universal devices.',
      });
    }, 1200);
  };

  const filtered = apps.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Play Store Header */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-teal-400" />
          <span className="text-sm font-bold">Google Play</span>
        </div>

        <div className="flex-1 max-w-sm flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1.5 border border-neutral-700">
          <Search size={14} className="text-neutral-400" />
          <input
            type="text"
            placeholder="Search apps & games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Hero Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-pink-900/30 border-b border-neutral-800/80 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Featured Universal Apps</span>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">Built for Every Screen Size</h2>
            <p className="text-xs text-neutral-300 mt-1 max-w-md">
              Run the exact same application package smoothly on phone, foldable, tablet, and 4K desktop modes.
            </p>
          </div>
        </div>
      </div>

      {/* App List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {filtered.map((app) => (
          <div
            key={app.id}
            className="bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/60 p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AppIcon appId={app.id} size="md" />
              <div>
                <div className="text-sm font-semibold text-white">{app.name}</div>
                <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                  <span>{app.category}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-amber-300">
                    <span>{app.rating}</span>
                    <Star size={11} fill="currentColor" />
                  </div>
                  <span>({app.reviews})</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-1 line-clamp-1">{app.desc}</div>
              </div>
            </div>

            <button
              onClick={() => handleInstallToggle(app)}
              disabled={installingId === app.id}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                installingId === app.id
                  ? 'bg-neutral-700 text-neutral-400'
                  : app.installed
                  ? 'bg-neutral-700 hover:bg-neutral-600 text-white'
                  : 'bg-teal-600 hover:bg-teal-500 text-white shadow'
              }`}
            >
              {installingId === app.id ? (
                'Installing...'
              ) : app.installed ? (
                'Open'
              ) : (
                <div className="flex items-center gap-1">
                  <Download size={13} />
                  <span>Install</span>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
