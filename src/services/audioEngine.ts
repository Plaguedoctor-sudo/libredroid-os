import { persistenceService } from './persistenceService';
import { systemBus } from './systemBus';

export type MicPrivacyMode = 'passthrough' | 'white_noise' | 'pink_noise' | 'silent';
export type EqualizerPreset = 'flat' | 'voice' | 'bass_boost' | 'sovereign_privacy' | 'cinematic';

export interface AudioStream {
  id: string;
  name: string;
  appId: string;
  domain: string;
  volume: number; // 0 - 100
  isMuted: boolean;
  streamType: 'media' | 'voice' | 'notification' | 'system';
}

export interface AudioDevice {
  id: string;
  name: string;
  type: 'speaker' | 'headphone' | 'bluetooth' | 'usb';
  isActive: boolean;
  sampleRate: number;
  channels: number;
}

export interface EqualizerBand {
  frequency: string;
  gain: number; // -12 to +12 dB
}

export interface AudioState {
  masterVolume: number;
  isMasterMuted: boolean;
  channelVolumes: {
    media: number;
    voice: number;
    notifications: number;
    system: number;
  };
  micPrivacyMode: MicPrivacyMode;
  micMuted: boolean;
  activeDeviceId: string;
  eqPreset: EqualizerPreset;
  eqBands: EqualizerBand[];
  pipewireRunning: boolean;
  lowLatencyMode: boolean;
}

const DEFAULT_AUDIO_STATE: AudioState = {
  masterVolume: 75,
  isMasterMuted: false,
  channelVolumes: {
    media: 80,
    voice: 85,
    notifications: 65,
    system: 50,
  },
  micPrivacyMode: 'white_noise',
  micMuted: false,
  activeDeviceId: 'dev-speakers',
  eqPreset: 'sovereign_privacy',
  eqBands: [
    { frequency: '60Hz', gain: 2 },
    { frequency: '230Hz', gain: 1 },
    { frequency: '910Hz', gain: 0 },
    { frequency: '3.6kHz', gain: -1 },
    { frequency: '14kHz', gain: 1 },
  ],
  pipewireRunning: true,
  lowLatencyMode: true,
};

class AudioEngine {
  private static instance: AudioEngine;

  private state: AudioState;
  private audioContext: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private isTestingNoise: boolean = false;

  private streams: AudioStream[] = [
    {
      id: 'stream-waydroid',
      name: 'Waydroid AOSP Runtime',
      appId: 'waydroid',
      domain: 'lrd-android',
      volume: 80,
      isMuted: false,
      streamType: 'media',
    },
    {
      id: 'stream-work',
      name: 'Debian Workstation',
      appId: 'workstation',
      domain: 'lrd-work',
      volume: 70,
      isMuted: false,
      streamType: 'system',
    },
    {
      id: 'stream-browser',
      name: 'LibreBrowse Chromium',
      appId: 'browser',
      domain: 'lrd-work',
      volume: 85,
      isMuted: false,
      streamType: 'media',
    },
    {
      id: 'stream-telephony',
      name: 'LibreDroid Dialer',
      appId: 'phone',
      domain: 'host',
      volume: 90,
      isMuted: false,
      streamType: 'voice',
    },
    {
      id: 'stream-darwin',
      name: 'Apple CocoaTouch Bridge',
      appId: 'darwin_bridge',
      domain: 'lrd-work',
      volume: 60,
      isMuted: false,
      streamType: 'media',
    },
  ];

  private devices: AudioDevice[] = [
    {
      id: 'dev-speakers',
      name: 'Internal Sovereign Speakers (Stereo)',
      type: 'speaker',
      isActive: true,
      sampleRate: 48000,
      channels: 2,
    },
    {
      id: 'dev-headphones',
      name: '3.5mm Hardened Line Output',
      type: 'headphone',
      isActive: false,
      sampleRate: 96000,
      channels: 2,
    },
    {
      id: 'dev-bt',
      name: 'Sovereign BT Headset (LDAC 990kbps)',
      type: 'bluetooth',
      isActive: false,
      sampleRate: 96000,
      channels: 2,
    },
    {
      id: 'dev-usb',
      name: 'USB-C Studio DAC / Audio Engine',
      type: 'usb',
      isActive: false,
      sampleRate: 192000,
      channels: 4,
    },
  ];

