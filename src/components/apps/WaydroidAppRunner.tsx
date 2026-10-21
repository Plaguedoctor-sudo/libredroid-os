import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  Search, 
  Compass, 
  MapPin, 
  Send, 
  Mail, 
  ShieldCheck, 
  Tv, 
  Film,
  RotateCcw
} from 'lucide-react';

interface WaydroidAppRunnerProps {
  appId: string;
  title: string;
}

export const WaydroidAppRunner: React.FC<WaydroidAppRunnerProps> = ({ appId, title }) => {
  // 1. VLC Media Player
  if (appId === 'org.videolan.vlc') {
    return <VLCPlayerView />;
  }

  // 2. NewPipe YouTube Player
  if (appId === 'org.schabi.newpipe') {
    return <NewPipeView />;
  }

  // 3. OsmAnd Maps
  if (appId === 'net.osmand.plus') {
    return <OsmAndMapView />;
  }

  // 4. Element Messenger
  if (appId === 'im.vector.app') {
    return <ElementMessengerView />;
  }

  // 5. K-9 Mail
  if (appId === 'com.fsck.k9') {
    return <K9MailView />;
  }

  // Generic Sideloaded APK Runner Sandbox
  return (
    <div className="flex-1 w-full h-full bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center shadow-2xl mb-4 border border-emerald-500/30">
        <Play size={28} className="text-white ml-1" />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-xs text-neutral-400 mt-1 font-mono">{appId}</p>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mt-6 max-w-sm w-full text-left space-y-2 text-xs">
        <div className="flex justify-between text-neutral-400">
          <span>Container Runtime:</span>
          <span className="text-emerald-400 font-mono">Waydroid AOSP 13</span>
        </div>
        <div className="flex justify-between text-neutral-400">
          <span>Hardware Graphics:</span>
          <span className="text-purple-300 font-mono">Mesa Gallium / VirGL</span>
        </div>
        <div className="flex justify-between text-neutral-400">
          <span>Google Play Services:</span>
          <span className="text-emerald-400 font-mono">microG Emulated</span>
        </div>
        <div className="flex justify-between text-neutral-400">
          <span>App Sandbox:</span>
          <span className="text-blue-400 font-mono">LXC Isolated / Enforcing</span>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500">
        <ShieldCheck size={14} className="text-emerald-400" />
        <span>Execution status: Active & Responsive</span>
      </div>
    </div>
  );
};

// Sub-app: VLC
const VLCPlayerView: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <div className="flex-1 w-full h-full bg-neutral-950 text-white flex flex-col overflow-hidden">
      <div className="p-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-orange-400 font-bold">
          <Film size={16} />
          <span>VLC Media Player (FOSS)</span>
        </div>
        <span className="text-neutral-400">Hardware Acceleration: On</span>
      </div>
      <div className="flex-1 relative flex items-center justify-center bg-black">
        <video
          className="w-full h-full object-contain"
          poster="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80"
          controls
        />
      </div>
      <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-xs">
        <span className="text-neutral-400">Big_Buck_Bunny_1080p_60fps.mkv (No DRM)</span>
        <span className="text-orange-400 font-mono">Decoded via FFmpeg</span>
      </div>
    </div>
  );
};

// Sub-app: NewPipe
const NewPipeView: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full bg-neutral-950 text-white flex flex-col overflow-hidden">
      <div className="p-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-red-500 font-bold">
          <Tv size={16} />
          <span>NewPipe</span>
        </div>
        <div className="flex-1 max-w-xs bg-neutral-800 rounded-full px-3 py-1 flex items-center gap-2 text-neutral-400">
          <Search size={12} />
          <input
            placeholder="Search without Google tracking..."
            className="w-full bg-transparent text-xs text-white focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          {
            title: 'Linux 6.6 on Mobile: The End of Proprietary Mobile OSes',
            channel: 'Free Software Foundation',
            views: '342K views',
            thumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
          },
          {
            title: 'How to Build an Independent Smartphone in 2026',
            channel: 'FOSS Mobile Lab',
            views: '189K views',
            thumb: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
          },
        ].map((video, i) => (
          <div key={i} className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800">
            <img src={video.thumb} alt={video.title} className="w-full h-36 object-cover" />
            <div className="p-3">
              <h4 className="text-xs font-bold line-clamp-2">{video.title}</h4>
              <p className="text-[11px] text-neutral-400 mt-1">{video.channel} • {video.views}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Sub-app: OsmAnd Maps
const OsmAndMapView: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full bg-neutral-950 text-white flex flex-col overflow-hidden relative">
      <div className="p-3 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between text-xs z-20">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <MapPin size={16} />
          <span>OsmAnd (OpenStreetMap)</span>
        </div>
        <span className="text-emerald-400 text-[11px] font-mono">Offline Vector Maps Active</span>
      </div>
      <div 
        className="flex-1 relative bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80")',
        }}
      >
        <div className="bg-black/70 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center max-w-xs shadow-2xl">
          <MapPin size={28} className="mx-auto text-amber-400 mb-2" />
          <h4 className="text-xs font-bold text-white">OpenStreetMap Offline Navigation</h4>
          <p className="text-[11px] text-neutral-300 mt-1">
            Zero telemetry. No location tracking sent to advertising servers.
          </p>
        </div>
      </div>
    </div>
  );
};

// Sub-app: Element Messenger
const ElementMessengerView: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full bg-neutral-950 text-white flex flex-col overflow-hidden">
      <div className="p-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs">
        <span className="text-emerald-400 font-bold">#matrix:libredroid.org</span>
        <span className="text-[11px] text-emerald-400 font-mono">E2EE Verified</span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        <div className="bg-neutral-900 p-3 rounded-2xl border border-neutral-800 max-w-md">
          <span className="text-emerald-400 font-semibold">linus_user: </span>
          <span>Waydroid container running smoothly on the independent kernel. Sideloaded APKs are working!</span>
        </div>
        <div className="bg-neutral-900 p-3 rounded-2xl border border-neutral-800 max-w-md">
          <span className="text-purple-400 font-semibold">aether_dev: </span>
          <span>Zero Google Play Services required. MicroG takes care of all push tokens locally.</span>
        </div>
      </div>
      <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2">
        <input
          placeholder="Send an end-to-end encrypted message..."
          className="flex-1 bg-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
        />
        <button className="p-2 bg-emerald-600 text-white rounded-xl">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};

// Sub-app: K-9 Mail
const K9MailView: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full bg-neutral-950 text-white flex flex-col overflow-hidden text-xs">
      <div className="p-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-400 font-bold">
          <Mail size={16} />
          <span>K-9 Mail (FOSS)</span>
        </div>
        <span className="text-neutral-400">IMAP / OpenPGP Ready</span>
      </div>
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {[
          { from: 'F-Droid Security', subject: 'Automated reproducible build verified', date: '10:45 AM' },
          { from: 'Nextcloud Hub', subject: 'Your self-hosted sync cluster is healthy', date: 'Yesterday' },
        ].map((mail, i) => (
          <div key={i} className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-neutral-700 cursor-pointer">
            <div className="flex justify-between font-semibold text-white">
              <span>{mail.from}</span>
              <span className="text-neutral-500 font-normal">{mail.date}</span>
            </div>
            <p className="text-neutral-300 mt-0.5">{mail.subject}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
