import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import { SYSTEM_APPS } from '../../constants/apps';
import { AppIcon } from '../common/AppIcon';

export const AppDrawer: React.FC = () => {
  const { isAppDrawerOpen, setIsAppDrawerOpen, actualDevice } = useSystem();
  const { openApp } = useWindow();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isAppDrawerOpen) return null;

  const filteredApps = SYSTEM_APPS.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div 
      className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xl flex flex-col items-center justify-end sm:justify-center p-3 sm:p-6 animate-fade-in select-none"
      onClick={() => setIsAppDrawerOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 max-h-[85vh] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header & Search Bar */}
        <div className="flex items-center gap-3 bg-neutral-800/80 border border-neutral-700 rounded-2xl px-3.5 py-2.5">
          <Search size={18} className="text-neutral-400 shrink-0" />
          <input
            type="text"
            placeholder="Search apps, settings, commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-white placeholder-neutral-500 text-sm focus:outline-none"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-neutral-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {['all', 'productivity', 'system', 'media', 'utility'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white font-medium shadow-sm'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-6 gap-x-4 py-4 overflow-y-auto max-h-[50vh] pr-1">
          {filteredApps.map((app) => (
            <button
              key={app.id}
              onClick={() => {
                openApp(app.id);
                setIsAppDrawerOpen(false);
              }}
              className="flex flex-col items-center justify-center gap-2 group transition-transform active:scale-95"
            >
              <div className="group-hover:scale-105 transition-transform">
                <AppIcon appId={app.id} size={actualDevice === 'phone' ? 'md' : 'lg'} badge={app.badge} />
              </div>
              <span className="text-xs text-neutral-300 group-hover:text-white text-center truncate max-w-[80px]">
                {app.name}
              </span>
            </button>
          ))}
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-neutral-500 pt-2 border-t border-neutral-800">
          Omni Universal Runtime • Tap outside to close
        </div>
      </div>
    </div>
  );
};
