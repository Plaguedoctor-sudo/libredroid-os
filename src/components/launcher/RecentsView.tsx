import React from 'react';
import { X, Trash2, SplitSquareVertical } from 'lucide-react';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { AppIcon } from '../common/AppIcon';

export const RecentsView: React.FC = () => {
  const { windows, focusWindow, closeWindow, closeAll } = useWindow();
  const { isRecentsOpen, setIsRecentsOpen, actualDevice } = useSystem();

  if (!isRecentsOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col justify-between items-center p-4 sm:p-8 animate-fade-in select-none"
      onClick={() => setIsRecentsOpen(false)}
    >
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between text-white pt-2">
        <h2 className="text-lg font-bold tracking-tight">Recent Applications</h2>
        {windows.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeAll();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800/80 hover:bg-red-500/20 text-neutral-300 hover:text-red-400 border border-neutral-700/60 rounded-xl text-xs transition-colors"
          >
            <Trash2 size={14} />
            <span>Clear all</span>
          </button>
        )}
      </div>

      {/* Center Carousel of Task Cards */}
      <div 
        className="w-full max-w-4xl flex-1 flex items-center justify-center overflow-x-auto py-6 gap-6 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {windows.length === 0 ? (
          <div className="text-center text-neutral-400">
            <p className="text-base font-medium">No recent apps</p>
            <p className="text-xs text-neutral-500 mt-1">Open apps from the launcher or app drawer</p>
          </div>
        ) : (
          windows.map((win) => (
            <div
              key={win.id}
              onClick={() => {
                focusWindow(win.id);
                setIsRecentsOpen(false);
              }}
              className="relative w-64 sm:w-72 h-96 bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden shrink-0 cursor-pointer transform hover:scale-105 transition-all group"
            >
              {/* Card Titlebar */}
              <div className="p-3 bg-neutral-800/90 flex items-center justify-between border-b border-neutral-700/50">
                <div className="flex items-center gap-2">
                  <AppIcon appId={win.appId} size="sm" />
                  <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                    {win.title}
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
                <span className="text-[10px] text-neutral-600 mt-1">Active Process #PID-{win.id}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Navigation Tip */}
      <div className="text-xs text-neutral-400 pb-2">
        Tap a window to resume • Swipe or tap outside to return
      </div>
    </div>
  );
};
