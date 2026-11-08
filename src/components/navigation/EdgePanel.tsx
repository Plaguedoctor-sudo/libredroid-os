import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Camera, 
  Flashlight, 
  Clipboard, 
  Calculator, 
  FileText, 
  FolderLock, 
  ShieldCheck, 
  Layers, 
  Sparkles,
  X
} from 'lucide-react';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';

export const EdgePanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'apps' | 'tools' | 'clipboard'>('apps');
  const { openApp } = useWindow();
  const { toggleQuickSetting } = useSystem();

  const appShortcuts = [
    { id: 'secure_folder', name: 'Secure Folder', icon: FolderLock, color: 'bg-blue-600/30 text-blue-400 border-blue-500/40' },
    { id: 'device_care', name: 'Device Care', icon: ShieldCheck, color: 'bg-cyan-600/30 text-cyan-400 border-cyan-500/40' },
    { id: 'smart_view', name: 'Smart View', icon: Sparkles, color: 'bg-purple-600/30 text-purple-400 border-purple-500/40' },
    { id: 'calculator', name: 'Calculator', icon: Calculator, color: 'bg-emerald-600/30 text-emerald-400 border-emerald-500/40' },
    { id: 'notes', name: 'Samsung Notes', icon: FileText, color: 'bg-amber-600/30 text-amber-400 border-amber-500/40' },
  ];

  const tools = [
    {
      id: 'flashlight',
      name: 'Flashlight',
      icon: Flashlight,
      action: () => toggleQuickSetting('flashlight'),
    },
    {
      id: 'screenshot',
      name: 'Smart Select',
      icon: Camera,
      action: () => {
        if (navigator.vibrate) navigator.vibrate(20);
        setIsOpen(false);
      },
    },
    {
      id: 'compass',
      name: 'Compass',
      icon: Compass,
      action: () => {
        openApp('hardware');
        setIsOpen(false);
      },
    },
  ];

  return (
    <>
      {/* Floating Edge Bezel Handle */}
      {!isOpen && (
        <div 
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(12);
            setIsOpen(true);
          }}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[9985] w-2.5 hover:w-4.5 h-20 bg-blue-500/60 hover:bg-blue-400 rounded-l-full shadow-lg shadow-blue-500/30 cursor-pointer transition-all duration-200 flex items-center justify-center group"
          title="Samsung Edge Panel — Click or swipe to open"
        >
          <div className="w-0.5 h-8 rounded-full bg-white/90 group-hover:h-10 transition-all" />
        </div>
      )}

      {/* Expanded Edge Panel Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[9990] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          <div className="relative w-64 h-full bg-[#10121a]/95 border-l border-white/10 shadow-2xl flex flex-col z-10 text-white font-sans backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 bg-[#151722]/80">
              <span className="text-xs font-bold tracking-tight text-blue-400">Samsung Edge Panel</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 text-[11px] font-semibold">
              <button
                onClick={() => setActiveTab('apps')}
                className={`flex-1 py-2 text-center transition-colors ${
                  activeTab === 'apps' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/10' : 'text-neutral-400'
                }`}
              >
                Apps
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`flex-1 py-2 text-center transition-colors ${
                  activeTab === 'tools' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/10' : 'text-neutral-400'
                }`}
              >
                Quick Tools
              </button>
              <button
                onClick={() => setActiveTab('clipboard')}
                className={`flex-1 py-2 text-center transition-colors ${
                  activeTab === 'clipboard' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/10' : 'text-neutral-400'
                }`}
              >
                Clipboard
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTab === 'apps' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {appShortcuts.map((app) => {
                    const Icon = app.icon;
                    return (
                      <button
                        key={app.id}
                        onClick={() => {
                          openApp(app.id);
                          setIsOpen(false);
                        }}
                        className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 transition-all text-center group"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow ${app.color}`}>
                          <Icon size={20} />
                        </div>
                        <span className="text-[11px] text-neutral-300 font-medium group-hover:text-white">
                          {app.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'tools' && (
                <div className="space-y-2">
                  {tools.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={t.action}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                          <Icon size={16} />
                        </div>
                        <span className="text-xs font-semibold text-neutral-200">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'clipboard' && (
                <div className="space-y-2 text-xs text-neutral-300">
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                    <p className="font-mono text-[11px] text-blue-300">SM-M146B_Exynos1330_5G</p>
                    <span className="text-[10px] text-neutral-500 mt-1 block">Copied 5m ago</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                    <p className="text-[11px] text-neutral-300">https://github.com/libredroid/os</p>
                    <span className="text-[10px] text-neutral-500 mt-1 block">Copied 2h ago</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/5 bg-[#151722]/60 text-center text-[10px] text-neutral-500">
              One UI 6.0 Edge Engine
            </div>
          </div>
        </div>
      )}
    </>
  );
};
