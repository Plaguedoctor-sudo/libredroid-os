import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Home, 
  Search, 
  Plus, 
  X, 
  Lock, 
  ExternalLink,
  Bookmark,
  Share2
} from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  url: string;
}

export const BrowserApp: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'Google', url: 'https://www.google.com' },
    { id: '2', title: 'Android Universal', url: 'https://android.com/universal' },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [urlInput, setUrlInput] = useState('https://www.google.com');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ title: string; desc: string; url: string }> | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleNavigate = (newUrl: string) => {
    let target = newUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      // Treat as search query
      target = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
      performSearch(newUrl);
    } else {
      setSearchResults(null);
    }

    setUrlInput(target);
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url: target, title: newUrl } : t))
    );
  };

  const performSearch = (query: string) => {
    setSearchResults([
      {
        title: `OmniOS: The Universal Android Platform for all form factors`,
        desc: `Learn how the modular universal architecture adapts across smart phones, tablets, foldable hinges, and desktop multitasking environments.`,
        url: 'https://omni-android.system/specs',
      },
      {
        title: `Google Android & AOSP Open Source Project`,
        desc: `Android is an open source operating system for mobile devices and a corresponding open source project led by Google.`,
        url: 'https://source.android.com',
      },
      {
        title: `Cross-Platform Responsive Systems and Progressive Web Apps`,
        desc: `Discover modern web runtime sandboxes, web workers, hardware acceleration, and responsive design guidelines.`,
        url: 'https://developer.chrome.com',
      },
      {
        title: `Material Design 3 & Material You Dynamic Theming`,
        desc: `Material You transforms design for Android by personalizing color palettes derived from system wallpaper and user preferences.`,
        url: 'https://m3.material.io',
      },
    ]);
  };

  const addTab = () => {
    const newId = Math.random().toString(36).substring(2, 7);
    const newTab: Tab = {
      id: newId,
      title: 'New Tab',
      url: 'https://www.google.com',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setUrlInput('https://www.google.com');
    setSearchResults(null);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[0].id);
      setUrlInput(remaining[0].url);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white overflow-hidden select-none">
      {/* Tabs Bar */}
      <div className="flex items-center bg-neutral-950 px-2 pt-2 gap-1 overflow-x-auto border-b border-neutral-800 shrink-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id);
                setUrlInput(tab.url);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs max-w-[180px] cursor-pointer transition-all ${
                isActive
                  ? 'bg-neutral-900 text-white font-medium border-t-2 border-blue-500'
                  : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-900/60'
              }`}
            >
              <span className="truncate flex-1">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => closeTab(e, tab.id)}
                  className="hover:text-red-400 rounded p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={addTab}
          className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
          title="New Tab"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Omnibox / Navigation Header */}
      <div className="flex items-center gap-2 p-2 bg-neutral-900 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-1 text-neutral-400">
          <button className="p-1.5 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </button>
          <button className="p-1.5 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors">
            <ArrowRight size={16} />
          </button>
          <button 
            onClick={() => handleNavigate(urlInput)}
            className="p-1.5 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors"
          >
            <RotateCw size={16} />
          </button>
        </div>

        {/* URL Bar */}
        <div className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1.5 border border-neutral-700/60 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50">
          <Lock size={14} className="text-emerald-400 shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate(urlInput)}
            className="w-full bg-transparent text-xs text-white focus:outline-none"
            placeholder="Search Google or type a URL"
          />
        </div>

        <div className="flex items-center gap-1 text-neutral-400">
          <button className="p-1.5 hover:bg-neutral-800 rounded-lg hover:text-white">
            <Bookmark size={16} />
          </button>
          <button className="p-1.5 hover:bg-neutral-800 rounded-lg hover:text-white">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Web Page Viewport */}
      <div className="flex-1 overflow-y-auto bg-neutral-950 p-4 sm:p-8 flex flex-col items-center">
        {searchResults ? (
          /* Search Results Page */
          <div className="w-full max-w-3xl space-y-4">
            <div className="text-xs text-neutral-400 pb-2 border-b border-neutral-800 flex items-center justify-between">
              <span>About 4,280,000 results (0.19 seconds)</span>
              <span className="text-blue-400 font-mono">Omni SafeSearch</span>
            </div>
            {searchResults.map((res, i) => (
              <div key={i} className="space-y-1 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800/80 hover:border-neutral-700 transition-colors">
                <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                  <span className="truncate">{res.url}</span>
                </div>
                <h3 className="text-base font-semibold text-blue-400 hover:underline cursor-pointer">
                  {res.title}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">{res.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Default Google Start Page */
          <div className="w-full max-w-xl flex flex-col items-center justify-center my-auto py-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-5xl font-black tracking-tight text-[#4285f4]">G</span>
              <span className="text-5xl font-black tracking-tight text-[#ea4335]">o</span>
              <span className="text-5xl font-black tracking-tight text-[#fbbc05]">o</span>
              <span className="text-5xl font-black tracking-tight text-[#4285f4]">g</span>
              <span className="text-5xl font-black tracking-tight text-[#34a853]">l</span>
              <span className="text-5xl font-black tracking-tight text-[#ea4335]">e</span>
            </div>

            <div className="w-full flex items-center gap-3 bg-neutral-900 border border-neutral-700/80 hover:border-neutral-600 rounded-full px-5 py-3 shadow-lg">
              <Search size={18} className="text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Search Google or type a URL"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNavigate(searchQuery);
                }}
                className="w-full bg-transparent text-sm text-white focus:outline-none"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleNavigate(searchQuery || 'Google Search')}
                className="px-4 py-2 bg-neutral-800/90 hover:bg-neutral-700/90 text-xs font-medium rounded-full border border-neutral-700 transition-colors"
              >
                Google Search
              </button>
              <button
                onClick={() => handleNavigate('https://android.com/universal')}
                className="px-4 py-2 bg-neutral-800/90 hover:bg-neutral-700/90 text-xs font-medium rounded-full border border-neutral-700 transition-colors text-purple-300"
              >
                I'm Feeling Lucky
              </button>
            </div>

            {/* Quick shortcuts */}
            <div className="grid grid-cols-4 gap-4 mt-10">
              {[
                { name: 'GitHub', url: 'https://github.com' },
                { name: 'Android Dev', url: 'https://developer.android.com' },
                { name: 'YouTube', url: 'https://youtube.com' },
                { name: 'Wikipedia', url: 'https://wikipedia.org' },
              ].map((site) => (
                <button
                  key={site.name}
                  onClick={() => handleNavigate(site.url)}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-neutral-800/60 rounded-2xl transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-blue-400">
                    {site.name[0]}
                  </div>
                  <span className="text-[11px] text-neutral-300 truncate max-w-[70px]">
                    {site.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
