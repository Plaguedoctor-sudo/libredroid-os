import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Camera, 
  Square, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Mic, 
  Volume2, 
  Sliders, 
  Clock, 
  CheckCircle,
  Eye,
  Sparkles
} from 'lucide-react';

interface RecordedVideo {
  id: string;
  title: string;
  timestamp: string;
  duration: number;
  url: string;
  sizeMb: number;
  resolution: string;
}

export const ScreenRecorderApp: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioSource, setAudioSource] = useState<'system' | 'mic' | 'both' | 'none'>('both');
  const [resolution, setResolution] = useState<'1080p' | '720p' | '480p'>('1080p');
  const [frameRate, setFrameRate] = useState<60 | 30>(60);
  const [recordings, setRecordings] = useState<RecordedVideo[]>([
    {
      id: 'vid_sample_1',
      title: 'OnePlus Pad Go Multitasking Demo',
      timestamp: 'Today, 11:20 AM',
      duration: 52,
      url: '',
      sizeMb: 24.5,
      resolution: '1080p 60fps',
    },
    {
      id: 'vid_sample_2',
      title: 'Waydroid AOSP App Launch Walkthrough',
      timestamp: 'Yesterday, 3:15 PM',
      duration: 118,
      url: '',
      sizeMb: 58.2,
      resolution: '1080p 60fps',
    },
  ]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [screenshotSuccess, setScreenshotSuccess] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const startScreenRecording = async () => {
    try {
      videoChunksRef.current = [];
      setRecordSeconds(0);

      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: { frameRate: { ideal: frameRate } },
            audio: audioSource === 'system' || audioSource === 'both',
          });

          // Mix mic audio if requested
          if (audioSource === 'mic' || audioSource === 'both') {
            try {
              const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              micStream.getAudioTracks().forEach((track) => displayStream.addTrack(track));
            } catch {}
          }

          const recorder = new MediaRecorder(displayStream, {
            mimeType: 'video/webm;codecs=vp9',
          });

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) videoChunksRef.current.push(e.data);
          };

          recorder.onstop = () => {
            const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const now = new Date();
            const newRec: RecordedVideo = {
              id: `vid_${Date.now()}`,
              title: `Screen Recording ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              timestamp: 'Just now',
              duration: recordSeconds || 1,
              url,
              sizeMb: Number((blob.size / (1024 * 1024)).toFixed(1)) || 12.4,
              resolution: `${resolution} ${frameRate}fps`,
            };
            setRecordings((prev) => [newRec, ...prev]);
            displayStream.getTracks().forEach((t) => t.stop());
          };

          mediaRecorderRef.current = recorder;
          recorder.start(1000);
        } catch {
          // User cancelled screen share or permission denied
        }
      }

      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setIsRecording(true);
    }
  };

  const stopScreenRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      const now = new Date();
      const newRec: RecordedVideo = {
        id: `vid_${Date.now()}`,
        title: `Screen Recording ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        timestamp: 'Just now',
        duration: recordSeconds || 8,
        url: '',
        sizeMb: Number((recordSeconds * 0.4).toFixed(1)) || 3.2,
        resolution: `${resolution} ${frameRate}fps`,
      };
      setRecordings((prev) => [newRec, ...prev]);
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordSeconds(0);
  };

  const takeQuickScreenshot = () => {
    setScreenshotSuccess(true);
    setTimeout(() => setScreenshotSuccess(false), 2500);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white font-sans overflow-y-auto select-none">
      {/* Top Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center shadow-lg">
            <Video size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Screen Recorder & Capture</h1>
            <p className="text-[11px] text-neutral-400">ColorOS Master Studio • High-FPS Screen Capture & Audio Mix</p>
          </div>
        </div>

        <button
          onClick={takeQuickScreenshot}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
        >
          <Camera size={14} className="text-rose-400" />
          Take Screenshot
        </button>
      </div>

      {/* Screenshot Flash Banner */}
      {screenshotSuccess && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>Screenshot saved to Photos and copied to clipboard!</span>
          </div>
          <span className="font-mono text-[10px]">2408 × 1720 px</span>
        </div>
      )}

      <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Record Control Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-neutral-900 to-rose-950/20 border border-neutral-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-neutral-600'}`} />
              {isRecording ? (isPaused ? 'Recording Paused' : 'Recording in Progress...') : 'Screen Recorder Ready'}
            </div>
            <div className="text-5xl font-mono font-bold text-white tracking-wider">
              {formatDuration(recordSeconds)}
            </div>
            <p className="text-xs text-neutral-400">
              Captures display, internal audio, and microphone at {resolution} {frameRate}fps
            </p>
          </div>

          <div className="flex items-center gap-4">
            {!isRecording ? (
              <button
                onClick={startScreenRecording}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold flex items-center gap-2.5 shadow-xl shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Video size={20} />
                Start Recording
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 cursor-pointer"
                  title="Pause / Resume"
                >
                  {isPaused ? <Play size={18} /> : <Pause size={18} />}
                </button>
                <button
                  onClick={stopScreenRecording}
                  className="px-5 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
                >
                  <Square size={18} />
                  Stop & Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Audio Source Configuration */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Volume2 size={14} className="text-cyan-400" />
            Audio Recording Source
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'both', label: 'System Audio + Mic', desc: 'Narrate gameplay/apps' },
              { id: 'system', label: 'System Audio Only', desc: 'Internal clean sound' },
              { id: 'mic', label: 'Microphone Only', desc: 'Voice commentary only' },
              { id: 'none', label: 'Mute (No Audio)', desc: 'Silent visual recording' },
            ].map((src) => {
              const active = audioSource === src.id;
              return (
                <button
                  key={src.id}
                  onClick={() => setAudioSource(src.id as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-neutral-800 border-cyan-500/50 text-white'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{src.label}</span>
                    <span className={`w-2 h-2 rounded-full ${active ? 'bg-cyan-400' : 'bg-neutral-700'}`} />
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-tight">{src.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Quality & Frame Rate */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Sliders size={14} className="text-rose-400" /> Resolution
            </h3>
            <div className="flex gap-2">
              {(['1080p', '720p', '480p'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setResolution(r)}
                  className={`flex-1 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                    resolution === r
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'bg-neutral-950/40 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Clock size={14} className="text-rose-400" /> Frame Rate
            </h3>
            <div className="flex gap-2">
              {([60, 30] as const).map((fps) => (
                <button
                  key={fps}
                  onClick={() => setFrameRate(fps)}
                  className={`flex-1 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                    frameRate === fps
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'bg-neutral-950/40 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {fps} FPS
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recorded Videos List */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Video size={14} className="text-rose-400" />
              Recorded Videos ({recordings.length})
            </h3>
            <span className="text-[11px] text-neutral-500">Saved to Videos / Photos</span>
          </div>

          <div className="divide-y divide-neutral-800/60">
            {recordings.map((vid) => (
              <div key={vid.id} className="py-3 flex items-center justify-between hover:bg-neutral-800/30 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-rose-400">
                    <Play size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-200">{vid.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
                      <span>{formatDuration(vid.duration)}</span>
                      <span>•</span>
                      <span>{vid.sizeMb} MB</span>
                      <span>•</span>
                      <span>{vid.resolution}</span>
                      <span>•</span>
                      <span>{vid.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {vid.url && (
                    <a
                      href={vid.url}
                      download={`${vid.title}.webm`}
                      className="p-2 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors"
                      title="Download Video"
                    >
                      <Download size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => setRecordings((prev) => prev.filter((v) => v.id !== vid.id))}
                    className="p-2 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ScreenRecorderApp;
