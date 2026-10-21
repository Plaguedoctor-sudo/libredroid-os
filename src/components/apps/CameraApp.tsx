import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, RefreshCw, Sparkles, Image as ImageIcon, Circle, ShieldAlert, Power } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const CameraApp: React.FC = () => {
  const { cameraKillswitch, setCameraKillswitch } = useSecurity();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=400&q=80',
  ]);
  const [flash, setFlash] = useState(false);
  const [filter, setFilter] = useState<'none' | 'sepia' | 'grayscale' | 'cyber'>('none');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (cameraKillswitch) return;

    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia?.({ video: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        setHasPermission(true);
      })
      .catch(() => {
        setHasPermission(false);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraKillswitch]);

  const takePhoto = () => {
    if (cameraKillswitch) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const samplePhotos = [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80',
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

  // If Hardware Killswitch is engaged: Active hardware cutoff state!
  if (cameraKillswitch) {
    return (
      <div className="flex-1 w-full h-full bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-rose-950/40 border border-rose-500/50 flex items-center justify-center text-rose-400 mb-4 shadow-2xl">
          <CameraOff size={36} />
        </div>
        <h2 className="text-lg font-bold text-white">Camera Hardware Subsystem Cut Off</h2>
        <p className="text-xs text-neutral-400 mt-1.5 max-w-sm leading-relaxed">
          The camera sensor has been electrically unpowered at the kernel driver layer via LibreDroid's Master Hardware Killswitch. No application can capture video.
        </p>

        <button
          onClick={() => setCameraKillswitch(false)}
          className="mt-6 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl shadow-xl transition-all flex items-center gap-2"
        >
          <Power size={14} />
          <span>Re-Engage Camera Hardware Driver</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-black text-white relative select-none overflow-hidden">
      {/* Flash Effect Overlay */}
      {flash && <div className="absolute inset-0 bg-white z-50 animate-fade-in pointer-events-none" />}

      {/* Top Filter Controls */}
      <div className="absolute top-4 inset-x-0 z-20 flex justify-center gap-3">
        {(['none', 'sepia', 'grayscale', 'cyber'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs capitalize transition-all ${
              filter === f 
                ? 'bg-rose-600 text-white font-medium shadow' 
                : 'bg-black/50 backdrop-blur-md text-white/70 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
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
              <div className="text-xs font-semibold">Open Camera Hardware Sandbox</div>
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
          <div className="border-r border-white" />
          <div className="border-r border-white" />
          <div />
        </div>
      </div>

      {/* Bottom Shutter Controls */}
      <div className="h-24 bg-black/90 backdrop-blur-lg flex items-center justify-around px-8 z-20 shrink-0">
        {/* Gallery Preview Thumbnail */}
        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/40 cursor-pointer hover:scale-105 transition-transform">
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
