import React from 'react';
import { X, Trash2, Home, ArrowLeft } from 'lucide-react';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { AppIcon } from '../common/AppIcon';
import { MULTI_OS_DOMAINS } from '../../services/multiOsHypervisor';

export const RecentsView: React.FC = () => {
  const { windows, focusWindow, closeWindow, closeAll, returnHome } = useWindow();
  const { isRecentsOpen, setIsRecentsOpen } = useSystem();

  if (!isRecentsOpen) return null;

  const handleReturnHome = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(12);
    setIsRecentsOpen(false);
    returnHome();
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(15);
    closeAll();
    setIsRecentsOpen(false);
    returnHome();
  };

  return (
    <div 
      className="fixed inset-0 z-40 bg-black/85 backdrop-blur-xl flex flex-col justify-between items-center p-4 sm:p-6 pb-16 animate-fade-in select-none"
      onClick={handleReturnHome}
    >
      {/* Top Header Bar */}
      <div 
        className="w-full max-w-4xl flex items-center justify-between text-white pt-1 px-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleReturnHome}
            className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors"
            title="Return to Home"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">Recent Applications</h2>
            <p className="text-[11px] text-neutral-400">Swipe or tap a card to resume</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {windows.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800/80 hover:bg-red-500/20 text-neutral-300 hover:text-red-400 border border-neutral-700/60 rounded-xl text-xs transition-colors"
            >
              <Trash2 size={14} />
              <span>Clear all</span>
            </button>
          )}

          <button
            onClick={handleReturnHome}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-300 hover:text-white transition-colors"
            title="Close Recents"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Center Carousel of Task Cards */}
      <div 
        className="w-full max-w-4xl flex-1 flex items-center justify-center overflow-x-auto py-6 gap-6 px-4"
        onClick={handleReturnHome}
      >
        {windows.length === 0 ? (
          <div 
            className="text-center text-neutral-400 flex flex-col items-center gap-4 my-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-3xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-500">
              <Home size={32} />
            </div>
            <div>
              <p className="text-base font-semibold text-white">No active applications</p>
              <p className="text-xs text-neutral-500 mt-1">All background tasks have been cleared</p>
            </div>
            <button
              onClick={handleReturnHome}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold rounded-full shadow-lg transition-all"
            >
              <Home size={18} />
              <span>Go to Home Screen</span>
            </button>
          </div>
        ) : (
          windows.map((win) => {
            const domainConfig = MULTI_OS_DOMAINS.find((d) => d.id === win.osDomain) || MULTI_OS_DOMAINS[4];
            return (
              <div
                key={win.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (navigator.vibrate) navigator.vibrate(12);
                  focusWindow(win.id);
                  setIsRecentsOpen(false);
                }}
                style={{ borderColor: domainConfig.colorHex }}
                className="relative w-64 sm:w-72 h-84 sm:h-96 bg-neutral-900 border-2 rounded-3xl shadow-2xl flex flex-col overflow-hidden shrink-0 cursor-pointer transform hover:scale-105 active:scale-95 transition-all group"
              >
                {/* Card Titlebar */}
                <div className="p-3 bg-neutral-800/90 flex items-center justify-between border-b border-neutral-700/50">
                  <div className="flex items-center gap-2">
                    <AppIcon appId={win.appId} size="sm" />
                    <span className="text-xs font-semibold text-white truncate max-w-[110px]">
                      {win.title}
                    </span>
                    <span 
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold"
                      style={{ backgroundColor: `${domainConfig.colorHex}25`, color: domainConfig.colorHex }}
                    >
                      {domainConfig.badgeLabel.split(' ')[0]}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeWindow(win.id);
                    }}
                    className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-full transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Card Preview Snapshot */}
                <div className="flex-1 bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
                  <AppIcon appId={win.appId} size="lg" className="mb-3 opacity-80 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-neutral-400 capitalize">{win.appId}</span>
                  <span className="text-[10px] text-neutral-500 mt-1 font-mono">Domain: {domainConfig.name}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Navigation Bar: Always accessible Return to Home button */}
      <div 
        className="w-full flex items-center justify-center pt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleReturnHome}
          className="flex items-center gap-2.5 px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-full shadow-2xl border border-neutral-700/80 transition-all cursor-pointer"
        >
          <Home size={18} className="text-emerald-400" />
          <span>Return to Home Screen</span>
        </button>
      </div>
    </div>
  );
};
