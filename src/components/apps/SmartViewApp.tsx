import React, { useState } from 'react';
import { 
  Tv, 
  Monitor, 
  Laptop, 
  Cast, 
  Wifi, 
  CheckCircle2, 
  RefreshCw, 
  Smartphone, 
  Volume2, 
  Layers, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

interface DisplayTarget {
  id: string;
  name: string;
  type: 'tv' | 'pc' | 'dex';
  resolution: string;
  isAvailable: boolean;
}

export const SmartViewApp: React.FC = () => {
  const { setDeviceMode, deviceMode } = useSystem();
  const [isSearching, setIsSearching] = useState(false);
  const [connectedTarget, setConnectedTarget] = useState<string | null>(null);

  const targets: DisplayTarget[] = [
    { id: '1', name: 'Samsung Crystal UHD 4K (Living Room)', type: 'tv', resolution: '3840 x 2160', isAvailable: true },
    { id: '2', name: 'Samsung Smart Monitor M8', type: 'pc', resolution: '1920 x 1080', isAvailable: true },
    { id: '3', name: 'Windows 11 Workstation (Phone Link)', type: 'pc', resolution: '2560 x 1440', isAvailable: true },
  ];

  const handleRefresh = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 1000);
  };

  const handleConnect = (targetId: string) => {
    if (connectedTarget === targetId) {
      setConnectedTarget(null);
    } else {
      setConnectedTarget(targetId);
      if (navigator.vibrate) navigator.vibrate([15, 20]);
    }
  };

  return (
    <div className="w-full h-full bg-[#0c0d12] text-white flex flex-col overflow-hidden font-sans">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#12131a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow">
            <Cast size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              Samsung Smart View & DeX
            </h2>
            <p className="text-[11px] text-neutral-400">Wireless Screen Mirroring & PC Connect</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          title="Scan for Displays"
        >
          <RefreshCw size={15} className={isSearching ? 'animate-spin text-blue-400' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* Samsung DeX Launcher Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-500/30 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Laptop size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Samsung DeX Mode
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-semibold">
                  Desktop PC Experience
                </span>
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Switch your Galaxy M14 into a full multi-window desktop interface with taskbar.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setDeviceMode(deviceMode === 'desktop' ? 'phone' : 'desktop');
              if (navigator.vibrate) navigator.vibrate(20);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-lg transition-all"
          >
            {deviceMode === 'desktop' ? 'Exit DeX' : 'Start DeX'}
          </button>
        </div>

        {/* Nearby Displays Section */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Available Displays & TVs ({targets.length})
            </h4>
            <span className="text-[11px] text-blue-400 flex items-center gap-1">
              <Wifi size={12} /> Wi-Fi Direct Ready
            </span>
          </div>

          <div className="space-y-2.5">
            {targets.map((target) => {
              const isConnected = connectedTarget === target.id;
              return (
                <div
                  key={target.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    isConnected
                      ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-950/50'
                      : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      target.type === 'tv'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {target.type === 'tv' ? <Tv size={20} /> : <Monitor size={20} />}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        {target.name}
                        {isConnected && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                            <CheckCircle2 size={10} /> Active
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        {target.resolution} • Miracast 60fps
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleConnect(target.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isConnected
                        ? 'bg-neutral-800 text-rose-400 hover:bg-rose-500/20 border border-neutral-700'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {isConnected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Link to Windows Card */}
        <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Laptop size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-white">Link to Windows (Microsoft Phone Link)</h4>
              <p className="text-[11px] text-neutral-400">Sync SMS, Photos & Notifications to your PC</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-lg">
            Connected
          </span>
        </div>

      </div>
    </div>
  );
};
