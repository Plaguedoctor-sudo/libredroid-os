import React, { useState } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Wifi, 
  Copy, 
  Share2, 
  ArrowRightLeft, 
  CheckCircle, 
  ExternalLink, 
  PhoneCall, 
  MessageSquare, 
  FolderSync, 
  Sparkles,
  Laptop
} from 'lucide-react';

interface SharedFile {
  name: string;
  size: string;
  type: string;
  direction: 'received' | 'sent';
  time: string;
}

export const PadConnectApp: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [phoneModel] = useState('OnePlus 12 5G (Dr. Nitin)');
  const [phoneBattery] = useState(86);
  const [cellularSignal] = useState('5G (Jio True 5G)');
  const [sharedClipboardEnabled, setSharedClipboardEnabled] = useState(true);
  const [notificationSync, setNotificationSync] = useState(true);
  const [autoHotspot, setAutoHotspot] = useState(true);
  const [screenMirrorActive, setScreenMirrorActive] = useState(false);
  const [clipboardText, setClipboardText] = useState('https://github.com/nitin/libredroid-os');
  const [copiedStatus, setCopiedStatus] = useState(false);

  const [recentTransfers] = useState<SharedFile[]>([
    { name: 'IMG_20261103_MedicalScan.jpg', size: '4.2 MB', type: 'Image', direction: 'received', time: '10 mins ago' },
    { name: 'LibreDroid_Architecture_v2.pdf', size: '12.8 MB', type: 'Document', direction: 'sent', time: '1 hour ago' },
    { name: 'AudioMemo_PatientPrescription.webm', size: '1.4 MB', type: 'Audio', direction: 'received', time: '3 hours ago' },
  ]);

  const copyToTabletClipboard = () => {
    navigator.clipboard?.writeText(clipboardText);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white font-sans overflow-y-auto select-none">
      {/* Top Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
            <ArrowRightLeft size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Multi-Screen Connect (Pad Synergy)</h1>
            <p className="text-[11px] text-neutral-400">OnePlus Cross-Device Interconnect • Shared Clipboard & Screen Mirror</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-semibold">Phone Connected</span>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Device Status Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-blue-950/20 border border-neutral-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-28 rounded-2xl bg-neutral-800 border-2 border-neutral-700 flex flex-col items-center justify-between py-2 shadow-2xl relative">
              <span className="w-4 h-1 bg-neutral-600 rounded-full" />
              <Smartphone size={24} className="text-cyan-400" />
              <span className="w-2 h-2 rounded-full border border-neutral-600" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-cyan-400 font-bold">Primary Mobile Link</div>
              <h2 className="text-lg font-bold text-white mt-0.5">{phoneModel}</h2>
              <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1 font-mono">
                <span>🔋 {phoneBattery}% Battery</span>
                <span>•</span>
                <span>📶 {cellularSignal}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setScreenMirrorActive(!screenMirrorActive)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                screenMirrorActive
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
              }`}
            >
              <Smartphone size={16} />
              {screenMirrorActive ? 'Close Mirror Window' : 'Mirror Phone Screen'}
            </button>
          </div>
        </div>

        {/* Live Phone Screen Mirror View (if active) */}
        {screenMirrorActive && (
          <div className="p-6 rounded-3xl bg-black border border-cyan-500/40 shadow-2xl flex flex-col items-center justify-center relative">
            <div className="flex items-center justify-between w-full mb-4 px-2">
              <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5">
                <Smartphone size={14} /> Live OnePlus Mirror Window (Touch & Swipe Enabled)
              </span>
              <button
                onClick={() => setScreenMirrorActive(false)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <div className="w-72 h-[480px] bg-neutral-900 rounded-[2.5rem] border-4 border-neutral-700 shadow-2xl overflow-hidden relative flex flex-col justify-between p-4">
              {/* Phone Status bar */}
              <div className="flex justify-between items-center text-[10px] text-neutral-400 px-3">
                <span>01:15</span>
                <span className="w-12 h-3.5 bg-black rounded-full" />
                <span>5G 86%</span>
              </div>

              {/* Phone Content Simulation */}
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <Smartphone size={40} className="text-cyan-400 mb-2 animate-bounce" />
                <h4 className="text-sm font-bold text-white">OnePlus Mobile Screen</h4>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Full bidirectional touch control. Tap icons, answer phone calls, and reply to WhatsApp & SMS.
                </p>
                <div className="grid grid-cols-3 gap-3 mt-6 w-full">
                  <div className="p-2.5 bg-neutral-800 rounded-xl flex flex-col items-center text-[10px]">
                    <PhoneCall size={16} className="text-emerald-400 mb-1" /> Call
                  </div>
                  <div className="p-2.5 bg-neutral-800 rounded-xl flex flex-col items-center text-[10px]">
                    <MessageSquare size={16} className="text-sky-400 mb-1" /> SMS
                  </div>
                  <div className="p-2.5 bg-neutral-800 rounded-xl flex flex-col items-center text-[10px]">
                    <Share2 size={16} className="text-amber-400 mb-1" /> Share
                  </div>
                </div>
              </div>

              {/* Home indicator */}
              <div className="w-24 h-1 bg-white/40 rounded-full mx-auto" />
            </div>
          </div>
        )}

        {/* Shared Universal Clipboard */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Copy size={14} className="text-cyan-400" />
              Shared Cross-Device Clipboard
            </h3>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle size={12} /> Sync Active
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                <Copy size={16} />
              </div>
              <div className="truncate">
                <span className="text-[10px] text-neutral-500 block uppercase">Last Copied on Phone</span>
                <span className="text-xs text-neutral-200 font-mono truncate">{clipboardText}</span>
              </div>
            </div>

            <button
              onClick={copyToTabletClipboard}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-cyan-400 transition-colors shrink-0 cursor-pointer"
            >
              {copiedStatus ? 'Pasted!' : 'Paste to Tab'}
            </button>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-white">Notification Relay</h4>
              <p className="text-[10px] text-neutral-400">Calls & texts ring on tab</p>
            </div>
            <input
              type="checkbox"
              checked={notificationSync}
              onChange={(e) => setNotificationSync(e.target.checked)}
              className="accent-cyan-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-white">Auto 5G Hotspot</h4>
              <p className="text-[10px] text-neutral-400">Zero-tap mobile data</p>
            </div>
            <input
              type="checkbox"
              checked={autoHotspot}
              onChange={(e) => setAutoHotspot(e.target.checked)}
              className="accent-cyan-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-white">Drag & Drop Relay</h4>
              <p className="text-[10px] text-neutral-400">P2P file shuttle active</p>
            </div>
            <input
              type="checkbox"
              checked={sharedClipboardEnabled}
              onChange={(e) => setSharedClipboardEnabled(e.target.checked)}
              className="accent-cyan-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        {/* Recent File Transfers */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <FolderSync size={14} className="text-blue-400" />
              Recent Cross-Device File Transfers
            </h3>
            <span className="text-[11px] text-neutral-500">Wi-Fi Direct P2P (80 MB/s)</span>
          </div>

          <div className="divide-y divide-neutral-800/60">
            {recentTransfers.map((file, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    file.direction === 'received' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {file.direction === 'received' ? '↓ Received' : '↑ Sent'}
                  </span>
                  <div>
                    <span className="font-semibold text-neutral-200 block">{file.name}</span>
                    <span className="text-[10px] text-neutral-500">{file.size} • {file.time}</span>
                  </div>
                </div>

                <button className="text-neutral-400 hover:text-white p-1 rounded-lg">
                  <ExternalLink size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PadConnectApp;
