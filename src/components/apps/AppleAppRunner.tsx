import React, { useState } from 'react';
import { 
  ChevronLeft, 
  MoreHorizontal, 
  Share, 
  Heart, 
  MessageSquare, 
  ArrowUp, 
  ArrowDown, 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  ShieldCheck, 
  Eye, 
  Film, 
  Tv, 
  Gamepad2, 
  Cpu, 
  Image, 
  Terminal, 
  Sparkles, 
  Apple, 
  Layers, 
  Radio
} from 'lucide-react';

interface AppleAppRunnerProps {
  appId: string;
  title: string;
}

export const AppleAppRunner: React.FC<AppleAppRunnerProps> = ({ appId, title }) => {
  if (appId === 'com.christianselig.apollo') {
    return <ApolloRedditView />;
  }
  if (appId === 'com.rileytestut.delta') {
    return <DeltaEmulatorView />;
  }
  if (appId === 'com.firecore.infuse') {
    return <InfusePlayerView />;
  }
  if (appId === 'org.cryptomator.ios') {
    return <CryptomatorIosView />;
  }
  if (appId === 'io.ente.photos.ios') {
    return <EntePhotosView />;
  }
  if (appId === 'com.utmapp.UTM') {
    return <UtmVirtualMachineView />;
  }

  return <GenericIpaRunnerView appId={appId} title={title} />;
};

