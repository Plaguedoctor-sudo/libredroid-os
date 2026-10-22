import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Search, 
  Plus, 
  X, 
  Lock, 
  ExternalLink,
  Home,
  Globe,
  ShieldCheck,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useVirtualKeyboard } from '../../context/KeyboardContext';
import { openInNativeBrowser } from '../../services/hardwareBridgeClient';

interface Tab {
  id: string;
  title: string;
  url: string;
}

const DEFAULT_HOME = 'duckduckgo:home';

export const BrowserApp: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'DuckDuckGo Home', url: DEFAULT_HOME },
    { id: '2', title: 'Wikipedia', url: 'https://en.m.wikipedia.org' },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [urlInput, setUrlInput] = useState('https://duckduckgo.com');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleNavigate = (newUrl: string) => {
    let target = newUrl.trim();
    if (!target) return;

    if (target === DEFAULT_HOME) {
      setUrlInput('https://duckduckgo.com');
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, url: DEFAULT_HOME, title: 'DuckDuckGo Home' } : t))
      );
      return;
    }

    // Check if it's a domain or a search query
    const isDomain = /^https?:\/\//i.test(target) || 
      (!target.includes(' ') && (target.includes('.') && !target.endsWith('.')));

    if (!isDomain) {
      target = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(target)}`;
    } else if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }

    setIsLoading(true);
    setUrlInput(target);

    // Extract title from domain
    let host = target;
    try {
      host = new URL(target).hostname.replace(/^www\./, '');
    } catch {}

    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url: target, title: host || 'Web Page' } : t))
    );
  };

  const addTab = () => {
    const newId = Math.random().toString(36).substring(2, 7);
    const newTab: Tab = {
      id: newId,
      title: 'New Tab',
      url: DEFAULT_HOME,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setUrlInput('https://duckduckgo.com');
    setIsLoading(false);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[0].id);
      setUrlInput(remaining[0].url === DEFAULT_HOME ? 'https://duckduckgo.com' : remaining[0].url);
    }
  };

  const handleReload = () => {
    if (activeTab.url !== DEFAULT_HOME && iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = `/api/proxy/browse?url=${encodeURIComponent(activeTab.url)}&_t=${Date.now()}`;
    }
  };

  const handleOpenExternal = async () => {
    const target = activeTab.url === DEFAULT_HOME ? 'https://duckduckgo.com' : activeTab.url;
    await openInNativeBrowser(target);
  };

  const { openKeyboard } = useVirtualKeyboard();

  const handleUrlBarTap = () => {
    openKeyboard({
      value: urlInput === 'https://duckduckgo.com' && activeTab.url === DEFAULT_HOME ? '' : urlInput,
      onChange: (val) => setUrlInput(val),
      onEnter: () => handleNavigate(urlInput),
      placeholder: 'Search DuckDuckGo or enter URL...',
    });
  };

  const handleHomeTap = () => {
    handleNavigate(DEFAULT_HOME);
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
                setUrlInput(tab.url === DEFAULT_HOME ? 'https://duckduckgo.com' : tab.url);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs max-w-[180px] cursor-pointer transition-all ${
                isActive
                  ? 'bg-neutral-900 text-white font-medium border-t-2 border-emerald-500'
                  : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-900/60'
              }`}
            >
              <Globe size={12} className={isActive ? 'text-emerald-400' : 'text-neutral-500'} />
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
          <button 
            onClick={handleHomeTap}
            className="p-1.5 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors"
            title="Go to Home"
          >
            <Home size={16} />
          </button>
          <button 
            onClick={handleReload}
            className="p-1.5 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors"
            title="Reload Page"
          >
            <RotateCw size={16} className={isLoading ? 'animate-spin text-emerald-400' : ''} />
          </button>
        </div>

        {/* URL Bar */}
        <div 
          onClick={handleUrlBarTap}
          className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1.5 border border-neutral-700/60 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/50 cursor-pointer"
        >
          <Lock size={13} className="text-emerald-400 shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onClick={handleUrlBarTap}
            inputMode="none"
            className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            placeholder="Search DuckDuckGo or enter URL"
          />
          {isLoading && <Loader2 size={13} className="animate-spin text-neutral-400 shrink-0" />}
        </div>

        <div className="flex items-center gap-1 text-neutral-400">
          <button 
            onClick={handleOpenExternal}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded-xl text-xs font-medium border border-neutral-700 transition-colors"
            title="Open Current URL in Native Android Chrome"
          >
            <ExternalLink size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Open in Chrome</span>
          </button>
        </div>
      </div>

      {/* Web Page Viewport */}
      <div className="flex-1 relative w-full h-full bg-neutral-950 overflow-hidden flex flex-col">
        {activeTab.url === DEFAULT_HOME ? (
          /* DuckDuckGo Privacy Start Page */
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-center my-auto">
            <div className="w-full max-w-xl flex flex-col items-center justify-center py-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-lg">
                  <ShieldCheck size={36} />
                </div>
                <div>
                  <span className="text-3xl font-extrabold tracking-tight text-white">DuckDuckGo</span>
                  <p className="text-xs text-emerald-400 font-mono">Live Private Web Search • Zero Telemetry</p>
                </div>
              </div>

              <div 
                onClick={() => {
                  openKeyboard({
                    value: searchQuery,
                    onChange: (val) => setSearchQuery(val),
                    onEnter: () => handleNavigate(searchQuery),
                    placeholder: 'Search the live web with DuckDuckGo...',
                  });
                }}
                className="w-full flex items-center gap-3 bg-neutral-900 border border-neutral-700/80 hover:border-neutral-600 rounded-full px-5 py-3 shadow-lg cursor-pointer"
              >
                <Search size={18} className="text-neutral-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search the web without being tracked... (tap to type)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={() => {
                    openKeyboard({
                      value: searchQuery,
                      onChange: (val) => setSearchQuery(val),
                      onEnter: () => handleNavigate(searchQuery),
                      placeholder: 'Search the live web with DuckDuckGo...',
                    });
                  }}
                  inputMode="none"
                  className="w-full bg-transparent text-sm text-white focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleNavigate(searchQuery || 'technology')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded-full shadow transition-all text-white active:scale-95"
                >
                  DuckDuckGo Live Search
                </button>
                <button
                  onClick={() => handleNavigate('https://en.m.wikipedia.org')}
                  className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-full border border-neutral-700 transition-colors text-emerald-400 active:scale-95"
                >
                  Wikipedia Live
                </button>
              </div>

              {/* FOSS Quick Shortcuts */}
              <div className="grid grid-cols-4 gap-4 mt-8 w-full max-w-md">
                {[
                  { name: 'Wikipedia', url: 'https://en.m.wikipedia.org', desc: 'Encyclopedia' },
                  { name: 'DuckDuckGo', url: 'https://lite.duckduckgo.com/lite/', desc: 'Search' },
                  { name: 'F-Droid', url: 'https://f-droid.org', desc: 'FOSS Store' },
                  { name: 'Hacker News', url: 'https://news.ycombinator.com', desc: 'Tech News' },
                  { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org', desc: 'Maps' },
                  { name: 'NPR News', url: 'https://text.npr.org', desc: 'Text News' },
                  { name: 'Archive.org', url: 'https://archive.org', desc: 'Wayback' },
                  { name: 'GitHub', url: 'https://github.com', desc: 'Code' },
                ].map((site) => (
                  <button
                    key={site.name}
                    onClick={() => handleNavigate(site.url)}
                    className="flex flex-col items-center gap-1.5 p-3 bg-neutral-800/60 hover:bg-neutral-800 rounded-2xl border border-neutral-700/50 transition-all active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-neutral-700 border border-neutral-600 flex items-center justify-center font-bold text-xs text-emerald-400 shadow">
                      {site.name[0]}
                    </div>
                    <span className="text-[11px] font-medium text-white truncate max-w-[80px]">
                      {site.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Live Proxied Real Web Viewport */
          <div className="flex-1 w-full h-full relative bg-white">
            <iframe
              ref={iframeRef}
              src={`/api/proxy/browse?url=${encodeURIComponent(activeTab.url)}`}
              className="w-full h-full border-none"
              title={activeTab.title}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        )}
      </div>
    </div>
  );
};
