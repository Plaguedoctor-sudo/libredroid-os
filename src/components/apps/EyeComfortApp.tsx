import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Sliders, 
  Eye, 
  BookOpen, 
  Layers, 
  Monitor, 
  Sparkles, 
  ToggleLeft, 
  ToggleRight,
  Gauge
} from 'lucide-react';

export const EyeComfortApp: React.FC = () => {
  // Read existing settings from localStorage or defaults
  const [eyeComfortEnabled, setEyeComfortEnabled] = useState(() => {
    return localStorage.getItem('lrd_eye_comfort') === 'true';
  });
  const [warmthLevel, setWarmthLevel] = useState(() => {
    return Number(localStorage.getItem('lrd_warmth') || 40);
  });
  const [grayscaleEnabled, setGrayscaleEnabled] = useState(() => {
    return localStorage.getItem('lrd_grayscale') === 'true';
  });
  const [refreshRate, setRefreshRate] = useState<'60' | '90' | 'auto'>(() => {
    return (localStorage.getItem('lrd_refresh_rate') as any) || '90';
  });
  const [colorMode, setColorMode] = useState<'vivid' | 'natural' | 'pro'>('vivid');
  const [darkThemeContrast, setDarkThemeContrast] = useState<'enhanced' | 'medium' | 'gentle'>('enhanced');

  // Apply real global display filters to the DOM root
  useEffect(() => {
    localStorage.setItem('lrd_eye_comfort', String(eyeComfortEnabled));
    localStorage.setItem('lrd_warmth', String(warmthLevel));
    localStorage.setItem('lrd_grayscale', String(grayscaleEnabled));
    localStorage.setItem('lrd_refresh_rate', refreshRate);

    // Apply global overlay filter style
    let filterStyle = document.getElementById('lrd-display-filter-style');
    if (!filterStyle) {
      filterStyle = document.createElement('style');
      filterStyle.id = 'lrd-display-filter-style';
      document.head.appendChild(filterStyle);
    }

    const filters: string[] = [];
    if (grayscaleEnabled) {
      filters.push('grayscale(100%)');
    }
    if (eyeComfortEnabled) {
      // Warm amber hue shift
      const sepiaVal = (warmthLevel / 100) * 0.45;
      filters.push(`sepia(${sepiaVal}) hue-rotate(-15deg)`);
    }

    if (filters.length > 0) {
      filterStyle.textContent = `
        #lrd-app-layer {
          filter: ${filters.join(' ')} !important;
          transition: filter 0.3s ease;
        }
      `;
    } else {
      filterStyle.textContent = `
        #lrd-app-layer {
          filter: none !important;
          transition: filter 0.3s ease;
        }
      `;
    }
  }, [eyeComfortEnabled, warmthLevel, grayscaleEnabled, refreshRate]);

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white font-sans overflow-y-auto select-none">
      {/* Top Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Eye size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Display & Eye Comfort</h1>
            <p className="text-[11px] text-neutral-400">ColorOS MiraVision™ Display Engine • Refresh Rate & Blue Light</p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
          {refreshRate === 'auto' ? 'Dynamic VRR' : `${refreshRate}Hz Ultra-Smooth`}
        </span>
      </div>

      <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Eye Comfort Master Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-neutral-900 to-amber-950/20 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Sun size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Eye Comfort (Night Shield)</h3>
                <p className="text-xs text-neutral-400">Filters blue light to reduce eye fatigue and improve sleep quality</p>
              </div>
            </div>
            <button
              onClick={() => setEyeComfortEnabled(!eyeComfortEnabled)}
              className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              {eyeComfortEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-neutral-600" />}
            </button>
          </div>

          {eyeComfortEnabled && (
            <div className="pt-3 border-t border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span>Color Temperature</span>
                <span className="font-mono text-amber-400">{warmthLevel}% Warm</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={warmthLevel}
                onChange={(e) => setWarmthLevel(Number(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
                <span>Cooler (Default)</span>
                <span>Warmer (Amber)</span>
              </div>
            </div>
          )}
        </div>

        {/* E-Ink Reading Mode */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-800 text-neutral-300">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Bedtime & Reading Mode (Monochrome)</h3>
              <p className="text-xs text-neutral-400">Converts full screen to paper-like grayscale E-Ink display</p>
            </div>
          </div>
          <button
            onClick={() => setGrayscaleEnabled(!grayscaleEnabled)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            {grayscaleEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-neutral-600" />}
          </button>
        </div>

        {/* Refresh Rate Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Gauge size={14} className="text-cyan-400" />
            Screen Refresh Rate (Panel Frequency)
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'auto', title: 'Auto-Select (VRR)', desc: 'Dynamic 60Hz-90Hz for balanced smoothness and battery' },
              { id: '90', title: 'High (90 Hz)', desc: 'Ultra-smooth animation and touch response across entire OS' },
              { id: '60', title: 'Standard (60 Hz)', desc: 'Conserves maximum battery life for prolonged reading' },
            ].map((rate) => {
              const active = refreshRate === rate.id;
              return (
                <button
                  key={rate.id}
                  onClick={() => setRefreshRate(rate.id as any)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    active
                      ? 'bg-neutral-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                      : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-sm font-semibold text-white">{rate.title}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-cyan-400' : 'bg-neutral-700'}`} />
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-tight">{rate.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Calibration Profile */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Sliders size={14} className="text-purple-400" />
            Screen Color Mode
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'vivid', title: 'Vivid Mode', desc: 'DCI-P3 wide color gamut with saturated, punchy tones' },
              { id: 'natural', title: 'Natural Mode', desc: 'Standard sRGB with true-to-life studio color accuracy' },
              { id: 'pro', title: 'Cinematic Pro', desc: 'Optimized for HDR movie viewing and video color grading' },
            ].map((c) => {
              const active = colorMode === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setColorMode(c.id as any)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    active
                      ? 'bg-neutral-800/90 border-purple-500/60 shadow-lg shadow-purple-500/10'
                      : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-sm font-semibold text-white">{c.title}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-purple-400' : 'bg-neutral-700'}`} />
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-tight">{c.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dark Theme Contrast Enhancement (ColorOS Signature) */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Moon size={14} className="text-sky-400" />
              Dark Mode Contrast Style
            </h3>
            <span className="text-xs text-neutral-400 font-mono capitalize">{darkThemeContrast} Contrast</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'enhanced', label: 'Enhanced (#000000)', desc: 'Pure pitch black for OLED/IPS energy savings' },
              { id: 'medium', label: 'Medium (#121212)', desc: 'Subtle dark charcoal for comfortable night reading' },
              { id: 'gentle', label: 'Gentle (#1e1e1e)', desc: 'Soft dark slate with reduced harsh contrast' },
            ].map((style) => (
              <button
                key={style.id}
                onClick={() => setDarkThemeContrast(style.id as any)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  darkThemeContrast === style.id
                    ? 'bg-neutral-800 border-sky-500/50 text-white'
                    : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-semibold">{style.label}</div>
                <div className="text-[10px] text-neutral-500 mt-1">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default EyeComfortApp;
