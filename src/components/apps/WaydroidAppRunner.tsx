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
  return <GenericWaydroidRunnerView appId={appId} title={title} />;
};

const GenericWaydroidRunnerView: React.FC<{ appId: string; title: string }> = ({ appId, title }) => {
  const [isRunning, setIsRunning] = useState(true);
  const [activeTab, setActiveTab] = useState<'view' | 'permissions' | 'logs'>('view');
  const [perms, setPerms] = useState<Record<string, boolean>>({
    STORAGE: true,
    NETWORK: true,
    CAMERA: false,
    MICROPHONE: false,
    LOCATION: false,
  });
  const [logs, setLogs] = useState<string[]>([
    `[Waydroid-Init] Mounting LXC container overlay for ${appId}...`,
    `[Security-Enforcing] SELinux domain: u:r:untrusted_app:s0:c12,c256`,
    `[Graphics-HAL] Initializing Mesa Gallium EGL context (Wayland / zero-copy)...`,
    `[Binder-IPC] Handshake established with ServiceManager and microG GmsCore...`,
    `[ActivityManager] Start proc 14028:${appId}/u0a142 for activity {${appId}/.MainActivity}`,
  ]);

  const togglePerm = (key: string) => {
    setPerms(prev => ({ ...prev, [key]: !prev[key] }));
    setLogs(prev => [...prev, `[PermissionManager] Dynamic toggle: ${key} -> ${!perms[key]}`]);
  };

  const handleRestart = () => {
    setIsRunning(false);
    setLogs(prev => [...prev, `[ActivityManager] Sending SIGTERM to ${appId}...`]);
    setTimeout(() => {
      setIsRunning(true);
      setLogs(prev => [...prev, `[ActivityManager] Relaunching proc for ${appId}...`]);
    }, 600);
  };

  return (
    <div className="flex-1 w-full h-full bg-neutral-950 text-white flex flex-col select-none overflow-hidden">
      {/* Top App Bar */}
      <div className="p-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold">
            <Play size={12} />
          </div>
          <div>
            <div className="font-bold flex items-center gap-1.5">
              <span>{title}</span>
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            </div>
            <div className="text-[10px] text-neutral-400 font-mono truncate max-w-[200px]">{appId}</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-[11px]">
          <button
            onClick={() => setActiveTab('view')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeTab === 'view' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Container
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeTab === 'permissions' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Permissions
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeTab === 'logs' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Logs
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
        {activeTab === 'view' && (
          <div className="max-w-md w-full flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center shadow-2xl mb-4 border border-emerald-500/30">
              <Play size={28} className="text-white ml-1" />
            </div>
            <h2 className="text-base font-bold">{title}</h2>
            <p className="text-xs text-neutral-400 mt-1 font-mono">{appId}</p>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mt-5 w-full text-left space-y-2.5 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Container Runtime:</span>
                <span className="text-emerald-400 font-mono">Waydroid AOSP 13 (LineageOS 20)</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Hardware Graphics:</span>
                <span className="text-purple-300 font-mono">Mesa Gallium VirGL / DRI3</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Google Play Services:</span>
                <span className="text-emerald-400 font-mono">microG Emulated & Sandboxed</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Isolation Boundary:</span>
                <span className="text-blue-400 font-mono">LXC Namespaces + AppArmor Enforcing</span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 w-full">
              <button
                onClick={handleRestart}
                className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw size={13} />
                <span>Restart Container Process</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="max-w-md w-full space-y-3">
            <div className="text-xs font-bold text-neutral-300">Container Runtime Permissions</div>
            <p className="text-[11px] text-neutral-400">
              Control granular hardware access granted to this application sandbox.
            </p>
            <div className="space-y-2 pt-2">
              {Object.entries(perms).map(([perm, granted]) => (
                <div
                  key={perm}
                  onClick={() => togglePerm(perm)}
                  className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-xl cursor-pointer hover:bg-neutral-850"
                >
                  <span className="text-xs font-mono text-neutral-300">android.permission.{perm}</span>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${granted ? 'bg-emerald-600' : 'bg-neutral-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${granted ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="w-full h-full flex flex-col max-w-2xl bg-black rounded-2xl border border-neutral-800 p-3 font-mono text-[11px] text-neutral-300 overflow-y-auto">
            <div className="text-[10px] text-neutral-500 pb-2 border-b border-neutral-800 mb-2 flex justify-between">
              <span>Waydroid logcat stream: {appId}</span>
              <span className="text-emerald-400">● LIVE</span>
            </div>
            <div className="space-y-1 overflow-y-auto flex-1">
              {logs.map((log, i) => (
                <div key={i} className="leading-relaxed">{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="p-2.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>LXC Container Security Active</span>
        </div>
        <span className="font-mono text-emerald-400">PID: 14028</span>
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
