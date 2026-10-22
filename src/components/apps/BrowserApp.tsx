import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Search, 
  Plus, 
  X, 
  Lock, 
  Bookmark,
  Share2,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { useVirtualKeyboard } from '../../context/KeyboardContext';

interface Tab {
  id: string;
  title: string;
  url: string;
}

export const BrowserApp: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'DuckDuckGo', url: 'https://duckduckgo.com' },
    { id: '2', title: 'F-Droid Free Software', url: 'https://f-droid.org' },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [urlInput, setUrlInput] = useState('https://duckduckgo.com');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ title: string; desc: string; url: string }> | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleNavigate = (newUrl: string) => {
    let target = newUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://duckduckgo.com/?q=${encodeURIComponent(target)}`;
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
        title: `DuckDuckGo Privacy Search: Results for "${query}"`,
        desc: `No search history tracking, no targeted advertising, no commercial profile profiling. Free and open web.`,
        url: 'https://duckduckgo.com',
      },
      {
        title: `Waydroid: Linux-based Container for Android Applications`,
        desc: `Waydroid uses Linux namespaces (LXC) to run a complete Android system directly on standard GNU/Linux kernels with hardware GPU acceleration.`,
        url: 'https://waydro.id',
      },
      {
        title: `F-Droid: The Free and Open Source Android App Repository`,
        desc: `F-Droid is an installable catalogue of FOSS (Free and Open Source Software) applications for the Android platform.`,
        url: 'https://f-droid.org',
      },
      {
        title: `microG Project: Free Software Clone of Google's Proprietary Core Libraries`,
        desc: `microG is a free software re-implementation of Google's proprietary Android user space apps and libraries.`,
        url: 'https://microg.org',
      },
    ]);
  };

  const addTab = () => {
    const newId = Math.random().toString(36).substring(2, 7);
    const newTab: Tab = {
      id: newId,
      title: 'New Tab',
      url: 'https://duckduckgo.com',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setUrlInput('https://duckduckgo.com');
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

  const { openKeyboard } = useVirtualKeyboard();

  const handleUrlBarTap = () => {
    openKeyboard({
      value: urlInput,
      onChange: (val) => setUrlInput(val),
      onEnter: () => handleNavigate(urlInput),
      placeholder: 'Search DuckDuckGo or enter URL...',
    });
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white overflow-hidden select-none">
      {/* Tabs Bar */}
      <div className="flex items-center bg-neutral-950 px-2 pt-2 gap-1 overflow-x-auto border-b border-neutral-800 shrink-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const { openKeyboard } = useVirtualKeyboard();

  const handleUrlBarTap = () => {
    openKeyboard({
      value: urlInput,
      onChange: (val) => setUrlInput(val),
      onEnter: () => handleNavigate(urlInput),
      placeholder: 'Search DuckDuckGo or enter URL...',
    });
  };

  return (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id);
                setUrlInput(tab.url);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs max-w-[180px] cursor-pointer transition-all ${
                isActive
                  ? 'bg-neutral-900 text-white font-medium border-t-2 border-emerald-500'
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
        <div 
          onClick={handleUrlBarTap}
          className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1.5 border border-neutral-700/60 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/50 cursor-pointer"
        >
          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onClick={handleUrlBarTap}
            inputMode="none"
            className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            placeholder="Search DuckDuckGo or enter URL"
          />
        </div>

        <div className="flex items-center gap-1 text-neutral-400">
          <button className="p-1.5 hover:bg-neutral-800 rounded-lg hover:text-white" title="Bookmarks">
            <Bookmark size={16} />
          </button>
          <button className="p-1.5 hover:bg-neutral-800 rounded-lg hover:text-white" title="Share URL">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Web Page Viewport */}
      <div className="flex-1 overflow-y-auto bg-neutral-950 p-4 sm:p-8 flex flex-col items-center">
        {searchResults ? (
          /* Search Results */
          <div className="w-full max-w-3xl space-y-4">
            <div className="text-xs text-neutral-400 pb-2 border-b border-neutral-800 flex items-center justify-between">
              <span>DuckDuckGo Privacy Results</span>
              <span className="text-emerald-400 font-mono">Zero Telemetry Tracked</span>
            </div>
            {searchResults.map((res, i) => (
              <div key={i} className="space-y-1 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800/80 hover:border-neutral-700 transition-colors">
                <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                  <span className="truncate">{res.url}</span>
                </div>
                <h3 className="text-base font-semibold text-emerald-400 hover:underline cursor-pointer">
                  {res.title}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">{res.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          /* DuckDuckGo Privacy Start Page */
          <div className="w-full max-w-xl flex flex-col items-center justify-center my-auto py-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-lg">
                <ShieldCheck size={36} />
              </div>
              <div>
                <span className="text-3xl font-extrabold tracking-tight text-white">DuckDuckGo</span>
                <p className="text-xs text-emerald-400 font-mono">Privacy, simplified.</p>
              </div>
            </div>

            <div className="w-full flex items-center gap-3 bg-neutral-900 border border-neutral-700/80 hover:border-neutral-600 rounded-full px-5 py-3 shadow-lg">
              <Search size={18} className="text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Search the web without being tracked..."
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
                onClick={() => handleNavigate(searchQuery || 'DuckDuckGo Search')}
                className="px-5 py-2 bg-neutral-800/90 hover:bg-neutral-700/90 text-xs font-semibold rounded-full border border-neutral-700 transition-colors text-white"
              >
                DuckDuckGo Search
              </button>
              <button
                onClick={() => handleNavigate('https://f-droid.org')}
                className="px-5 py-2 bg-neutral-800/90 hover:bg-neutral-700/90 text-xs font-semibold rounded-full border border-neutral-700 transition-colors text-emerald-400"
              >
                F-Droid Apps
              </button>
            </div>

            {/* FOSS Quick Shortcuts */}
            <div className="grid grid-cols-4 gap-4 mt-10">
              {[
                { name: 'F-Droid', url: 'https://f-droid.org' },
                { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org' },
                { name: 'Wikipedia', url: 'https://wikipedia.org' },
                { name: 'GitHub FOSS', url: 'https://github.com' },
              ].map((site) => (
                <button
                  key={site.name}
                  onClick={() => handleNavigate(site.url)}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-neutral-800/60 rounded-2xl transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-emerald-400">
                    {site.name[0]}
                  </div>
                  <span className="text-[11px] text-neutral-300 truncate max-w-[80px]">
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
