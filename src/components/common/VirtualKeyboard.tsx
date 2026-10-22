import React, { useState } from 'react';
import { 
  Delete, 
  CornerDownLeft, 
  ChevronDown, 
  ArrowUp, 
  X, 
  Sparkles, 
  Search,
  Globe
} from 'lucide-react';
import { useVirtualKeyboard } from '../../context/KeyboardContext';

export const VirtualKeyboard: React.FC = () => {
  const { 
    isKeyboardOpen, 
    activeTarget, 
    closeKeyboard, 
    typeCharacter, 
    deleteCharacter, 
    clearText, 
    submitText 
  } = useVirtualKeyboard();

  const [isShift, setIsShift] = useState(false);
  const [isSymbols, setIsSymbols] = useState(false);

  if (!isKeyboardOpen) return null;

  const letterRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  const symbolRows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['@', '#', '$', '%', '&', '*', '-', '+', '=', '/'],
    ['_', '(', ')', '<', '>', '!', '?', '"', "'", ':'],
  ];

  const handleKeyClick = (key: string) => {
    const char = isShift ? key.toUpperCase() : key;
    typeCharacter(char);
    // If shift was active and single tap, return to lowercase after one key
    if (isShift) setIsShift(false);
  };

  const quickChips = ['F-Droid', 'Tor', 'Camera', 'Terminal', 'Nextcloud', 'Settings', 'Waydroid'];

  return (
    <div 
      className="fixed inset-x-0 bottom-0 z-[60] bg-neutral-950/98 backdrop-blur-2xl border-t border-neutral-800 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col p-2 sm:p-3 select-none animate-slide-up touch-manipulation max-w-2xl mx-auto rounded-t-3xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Accessory Bar */}
      <div className="flex items-center justify-between px-2 pb-2 border-b border-neutral-800/80 mb-2 gap-2">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-[75%] scrollbar-none">
          {quickChips.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                if (activeTarget) {
                  activeTarget.onChange(chip);
                  if (activeTarget.onEnter) activeTarget.onEnter();
                  closeKeyboard();
                }
              }}
              className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 text-[11px] text-neutral-300 font-medium whitespace-nowrap active:scale-95 transition-all"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Clear & Dismiss Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTarget?.value && (
            <button
              onClick={clearText}
              className="p-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Clear Search Query"
            >
              <X size={14} />
            </button>
          )}

          <button
            onClick={closeKeyboard}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold active:scale-95 transition-all shadow"
            title="Dismiss LibreDroid Keyboard"
          >
            <ChevronDown size={14} />
            <span className="text-[11px]">Hide</span>
          </button>
        </div>
      </div>

      {/* Main Keyboard Grid */}
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {isSymbols ? (
          // SYMBOLS KEYBOARD
          symbolRows.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
              {row.map((sym) => (
                <button
                  key={sym}
                  onClick={() => typeCharacter(sym)}
                  className="flex-1 max-w-[48px] h-11 sm:h-12 bg-neutral-800/90 hover:bg-neutral-750 active:bg-neutral-700 text-white font-medium text-sm sm:text-base rounded-xl border border-neutral-700/60 shadow flex items-center justify-center active:scale-95 transition-transform"
                >
                  {sym}
                </button>
              ))}
              {rIdx === 2 && (
                <button
                  onClick={deleteCharacter}
                  className="w-12 sm:w-14 h-11 sm:h-12 bg-neutral-850 hover:bg-neutral-800 active:bg-neutral-700 text-neutral-300 rounded-xl border border-neutral-700/60 shadow flex items-center justify-center active:scale-95 transition-transform"
                  title="Backspace"
                >
                  <Delete size={18} />
                </button>
              )}
            </div>
          ))
        ) : (
          // QWERTY KEYBOARD
          <>
            {/* Row 1 */}
            <div className="flex justify-center gap-1 sm:gap-1.5">
              {letterRows[0].map((k) => (
                <button
                  key={k}
                  onClick={() => handleKeyClick(k)}
                  className="flex-1 max-w-[48px] h-11 sm:h-12 bg-neutral-800/90 hover:bg-neutral-750 active:bg-neutral-700 text-white font-medium text-sm sm:text-base rounded-xl border border-neutral-700/60 shadow flex items-center justify-center active:scale-95 transition-transform uppercase"
                >
                  {isShift ? k.toUpperCase() : k}
                </button>
              ))}
            </div>

            {/* Row 2 */}
            <div className="flex justify-center gap-1 sm:gap-1.5 px-3">
              {letterRows[1].map((k) => (
                <button
                  key={k}
                  onClick={() => handleKeyClick(k)}
                  className="flex-1 max-w-[48px] h-11 sm:h-12 bg-neutral-800/90 hover:bg-neutral-750 active:bg-neutral-700 text-white font-medium text-sm sm:text-base rounded-xl border border-neutral-700/60 shadow flex items-center justify-center active:scale-95 transition-transform uppercase"
                >
                  {isShift ? k.toUpperCase() : k}
                </button>
              ))}
            </div>

            {/* Row 3 with Shift & Backspace */}
            <div className="flex justify-center gap-1 sm:gap-1.5">
              <button
                onClick={() => setIsShift(!isShift)}
                className={`w-11 sm:w-13 h-11 sm:h-12 rounded-xl border shadow flex items-center justify-center active:scale-95 transition-all ${
                  isShift 
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' 
                    : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border-neutral-700/60'
                }`}
                title="Shift / Caps"
              >
                <ArrowUp size={18} />
              </button>

              {letterRows[2].map((k) => (
                <button
                  key={k}
                  onClick={() => handleKeyClick(k)}
                  className="flex-1 max-w-[48px] h-11 sm:h-12 bg-neutral-800/90 hover:bg-neutral-750 active:bg-neutral-700 text-white font-medium text-sm sm:text-base rounded-xl border border-neutral-700/60 shadow flex items-center justify-center active:scale-95 transition-transform uppercase"
                >
                  {isShift ? k.toUpperCase() : k}
                </button>
              ))}

              <button
                onClick={deleteCharacter}
                className="w-11 sm:w-13 h-11 sm:h-12 bg-neutral-850 hover:bg-neutral-800 active:bg-neutral-700 text-neutral-300 rounded-xl border border-neutral-700/60 shadow flex items-center justify-center active:scale-95 transition-transform"
                title="Backspace"
              >
                <Delete size={18} />
              </button>
            </div>
          </>
        )}

        {/* Bottom Row: Mode Toggle, Comma, Space, Dot, Search/Enter */}
        <div className="flex justify-center gap-1 sm:gap-1.5 pt-0.5">
          <button
            onClick={() => setIsSymbols(!isSymbols)}
            className="w-14 sm:w-16 h-11 sm:h-12 bg-neutral-850 hover:bg-neutral-800 active:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl border border-neutral-700/60 shadow flex items-center justify-center active:scale-95 transition-transform"
          >
            {isSymbols ? 'ABC' : '?123'}
          </button>

          <button
            onClick={() => typeCharacter(',')}
            className="w-10 sm:w-11 h-11 sm:h-12 bg-neutral-800/90 hover:bg-neutral-750 active:bg-neutral-700 text-white font-medium text-sm sm:text-base rounded-xl border border-neutral-700/60 shadow flex items-center justify-center active:scale-95 transition-transform"
          >
            ,
          </button>

          {/* Spacebar */}
          <button
            onClick={() => typeCharacter(' ')}
            className="flex-1 max-w-sm h-11 sm:h-12 bg-neutral-800/90 hover:bg-neutral-750 active:bg-neutral-700 text-neutral-400 text-xs font-semibold rounded-xl border border-neutral-700/60 shadow flex items-center justify-center active:scale-95 transition-transform"
          >
            LibreDroid Space
          </button>

          <button
            onClick={() => typeCharacter('.')}
            className="w-10 sm:w-11 h-11 sm:h-12 bg-neutral-800/90 hover:bg-neutral-750 active:bg-neutral-700 text-white font-medium text-sm sm:text-base rounded-xl border border-neutral-700/60 shadow flex items-center justify-center active:scale-95 transition-transform"
          >
            .
          </button>

          {/* Search / Enter Action Key */}
          <button
            onClick={submitText}
            className="w-16 sm:w-20 h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1 active:scale-95 transition-transform"
            title="Search / Enter"
          >
            <Search size={14} />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};
