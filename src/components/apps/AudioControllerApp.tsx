import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Sliders, 
  Headphones, 
  Speaker, 
  Bluetooth, 
  Usb, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Activity, 
  Radio, 
  Play, 
  Pause,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { 
  audioEngine, 
  AudioStream, 
  AudioDevice, 
  AudioState, 
  MicPrivacyMode, 
  EqualizerPreset 
} from '../../services/audioEngine';
import { useSystem } from '../../context/SystemContext';
import { AppIntent } from '../../types/apps';

interface Props extends Partial<AppIntent> {
  intent?: AppIntent;
}

export const AudioControllerApp: React.FC<Props> = () => {
  const { addNotification } = useSystem();

  const [state, setState] = useState<AudioState>(audioEngine.getState());
  const [streams, setStreams] = useState<AudioStream[]>(audioEngine.getStreams());
  const [devices, setDevices] = useState<AudioDevice[]>(audioEngine.getDevices());
  const [activeTab, setActiveTab] = useState<'mixer' | 'privacy' | 'equalizer' | 'devices'>('mixer');
  const [isTestingNoise, setIsTestingNoise] = useState(false);

  const refresh = () => {
    setState(audioEngine.getState());
    setStreams(audioEngine.getStreams());
    setDevices(audioEngine.getDevices());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleMasterVolume = (val: number) => {
    audioEngine.setMasterVolume(val);
    refresh();
  };

  const handleToggleMasterMute = () => {
    audioEngine.toggleMasterMute();
    refresh();
  };

  const handleChannelVolume = (channel: keyof AudioState['channelVolumes'], val: number) => {
    audioEngine.setChannelVolume(channel, val);
    refresh();
  };

  const handleStreamVolume = (streamId: string, val: number) => {
    audioEngine.setStreamVolume(streamId, val);
    refresh();
  };

  const handleToggleStreamMute = (streamId: string) => {
    audioEngine.toggleStreamMute(streamId);
    refresh();
  };

  const handleMicPrivacyMode = (mode: MicPrivacyMode) => {
    audioEngine.setMicPrivacyMode(mode);
    refresh();
    addNotification({
      appId: 'system',
      appName: 'Audio Privacy Guard',
      title: 'Microphone Feed Mode Updated',
      body: `Untrusted apps receive: ${mode.replace('_', ' ').toUpperCase()}`,
    });
  };

  const handleToggleNoiseTest = () => {
    const playing = audioEngine.toggleTestSyntheticNoise();
    setIsTestingNoise(playing);
  };

  const handleSetPreset = (preset: EqualizerPreset) => {
    audioEngine.setEqualizerPreset(preset);
    refresh();
  };

  const handleBandGain = (idx: number, gain: number) => {
    audioEngine.setBandGain(idx, gain);
    refresh();
  };

  const handleSelectDevice = (deviceId: string) => {
    audioEngine.setActiveDevice(deviceId);
    refresh();
    addNotification({
      appId: 'system',
      appName: 'Audio HAL',
      title: 'Output Route Switched',
      body: `Primary sink routed to ${devices.find(d => d.id === deviceId)?.name}`,
    });
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-950 text-white select-none overflow-hidden">
      {/* Top Banner / Master Audio Bar */}
      <div className="bg-neutral-900 border-b border-neutral-800 p-3 sm:p-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-md">
              <Volume2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">PipeWire Audio Subsystem</h1>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono">
                  WirePlumber 0.5
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Sovereign low-latency audio mixer & Zero-Trust sensor stream feeder
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMasterMute}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                state.isMasterMuted
                  ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
              }`}
            >
              {state.isMasterMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{state.isMasterMuted ? 'Unmute All' : 'Mute Master'}</span>
            </button>
          </div>
        </div>

        {/* Master Slider */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 flex items-center gap-4">
          <button 
            onClick={handleToggleMasterMute}
            className="text-neutral-400 hover:text-white"
          >
            {state.isMasterMuted ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-cyan-400" />}
          </button>
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Master Output Volume</span>
              <span className="font-mono font-bold text-cyan-400">
                {state.isMasterMuted ? 'Muted' : `${state.masterVolume}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={state.isMasterMuted ? 0 : state.masterVolume}
              onChange={e => handleMasterVolume(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none"
            />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-neutral-800/60 text-xs">
          <button
            onClick={() => setActiveTab('mixer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'mixer'
                ? 'bg-neutral-800 border border-neutral-700 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders size={13} />
            <span>Stream Mixer</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'privacy'
                ? 'bg-neutral-800 border border-neutral-700 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ShieldAlert size={13} className="text-rose-400" />
            <span>Zero-Trust Mic Privacy</span>
          </button>

          <button
            onClick={() => setActiveTab('equalizer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'equalizer'
                ? 'bg-neutral-800 border border-neutral-700 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity size={13} />
            <span>5-Band EQ</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'devices'
                ? 'bg-neutral-800 border border-neutral-700 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Headphones size={13} />
            <span>Output Sinks</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Stream Mixer */}
      {activeTab === 'mixer' && (
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* System Channel Sliders */}
            <div>
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                System Audio Channels
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'media', label: 'Media & Web', icon: Volume2 },
                  { key: 'voice', label: 'Telephony & Voice Calls', icon: Radio },
                  { key: 'notifications', label: 'Alerts & Notifications', icon: Sparkles },
                  { key: 'system', label: 'System Compositor FX', icon: Sliders },
                ].map(ch => (
                  <div 
                    key={ch.key}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="flex items-center gap-1.5 font-medium text-white">
                        <ch.icon size={14} className="text-cyan-400" />
                        {ch.label}
                      </span>
                      <span className="font-mono text-neutral-400">
                        {state.channelVolumes[ch.key as keyof AudioState['channelVolumes']]}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={state.channelVolumes[ch.key as keyof AudioState['channelVolumes']]}
                      onChange={e => handleChannelVolume(ch.key as any, Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Per-Domain Active Audio Streams */}
            <div>
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Active Domain PipeWire Streams
              </h2>
              <div className="space-y-2">
                {streams.map(stream => (
                  <div 
                    key={stream.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-[160px]">
                      <button
                        onClick={() => handleToggleStreamMute(stream.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          stream.isMuted ? 'bg-rose-950 text-rose-400' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                        }`}
                        title={stream.isMuted ? 'Unmute stream' : 'Mute stream'}
                      >
                        {stream.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                      <div>
                        <span className="text-xs font-bold text-white block">{stream.name}</span>
                        <span className="text-[10px] font-mono text-neutral-500">{stream.domain}</span>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stream.isMuted ? 0 : stream.volume}
                        onChange={e => handleStreamVolume(stream.id, Number(e.target.value))}
                        disabled={stream.isMuted}
                        className="flex-1 accent-cyan-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                      />
                      <span className="text-xs font-mono text-neutral-400 w-10 text-right">
                        {stream.isMuted ? 'Muted' : `${stream.volume}%`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Zero-Trust Mic Privacy */}
      {activeTab === 'privacy' && (
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={20} className="text-rose-400" />
                <h2 className="text-sm font-bold text-white">Zero-Trust Synthetic Audio Feeder</h2>
              </div>
              <p className="text-xs text-neutral-400 mb-6">
                When an untrusted application attempts to access your microphone or ignores permissions, LibreDroid injects synthetic high-entropy noise or absolute silence into the virtual ALSA node instead of crashing.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  {
                    mode: 'white_noise' as MicPrivacyMode,
                    title: 'Synthetic White Noise (Recommended)',
                    desc: 'Injects uniform high-entropy acoustic noise. Surveillance SDKs hear continuous scramble without detecting spoofing.',
                  },
                  {
                    mode: 'pink_noise' as MicPrivacyMode,
                    title: 'Pink Ambient Masking',
                    desc: 'Generates 1/f noise curve mimicking ambient natural room acoustics.',
                  },
                  {
                    mode: 'silent' as MicPrivacyMode,
                    title: 'Pitch-Black Silence (Zero PCM)',
                    desc: 'Feeds continuous 0dB mathematically pure null PCM samples.',
                  },
                  {
                    mode: 'passthrough' as MicPrivacyMode,
                    title: 'Hardware Passthrough (Direct Mic)',
                    desc: 'Unfiltered microphone feed passed directly from physical audio hardware.',
                  },
                ].map(item => (
                  <label
                    key={item.mode}
                    onClick={() => handleMicPrivacyMode(item.mode)}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      state.micPrivacyMode === item.mode
                        ? 'bg-rose-950/40 border-rose-600 text-white shadow-md'
                        : 'bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        {item.title}
                      </span>
                      {state.micPrivacyMode === item.mode && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-900/80 text-rose-300 font-mono">
                          Active Feeder
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400">{item.desc}</p>
                  </label>
                ))}
              </div>

              {/* Live Web Audio Privacy Preview Test */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-white">Audition Synthetic Feeder</h3>
                  <p className="text-[11px] text-neutral-400">
                    Listen to the exact acoustic waveform that unauthorized surveillance apps receive.
                  </p>
                </div>

                <button
                  onClick={handleToggleNoiseTest}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                    isTestingNoise
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                  }`}
                >
                  {isTestingNoise ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isTestingNoise ? 'Stop Noise Test' : 'Play Noise Stream'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Equalizer */}
      {activeTab === 'equalizer' && (
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white">5-Band Sovereign Equalizer</h2>
                  <p className="text-xs text-neutral-400">
                    Real-time PipeWire filter chain frequency response curves.
                  </p>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1.5">
                  {(['flat', 'voice', 'bass_boost', 'sovereign_privacy', 'cinematic'] as EqualizerPreset[]).map(p => (
                    <button
                      key={p}
                      onClick={() => handleSetPreset(p)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        state.eqPreset === p
                          ? 'bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {p.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* EQ Sliders */}
              <div className="grid grid-cols-5 gap-3 h-52 bg-neutral-950 border border-neutral-800/80 rounded-xl p-4">
                {state.eqBands.map((band, idx) => (
                  <div key={band.frequency} className="flex flex-col items-center justify-between">
                    <span className="text-[11px] font-mono text-cyan-400">
                      {band.gain > 0 ? `+${band.gain}` : band.gain} dB
                    </span>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      value={band.gain}
                      onChange={e => handleBandGain(idx, Number(e.target.value))}
                      className="accent-cyan-500 h-28 -rotate-90 my-auto cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-neutral-400 font-medium">
                      {band.frequency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Output Sinks / Devices */}
      {activeTab === 'devices' && (
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-1">Hardware Sinks & Routes</h2>
              <p className="text-xs text-neutral-400 mb-4">
                ALSA & Bluetooth A2DP/LDAC output endpoints managed via PipeWire WirePlumber.
              </p>

              <div className="space-y-3">
                {devices.map(dev => {
                  const Icon = dev.type === 'speaker' ? Speaker : dev.type === 'headphone' ? Headphones : dev.type === 'bluetooth' ? Bluetooth : Usb;
                  return (
                    <div
                      key={dev.id}
                      onClick={() => handleSelectDevice(dev.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        dev.isActive
                          ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          dev.isActive ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{dev.name}</span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {dev.sampleRate / 1000} kHz · {dev.channels} Channels
                          </span>
                        </div>
                      </div>

                      {dev.isActive ? (
                        <span className="text-xs font-bold text-cyan-400 font-mono">
                          Active Sink
                        </span>
                      ) : (
                        <button className="px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 text-xs">
                          Route Audio
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
