import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  Sparkles, 
  Image as ImageIcon, 
  Circle, 
  ShieldAlert, 
  Power,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { useWindow } from '../../context/WindowContext';
import { hardwareHalBridge } from '../../services/hardwareHalBridge';

export const CameraApp: React.FC = () => {
  const { openApp } = useWindow();
  const { cameraKillswitch, setCameraKillswitch, micKillswitch, setMicKillswitch } = useSecurity();
  const [halState, setHalState] = useState(() => hardwareHalBridge.getState());
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=400&q=80',
  ]);
  const [flash, setFlash] = useState(false);
  const [filter, setFilter] = useState<'none' | 'sepia' | 'grayscale' | 'cyber'>('none');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (cameraKillswitch) return;

    let mediaStream: MediaStream | null = null;

    navigator.mediaDevices?.getUserMedia?.({
      video: { facingMode },
      audio: !micKillswitch,
    })
      .then((stream) => {
        mediaStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);

        // Setup real microphone audio analyser
        if (!micKillswitch && stream.getAudioTracks().length > 0) {
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;

            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateAudio = () => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
              animFrameRef.current = requestAnimationFrame(updateAudio);
            };
            updateAudio();
          } catch {}
        }
      })
      .catch(() => {
        setHasPermission(false);
      });

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [cameraKillswitch, micKillswitch, facingMode]);

  const takePhoto = () => {
    if (cameraKillswitch) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    // If video stream is active, capture real canvas frame
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setPhotos((prev) => [dataUrl, ...prev]);
          return;
        }
      } catch {}
    }

    const samplePhotos = [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80',
    ];
    const picked = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    setPhotos((prev) => [picked, ...prev]);
  };

  const getFilterStyle = () => {
    switch (filter) {
      case 'sepia': return 'sepia(0.8) contrast(1.1)';
      case 'grayscale': return 'grayscale(1) contrast(1.2)';
      case 'cyber': return 'hue-rotate(180deg) saturate(2)';
      default: return 'none';
    }
  };

  if (cameraKillswitch) {
    return (
      <div className="flex-1 w-full h-full bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-rose-950/40 border border-rose-500/50 flex items-center justify-center text-rose-400 mb-4 shadow-2xl">
          <CameraOff size={36} />
        </div>
        <h2 className="text-lg font-bold text-white">Camera Sensor Hardware Cut Off</h2>
        <p className="text-xs text-neutral-400 mt-1.5 max-w-sm leading-relaxed">
          The camera sensor has been unpowered at the driver layer via LibreDroid's Master Hardware Killswitch.
        </p>

        <button
          onClick={() => setCameraKillswitch(false)}
          className="mt-6 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl shadow-xl transition-all flex items-center gap-2"
        >
          <Power size={14} />
          <span>Re-Engage Camera Hardware</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-black text-white relative select-none overflow-hidden">
      {/* Flash Effect Overlay */}
      {flash && <div className="absolute inset-0 bg-white z-50 animate-fade-in pointer-events-none" />}

      {/* Top Filter & Hardware Controls */}
      <div className="absolute top-4 inset-x-0 z-20 flex items-center justify-between px-4">
        {/* Real Microphone Audio VU Meter */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <button 
            onClick={() => setMicKillswitch(!micKillswitch)}
            className="text-neutral-300 hover:text-white"
            title={micKillswitch ? "Mic Cut Off" : "Mic Active"}
          >
            {micKillswitch ? <MicOff size={14} className="text-rose-400" /> : <Mic size={14} className="text-emerald-400" />}
          </button>

          {!micKillswitch ? (
            <div className="flex items-center gap-0.5 w-16 h-3 bg-neutral-800 rounded-full px-1 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full transition-all duration-75 ${
                  audioLevel > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.max(8, audioLevel)}%` }}
              />
            </div>
          ) : (
            <span className="text-[10px] text-rose-400 font-mono">MUTED</span>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['none', 'sepia', 'grayscale', 'cyber'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-full text-xs capitalize transition-all ${
                filter === f 
                  ? 'bg-rose-600 text-white font-medium shadow' 
                  : 'bg-black/50 backdrop-blur-md text-white/70 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Flip Camera */}
        <button
          onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
          className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white/80 hover:text-white border border-white/10"
          title="Flip Camera (Front/Rear)"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Viewfinder Canvas */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-neutral-950">
        {hasPermission ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ filter: getFilterStyle() }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full relative flex items-center justify-center bg-cover bg-center"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80")',
              filter: getFilterStyle(),
            }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
            <div className="relative z-10 text-center bg-black/60 backdrop-blur-md p-4 rounded-3xl border border-white/10 max-w-xs">
              <Camera size={32} className="mx-auto mb-2 text-rose-400" />
              <div className="text-xs font-semibold">Hardware Camera & Mic Sandbox</div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Zero cloud upload. Sensor pipeline sandboxed via SELinux.
              </div>
            </div>
          </div>
        )}

        {/* Viewfinder Grid overlay */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-r border-white" />
          <div />
        </div>

        {/* Camera HAL Lens & Computational Photography Overlay */}
        <div className="absolute bottom-4 inset-x-0 flex flex-col items-center gap-2 z-20 pointer-events-auto">
          {/* Lens Switcher: 0.5x, 1x, 5x */}
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-xs font-bold">
            {[
              { id: 'ultra_wide' as const, label: '.5' },
              { id: 'wide' as const, label: '1x' },
              { id: 'telephoto' as const, label: '5x' },
            ].map(lens => {
              const isActive = halState.camera.activeLens === lens.id;
              return (
                <button
                  key={lens.id}
                  onClick={() => {
                    hardwareHalBridge.setActiveLens(lens.id);
                    setHalState(hardwareHalBridge.getState());
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-amber-400 text-black font-extrabold shadow' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {lens.label}
                </button>
              );
            })}
          </div>

          {/* Computational Mode Pill */}
          <div className="bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Camera2 {halState.camera.apiLevel} • {halState.camera.gcamTuningProfile}</span>
          </div>
        </div>
      </div>

      {/* Bottom Shutter Controls */}
      <div className="h-24 bg-black/90 backdrop-blur-lg flex items-center justify-around px-8 z-20 shrink-0">
        {/* Gallery Preview Thumbnail */}
        <div 
          onClick={() => {
            if (photos[0]) {
              openApp('photos', 'Immich Gallery', undefined, { photoUrl: photos[0], caption: 'Camera Snapshot' });
            }
          }}
          className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/40 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          title="Open in Gallery"
        >
          <img src={photos[0]} alt="Recent" className="w-full h-full object-cover" />
        </div>

        {/* Shutter Button */}
        <button
          onClick={takePhoto}
          className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-transform shadow-lg"
          title="Take Photo"
        >
          <div className="w-full h-full rounded-full bg-white transition-colors" />
        </button>

        {/* AI Scan direct launcher */}
        <button
          onClick={() => {
            if (photos[0]) {
              openApp('universal_ai', 'Universal AI', 'vault-airgap', {
                initialPrompt: 'Analyze this optical frame captured by Open Camera.',
                image: photos[0]
              });
            }
          }}
          className="p-3 bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 rounded-full text-violet-300 transition-all active:scale-95"
          title="Analyze Frame with Universal AI"
        >
          <Sparkles size={18} />
        </button>

        {/* Killswitch shortcut */}
        <button 
          onClick={() => setCameraKillswitch(true)}
          className="p-3 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 rounded-full text-rose-300 transition-colors"
          title="Engage Hardware Camera Killswitch"
        >
          <CameraOff size={20} />
        </button>
      </div>
    </div>
  );
};