  private constructor() {
    const saved = persistenceService.loadAudioSettings<AudioState>();
    this.state = saved ? { ...DEFAULT_AUDIO_STATE, ...saved } : { ...DEFAULT_AUDIO_STATE };
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private persist(): void {
    persistenceService.saveAudioSettings(this.state);
  }

  public getState(): AudioState {
    return { ...this.state };
  }

  public getStreams(): AudioStream[] {
    return [...this.streams];
  }

  public getDevices(): AudioDevice[] {
    return [...this.devices];
  }

  public setMasterVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    this.state.masterVolume = clamped;
    this.persist();
    systemBus.emit('audio.master.volume', { volume: clamped });
  }

  public toggleMasterMute(): void {
    this.state.isMasterMuted = !this.state.isMasterMuted;
    this.persist();
    systemBus.emit('audio.master.mute', { isMuted: this.state.isMasterMuted });
  }

  public setChannelVolume(channel: keyof AudioState['channelVolumes'], vol: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    this.state.channelVolumes[channel] = clamped;
    this.persist();
    systemBus.emit('audio.channel.volume', { channel, volume: clamped });
  }

  public setStreamVolume(streamId: string, vol: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    this.streams = this.streams.map(s => s.id === streamId ? { ...s, volume: clamped } : s);
    systemBus.emit('audio.stream.volume', { streamId, volume: clamped });
  }

  public toggleStreamMute(streamId: string): void {
    this.streams = this.streams.map(s => s.id === streamId ? { ...s, isMuted: !s.isMuted } : s);
    systemBus.emit('audio.stream.mute', { streamId });
  }

  public setMicPrivacyMode(mode: MicPrivacyMode): void {
    this.state.micPrivacyMode = mode;
    this.persist();
    systemBus.emit('audio.mic.privacy', { mode });
  }

  public toggleMicMute(): void {
    this.state.micMuted = !this.state.micMuted;
    this.persist();
    systemBus.emit('audio.mic.mute', { isMuted: this.state.micMuted });
  }

  public setActiveDevice(deviceId: string): void {
    this.state.activeDeviceId = deviceId;
    this.devices = this.devices.map(d => ({ ...d, isActive: d.id === deviceId }));
    this.persist();
    systemBus.emit('audio.device.changed', { deviceId });
  }

  public setEqualizerPreset(preset: EqualizerPreset): void {
    this.state.eqPreset = preset;
    const presets: Record<EqualizerPreset, number[]> = {
      flat: [0, 0, 0, 0, 0],
      voice: [-2, 1, 4, 3, 0],
      bass_boost: [6, 4, 1, 0, -1],
      sovereign_privacy: [3, 2, -1, 1, 3],
      cinematic: [5, 2, -2, 3, 4],
    };
    const gains = presets[preset] || presets.flat;
    this.state.eqBands = this.state.eqBands.map((b, i) => ({ ...b, gain: gains[i] ?? 0 }));
    this.persist();
    systemBus.emit('audio.eq.preset', { preset });
  }

  public setBandGain(index: number, gain: number): void {
    const clamped = Math.max(-12, Math.min(12, Math.round(gain)));
    if (this.state.eqBands[index]) {
      this.state.eqBands[index].gain = clamped;
      this.persist();
      systemBus.emit('audio.eq.band', { index, gain: clamped });
    }
  }

  /**
   * Zero-Trust Synthetic Audio Generator preview:
   * Real browser Web Audio API test to let the user hear the synthetic privacy white noise feed
   */
  public toggleTestSyntheticNoise(): boolean {
    if (this.isTestingNoise) {
      if (this.noiseNode) {
        try {
          (this.noiseNode as any).stop?.();
          this.noiseNode.disconnect();
        } catch {}
        this.noiseNode = null;
      }
      this.isTestingNoise = false;
      return false;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      const bufferSize = this.audioContext.sampleRate * 2;
      const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Generate White or Pink Noise depending on mode
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        if (this.state.micPrivacyMode === 'pink_noise') {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        } else {
          // White noise
          output[i] = (Math.random() * 2 - 1) * 0.05; // safe quiet volume
        }
      }

      const whiteNoiseSource = this.audioContext.createBufferSource();
      whiteNoiseSource.buffer = noiseBuffer;
      whiteNoiseSource.loop = true;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

      whiteNoiseSource.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      whiteNoiseSource.start();
      this.noiseNode = whiteNoiseSource;
      this.isTestingNoise = true;
      return true;
    } catch {
      this.isTestingNoise = false;
      return false;
    }
  }

  public isNoisePlaying(): boolean {
    return this.isTestingNoise;
  }
}

export const audioEngine = AudioEngine.getInstance();
