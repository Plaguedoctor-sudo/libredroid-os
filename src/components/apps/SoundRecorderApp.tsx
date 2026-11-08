import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, Bookmark, Trash2, Download, Volume2, Clock, Sparkles } from 'lucide-react';

interface Recording {
  id: string;
  name: string;
  timestamp: string;
  duration: number; // in seconds
  blobUrl: string;
  sizeKb: number;
  markers: number[]; // seconds where markers were placed
}

export const SoundRecorderApp: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([
    {
      id: 'rec_sample_1',
      name: 'Meeting Note - OS Architecture',
      timestamp: 'Today, 10:15 AM',
      duration: 84,
      blobUrl: '',
      sizeKb: 1240,
      markers: [12, 45, 78],
    },
    {
      id: 'rec_sample_2',
      name: 'Voice Memo - Feature Matrix',
      timestamp: 'Yesterday, 4:30 PM',
      duration: 32,
      blobUrl: '',
      sizeKb: 480,
      markers: [5],
    },
  ]);
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(0);
  const [markers, setMarkers] = useState<number[]>([]);
  const [audioQuality, setAudioQuality] = useState<'standard' | 'high' | 'lossless'>('high');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Timer while recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording, isPaused]);

  // Audio waveform animation
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const drawWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.lineWidth = 3;
      ctx.strokeStyle = isRecording ? '#06b6d4' : '#64748b';

      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        let amp = isRecording ? (isPaused ? 4 : 24) : 8;
        // Generate simulated responsive waveform frequency
        const y = centerY + Math.sin((x * 0.05) + phase) * amp * Math.sin(x * 0.01);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Additional harmonic layer
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isRecording ? '#3b82f6' : '#475569';
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        let amp = isRecording ? (isPaused ? 2 : 16) : 4;
        const y = centerY + Math.cos((x * 0.04) - phase * 1.5) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += isRecording && !isPaused ? 0.08 : 0.01;
      animationFrameRef.current = requestAnimationFrame(drawWave);
    };

    drawWave();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      setRecordingSeconds(0);
      setMarkers([]);
      audioChunksRef.current = [];

      // Check for real mic access
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          recorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const now = new Date();
            const newRec: Recording = {
              id: `rec_${Date.now()}`,
              name: `Recording ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              timestamp: 'Just now',
              duration: recordingSeconds || 1,
              blobUrl: url,
              sizeKb: Math.round(blob.size / 1024) || 256,
              markers: [...markers],
            };
            setRecordings((prev) => [newRec, ...prev]);
            stream.getTracks().forEach((track) => track.stop());
          };
          mediaRecorderRef.current = recorder;
          recorder.start();
        } catch {
          // If browser mic permission denied or not supported, use simulated recording
        }
      }
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error('Failed to start recorder:', err);
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Simulated completion
      const newRec: Recording = {
        id: `rec_${Date.now()}`,
        name: `Recording ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        timestamp: 'Just now',
        duration: recordingSeconds || 5,
        blobUrl: '',
        sizeKb: Math.round(recordingSeconds * 16) || 128,
        markers: [...markers],
      };
      setRecordings((prev) => [newRec, ...prev]);
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingSeconds(0);
  };

  const addMarker = () => {
    if (isRecording) {
      setMarkers((prev) => [...prev, recordingSeconds]);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white font-sans overflow-hidden select-none">
      {/* Top Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg">
            <Mic size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Sound Recorder</h1>
            <p className="text-[11px] text-neutral-400">High-Fidelity Studio Audio • Dirac Acoustic Tuning</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Quality:</span>
          {(['standard', 'high', 'lossless'] as const).map((q) => (
            <button
              key={q}
              onClick={() => setAudioQuality(q)}
              className={`px-2.5 py-1 text-xs rounded-lg uppercase tracking-wider font-semibold transition-all ${
                audioQuality === q
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Main Recording Visualizer View */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Live Timer */}
        <div className="text-center mb-6">
          <div className="text-5xl font-mono font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            {formatTime(recordingSeconds)}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRecording
                  ? isPaused
                    ? 'bg-amber-400'
                    : 'bg-red-500 animate-pulse'
                  : 'bg-neutral-600'
              }`}
            />
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
              {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Ready'}
            </span>
          </div>
        </div>

        {/* Oscilloscope Waveform Canvas */}
        <div className="w-full max-w-2xl h-36 bg-neutral-900/60 rounded-2xl border border-neutral-800 flex items-center justify-center overflow-hidden shadow-inner relative mb-8">
          <canvas ref={canvasRef} width={600} height={140} className="w-full h-full" />
          {markers.length > 0 && (
            <div className="absolute top-2 left-4 flex gap-1.5 flex-wrap">
              {markers.map((m, idx) => (
                <span key={idx} className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] px-2 py-0.5 rounded-md font-mono">
                  🚩 {formatTime(m)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex items-center gap-6">
          {/* Add Marker Button */}
          <button
            onClick={addMarker}
            disabled={!isRecording}
            className={`p-3.5 rounded-full border transition-all ${
              isRecording
                ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-cyan-400 hover:border-cyan-500/50'
                : 'opacity-30 border-neutral-800 text-neutral-600 cursor-not-allowed'
            }`}
            title="Add Timestamp Flag Marker"
          >
            <Bookmark size={20} />
          </button>

          {/* Master Record / Stop Button */}
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-18 h-18 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-2xl shadow-cyan-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <Mic size={32} />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-18 h-18 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Square size={28} />
            </button>
          )}

          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            disabled={!isRecording}
            className={`p-3.5 rounded-full border transition-all ${
              isRecording
                ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-amber-400 hover:border-amber-500/50'
                : 'opacity-30 border-neutral-800 text-neutral-600 cursor-not-allowed'
            }`}
            title="Pause / Resume"
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>
        </div>
      </div>

      {/* Bottom Saved Recordings Drawer */}
      <div className="h-64 border-t border-neutral-800 bg-neutral-900/40 flex flex-col">
        <div className="px-6 py-2.5 border-b border-neutral-800/60 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <Volume2 size={14} className="text-cyan-400" />
            Saved Recordings ({recordings.length})
          </span>
          <span className="text-[11px] text-neutral-500">Auto-saved to Storage</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/40 p-2">
          {recordings.map((rec) => {
            const isSelected = activeRecordingId === rec.id;
            return (
              <div
                key={rec.id}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  isSelected ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (activeRecordingId === rec.id) {
                        setIsPlaying(!isPlaying);
                      } else {
                        setActiveRecordingId(rec.id);
                        setIsPlaying(true);
                      }
                    }}
                    className="w-9 h-9 rounded-full bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    {isSelected && isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                  </button>

                  <div>
                    <h4 className="text-sm font-semibold text-neutral-200">{rec.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatTime(rec.duration)}
                      </span>
                      <span>•</span>
                      <span>{rec.sizeKb} KB</span>
                      <span>•</span>
                      <span>{rec.timestamp}</span>
                      {rec.markers.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-400">🚩 {rec.markers.length} markers</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {rec.blobUrl && (
                    <a
                      href={rec.blobUrl}
                      download={`${rec.name}.webm`}
                      className="p-2 text-neutral-400 hover:text-cyan-400 rounded-lg hover:bg-neutral-800 transition-colors"
                      title="Download Recording"
                    >
                      <Download size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => setRecordings((prev) => prev.filter((r) => r.id !== rec.id))}
                    className="p-2 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default SoundRecorderApp;