/* ---------------- 1. APOLLO FOR REDDIT (iOS) ---------------- */
const ApolloRedditView: React.FC = () => {
  const [activeSub, setActiveSub] = useState('r/technology');
  const [upvoted, setUpvoted] = useState<Record<number, boolean>>({});
  const posts = [
    { id: 1, title: 'LibreDroid OS releases native Apple iOS Mach-O runtime translation layer', author: 'iamthatis', score: 4892, comments: 412, tag: 'FOSS' },
    { id: 2, title: 'Linux kernel evolution: From 1991 monolithic roots to modern Seccomp & Landlock LSM', author: 'torvalds_fan', score: 3201, comments: 289, tag: 'Kernel' },
    { id: 3, title: 'Why microkernel isolation and formally verified seL4 matters in 2026', author: 'trust_no_one', score: 1845, comments: 177, tag: 'Security' },
  ];

  return (
    <div className="flex-1 w-full h-full bg-[#0a0a0c] text-white flex flex-col font-sans select-none overflow-hidden">
      <div className="bg-[#16161a]/90 backdrop-blur-md border-b border-white/10 px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <ChevronLeft size={16} className="text-orange-400 cursor-pointer" />
          <span className="font-bold text-sm text-white">Apollo</span>
          <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-mono">UIKit iOS 16</span>
        </div>
        <div className="flex items-center gap-2">
          {['r/technology', 'r/linux', 'r/privacy'].map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSub(sub)}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-colors ${activeSub === sub ? 'bg-orange-500 text-white font-semibold' : 'bg-white/5 text-neutral-400 hover:text-white'}`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="bg-[#18181f] border border-white/5 rounded-2xl p-4 shadow-lg hover:border-orange-500/30 transition-colors">
            <div className="flex items-center gap-2 text-[11px] text-neutral-400 mb-1.5">
              <span className="text-orange-400 font-bold">{post.tag}</span>
              <span>•</span>
              <span>Posted by u/{post.author}</span>
            </div>
            <h3 className="text-sm font-semibold text-white leading-snug">{post.title}</h3>
            <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full">
                <button
                  onClick={() => setUpvoted(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                  className={`hover:text-orange-400 transition-colors ${upvoted[post.id] ? 'text-orange-500 font-bold' : ''}`}
                >
                  <ArrowUp size={14} />
                </button>
                <span className="font-mono text-[11px] text-white">{post.score + (upvoted[post.id] ? 1 : 0)}</span>
                <button className="hover:text-blue-400 transition-colors"><ArrowDown size={14} /></button>
              </div>
              <div className="flex items-center gap-1 text-[11px]"><MessageSquare size={13} /><span>{post.comments} comments</span></div>
              <Share size={13} className="hover:text-white cursor-pointer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------- 2. DELTA RETRO EMULATOR (iOS) ---------------- */
const DeltaEmulatorView: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(60);
  const [game, setGame] = useState('Pokemon Emerald (GBA)');

  return (
    <div className="flex-1 w-full h-full bg-[#121217] text-white flex flex-col items-center justify-between p-3 select-none overflow-hidden font-sans">
      <div className="w-full flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl px-3 py-1.5 text-xs">
        <div className="flex items-center gap-2 text-purple-400 font-bold">
          <Gamepad2 size={16} />
          <span>Delta iOS Metal Engine</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-emerald-400">{fps} FPS</span>
          <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">GBA ARM7TDMI</span>
        </div>
      </div>

      <div className="w-full max-w-md aspect-[3/2] bg-neutral-950 border-4 border-neutral-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-purple-900/20 to-black opacity-80" />
        <div className="relative z-10 text-center space-y-2">
          <div className="text-xs font-mono tracking-widest text-emerald-400 animate-pulse">● LIVE EMULATION</div>
          <div className="text-base font-bold text-white drop-shadow">{game}</div>
          <div className="text-[10px] text-neutral-400 font-mono">Frame Time: 16.6ms • VSync Locked • Audio: 44.1kHz</div>
        </div>
      </div>

      <div className="w-full max-w-sm flex items-center justify-between px-4 py-2">
        <div className="grid grid-cols-3 gap-1.5 w-24 h-24">
          <div />
          <button className="bg-neutral-800 border border-neutral-700 rounded-lg active:bg-neutral-600 flex items-center justify-center font-bold">▲</button>
          <div />
          <button className="bg-neutral-800 border border-neutral-700 rounded-lg active:bg-neutral-600 flex items-center justify-center font-bold">◀</button>
          <div className="bg-neutral-900 rounded-md" />
          <button className="bg-neutral-800 border border-neutral-700 rounded-lg active:bg-neutral-600 flex items-center justify-center font-bold">▶</button>
          <div />
          <button className="bg-neutral-800 border border-neutral-700 rounded-lg active:bg-neutral-600 flex items-center justify-center font-bold">▼</button>
          <div />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 text-neutral-300">
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button onClick={() => setFps(fps === 60 ? 120 : 60)} className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 text-purple-400">
              <FastForward size={14} />
            </button>
          </div>
          <div className="flex gap-2 text-[9px] font-mono text-neutral-400">
            <span>SELECT</span>
            <span>START</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="w-12 h-12 rounded-full bg-rose-600 active:bg-rose-500 font-bold text-white shadow-lg flex items-center justify-center">B</button>
          <button className="w-12 h-12 rounded-full bg-indigo-600 active:bg-indigo-500 font-bold text-white shadow-lg flex items-center justify-center -mt-4">A</button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- 3. INFUSE PRO PLAYER (iOS) ---------------- */
const InfusePlayerView: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMedia, setActiveMedia] = useState('Open Source Revolution (4K HDR)');

  return (
    <div className="flex-1 w-full h-full bg-[#08080a] text-white flex flex-col font-sans select-none overflow-hidden">
      <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-rose-400 font-bold">
          <Film size={16} />
          <span>Infuse Pro 7 (iOS AVFoundation)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">Dolby Vision / HDR10</span>
          <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">Spatial Audio</span>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black">
        <div className="text-center space-y-3 z-10 p-6">
          <div className="w-16 h-16 rounded-full bg-rose-600/30 border border-rose-500 flex items-center justify-center mx-auto cursor-pointer hover:scale-105 transition-transform" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause size={28} className="text-rose-400" /> : <Play size={28} className="text-rose-400 ml-1" />}
          </div>
          <div className="text-base font-bold text-white">{activeMedia}</div>
          <p className="text-xs text-neutral-400 font-mono">HEVC 10-bit • 3840x2160 • 24.000 fps • TrueHD 7.1</p>
        </div>
      </div>

      <div className="bg-neutral-900/90 border-t border-white/10 p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-neutral-400">01:14:22 / 02:40:00</span>
          <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="w-2/5 h-full bg-rose-500" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-neutral-400">
          <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded">Eng Audio [Dolby Atmos]</span>
          <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded">Subtitles: En</span>
        </div>
      </div>
    </div>
  );
};

/* ---------------- 4. CRYPTOMATOR VAULT (iOS) ---------------- */
const CryptomatorIosView: React.FC = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [files, setFiles] = useState(['Personal_Keys.kdbx', 'Financial_Ledger_2026.ods', 'Sovereignty_Manifesto.pdf']);

  return (
    <div className="flex-1 w-full h-full bg-[#0d1117] text-white flex flex-col font-sans select-none overflow-hidden">
      <div className="p-3 bg-neutral-900/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-teal-400 font-bold">
          <Lock size={16} />
          <span>Cryptomator iOS (CryptoKit)</span>
        </div>
        <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-mono">AES-256-GCM</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {!unlocked ? (
          <div className="space-y-4 max-w-xs">
            <div className="w-16 h-16 rounded-3xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto text-teal-400">
              <Lock size={28} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Vault: Sovereign Documents</h2>
              <p className="text-xs text-neutral-400 mt-1">Client-side zero-knowledge encrypted vault.</p>
            </div>
            <button
              onClick={() => setUnlocked(true)}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <ShieldCheck size={16} />
              <span>Unlock with Simulated Face ID</span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>Vault Decrypted & Mounted</span>
              </div>
              <button onClick={() => setUnlocked(false)} className="text-xs text-neutral-400 hover:text-white">Lock Vault</button>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl divide-y divide-neutral-800 text-xs">
              {files.map((file) => (
                <div key={file} className="p-3 flex items-center justify-between hover:bg-neutral-800/50">
                  <span className="font-mono text-neutral-200">{file}</span>
                  <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">Decrypted</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- 5. ENTE PHOTOS (iOS) ---------------- */
const EntePhotosView: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full bg-[#0a0a0c] text-white flex flex-col font-sans select-none overflow-hidden">
      <div className="p-3 bg-neutral-900/90 border-b border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <Image size={16} />
          <span>Ente Photos (E2EE iOS)</span>
        </div>
        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">Zero-Knowledge Cloud</span>
      </div>

      <div className="flex-1 p-3 grid grid-cols-3 gap-2 overflow-y-auto">
        {[
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80',
        ].map((src, i) => (
          <div key={i} className="aspect-square rounded-xl overflow-hidden relative group">
            <img src={src} alt="Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            <div className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-[9px] text-cyan-300">🔒</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------- 6. UTM VIRTUAL MACHINES (iOS) ---------------- */
const UtmVirtualMachineView: React.FC = () => {
  const [vmStatus, setVmStatus] = useState<'stopped' | 'running'>('running');
  return (
    <div className="flex-1 w-full h-full bg-neutral-950 text-white flex flex-col font-sans select-none overflow-hidden">
      <div className="p-3 bg-neutral-900 border-b border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-bold">
          <Cpu size={16} />
          <span>UTM Virtual Machines (iOS QEMU)</span>
        </div>
        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">Hypervisor.framework</span>
      </div>

      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">Debian ARM64 Guest VM</div>
              <div className="text-xs text-neutral-400 font-mono">4 vCPU • 2048 MB RAM • QCOW2</div>
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${vmStatus === 'running' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
              {vmStatus.toUpperCase()}
            </span>
          </div>

          <div className="bg-black border border-neutral-800 rounded-xl p-3 font-mono text-[11px] text-emerald-400 h-28 overflow-y-auto space-y-1">
            <div>[0.000000] Linux version 6.6.21-apple-guest (root@darwin)</div>
            <div>[0.012411] CPU: ARMv8 Processor [410fd034] revision 4</div>
            <div>[0.045102] QEMU virt-8.2: PCI host bridge initialized</div>
            <div>[0.102914] systemd 254.7-1 running in system mode (+PAM)</div>
            <div>[0.184912] Started System Logging Service.</div>
            <div className="text-white animate-pulse">login as: debian_guest_</div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setVmStatus(vmStatus === 'running' ? 'stopped' : 'running')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${vmStatus === 'running' ? 'bg-red-600/80 hover:bg-red-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            >
              {vmStatus === 'running' ? <Pause size={14} /> : <Play size={14} />}
              <span>{vmStatus === 'running' ? 'Suspend VM' : 'Resume VM'}</span>
            </button>
            <button className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-mono">Console</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- 7. GENERIC IPA / MACH-O RUNNER ---------------- */
const GenericIpaRunnerView: React.FC<{ appId: string; title: string }> = ({ appId, title }) => {
  return (
    <div className="flex-1 w-full h-full bg-[#0a0a0d] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-600 to-red-600 flex items-center justify-center shadow-2xl mb-4 border border-rose-500/30">
        <Apple size={30} className="text-white" />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-xs text-neutral-400 mt-1 font-mono">{appId}</p>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mt-6 max-w-sm w-full text-left space-y-2 text-xs">
        <div className="flex justify-between text-neutral-400">
          <span>Darwin Kernel Bridge:</span>
          <span className="text-rose-400 font-mono">XNU 23.4 / Darling</span>
        </div>
        <div className="flex justify-between text-neutral-400">
          <span>Dynamic Linker:</span>
          <span className="text-purple-300 font-mono">dyld64 ARM64 JIT</span>
        </div>
        <div className="flex justify-between text-neutral-400">
          <span>Graphics Subsystem:</span>
          <span className="text-amber-400 font-mono">Metal-to-Vulkan (MoltenVK)</span>
        </div>
        <div className="flex justify-between text-neutral-400">
          <span>Cocoa Framework:</span>
          <span className="text-emerald-400 font-mono">UIKit / touchHLE Active</span>
        </div>
        <div className="flex justify-between text-neutral-400">
          <span>Sandbox Entitlements:</span>
          <span className="text-blue-400 font-mono">Enforcing Sandbox v2</span>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500">
        <ShieldCheck size={14} className="text-rose-400" />
        <span>Apple Mach-O Binary Translated & Executing</span>
      </div>
    </div>
  );
};
