import React, { useState, useEffect } from 'react';
import {
  Radio,
  Zap,
  Wifi,
  Signal,
  Sliders,
  RefreshCw,
  Play,
  CheckCircle2,
  Terminal,
  Layers,
  Globe,
  Gauge,
  Activity,
  PhoneCall,
  ShieldCheck,
  Cpu,
  ArrowDown,
  ArrowUp,
  Clock
} from 'lucide-react';
import {
  network5gEngine,
  CARRIERS_5G,
  BAND_DETAILS,
  Network5gBand,
  Network5gMode,
  NetworkSlice,
  Network5gState
} from '../../services/network5gEngine';
import { useSystem } from '../../context/SystemContext';

export const Network5gApp: React.FC = () => {
  const [state, setState] = useState<Network5gState>(() => network5gEngine.getState());
  const [activeTab, setActiveTab] = useState<'control' | 'speedtest' | 'diagnostics'>('control');
  const [testingSpeed, setTestingSpeed] = useState(false);
  const [speedProgress, setSpeedProgress] = useState<{
    phase: 'ping' | 'download' | 'upload' | 'complete';
    currentSpeed: number;
    progress: number;
  }>({
    phase: 'complete',
    currentSpeed: 0,
    progress: 0,
  });

  const { addNotification } = useSystem();

  // Listen to live updates from the 5G engine
  useEffect(() => {
    const updateHandler = () => {
      setState(network5gEngine.getState());
    };

    window.addEventListener('storage', updateHandler);
    const interval = setInterval(updateHandler, 1500);

    return () => {
      window.removeEventListener('storage', updateHandler);
      clearInterval(interval);
    };
  }, []);

  const activeCarrier = network5gEngine.getActiveCarrier();
  const activeBandMeta = BAND_DETAILS[state.activeBand] || BAND_DETAILS.n78;

  const handleToggle5G = () => {
    const next = !state.enabled;
    network5gEngine.setEnabled(next);
    setState(network5gEngine.getState());
    addNotification({
      appId: 'network_5g',
      appName: '5G Radio Stack',
      title: next ? '5G Network Active' : '5G Radio Suspended',
      body: next
        ? `Attached to ${activeCarrier.name} on ${activeBandMeta.name}`
        : 'Reverted to native Wi-Fi fallback',
    });
  };

  const handleStartSpeedTest = async () => {
    if (testingSpeed) return;
    setTestingSpeed(true);

    try {
      await network5gEngine.runSpeedTest((p) => {
        setSpeedProgress(p);
      });
      setState(network5gEngine.getState());
    } finally {
      setTestingSpeed(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-neutral-950 text-white flex flex-col overflow-hidden select-none font-sans">
      {/* App Header */}
      <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-cyan-900/30">
            <Radio size={22} />
          </div>
          <div>
            <div className="text-base font-bold flex items-center gap-2">
              <span>5G Adaptor & Simulator</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
                state.enabled ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {state.enabled ? activeCarrier.badge : 'OFFLINE'}
              </span>
            </div>
            <div className="text-xs text-neutral-400">
              3GPP Rel-17 NR Modem HAL • Virtual rmnet_data0 Adaptor
            </div>
          </div>
        </div>

        {/* Master Power Toggle */}
        <button
          onClick={handleToggle5G}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
            state.enabled
              ? 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950 shadow-cyan-500/20'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
          }`}
        >
          <Zap size={14} className={state.enabled ? 'fill-neutral-950' : ''} />
          <span>{state.enabled ? '5G ACTIVE' : 'ENABLE 5G'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-2 bg-neutral-900/60 border-b border-neutral-800/80 px-4 text-xs shrink-0">
        {[
          { id: 'control', label: 'Radio & Slicing Control', icon: Sliders },
          { id: 'speedtest', label: 'Gigabit Speed Test', icon: Gauge },
          { id: 'diagnostics', label: 'Virtual Interface & AT Diag', icon: Terminal },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Top Status & Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5">
            <div className="text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Downlink Throughput</span>
              <ArrowDown size={14} className="text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
              {state.enabled ? state.downlinkSpeedMbps : 0} <span className="text-xs font-normal text-cyan-400">Mbps</span>
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
              {state.rf.mimo}
            </div>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5">
            <div className="text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Uplink Throughput</span>
              <ArrowUp size={14} className="text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
              {state.enabled ? state.uplinkSpeedMbps : 0} <span className="text-xs font-normal text-emerald-400">Mbps</span>
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
              2x2 MIMO UL
            </div>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5">
            <div className="text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Radio Latency (Ping)</span>
              <Clock size={14} className="text-purple-400" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
              {state.enabled ? state.latencyMs : '--'} <span className="text-xs font-normal text-purple-400">ms</span>
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
              Jitter: {state.jitterMs} ms
            </div>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5">
            <div className="text-[11px] text-neutral-400 flex items-center justify-between">
              <span>RF Signal (RSRP)</span>
              <Signal size={14} className="text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
              {state.enabled ? state.rf.rsrp : '--'} <span className="text-xs font-normal text-amber-400">dBm</span>
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
              SINR: {state.rf.sinr} dB (Excellent)
            </div>
          </div>
        </div>

        {/* TAB 1: CONTROL & SLICING */}
        {activeTab === 'control' && (
          <div className="space-y-5">
            {/* 1. Operational Mode */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Cpu size={16} className="text-cyan-400" />
                    5G Adaptor Operational Mode
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Select how 5G traffic is bridged to your tablet applications.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {[
                  {
                    id: 'virtual_adaptor',
                    name: 'Virtual 5G Adaptor',
                    desc: 'Bridges physical Wi-Fi/host tunnel to virtual rmnet_data0 cellular stack with gigabit QoS.',
                    badge: 'Recommended',
                  },
                  {
                    id: 'carrier_simulator',
                    name: '3GPP Rel-17 Core Simulator',
                    desc: 'Simulates complete 5G SA/NSA gNodeB base station with carrier aggregation and beamforming.',
                    badge: 'Emulation',
                  },
                  {
                    id: 'usb_dongle',
                    name: 'USB 5G Dongle Passthrough',
                    desc: 'Direct hardware passthrough for external USB 5G baseband modems (Quectel, Fibocom).',
                    badge: 'Hardware',
                  },
                ].map((m) => {
                  const isSel = state.mode === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        network5gEngine.setMode(m.id as Network5gMode);
                        setState(network5gEngine.getState());
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSel
                          ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{m.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          isSel ? 'bg-cyan-500/20 text-cyan-300' : 'bg-neutral-800 text-neutral-500'
                        }`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">{m.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Frequency Band & Spectrum Selector */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radio size={16} className="text-cyan-400" />
                    Active 5G Radio Frequency Band
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Toggle between Sub-6 GHz mid-bands, mmWave high-bands, and extended low-bands.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                {(Object.keys(BAND_DETAILS) as Network5gBand[]).map((bandKey) => {
                  const b = BAND_DETAILS[bandKey];
                  const isSel = state.activeBand === bandKey;
                  return (
                    <div
                      key={bandKey}
                      onClick={() => {
                        network5gEngine.setBand(bandKey);
                        setState(network5gEngine.getState());
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSel
                          ? 'bg-cyan-950/50 border-cyan-500 text-white'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{b.name}</span>
                        <span className="text-[10px] font-mono text-cyan-400">{b.channelBandwidth}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mb-1">{b.type} • {b.frequency}</div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-800/60">
                        <span>Max: {b.maxThroughputMbps} Mbps</span>
                        <span>Latency: ~{b.typicalLatencyMs}ms</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. 5G Carrier & Slicing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Carrier Selector */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe size={16} className="text-emerald-400" />
                  5G Carrier Profile
                </h3>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {CARRIERS_5G.map((c) => {
                    const isSel = state.carrierId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          network5gEngine.setCarrier(c.id);
                          setState(network5gEngine.getState());
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-all ${
                          isSel
                            ? 'bg-emerald-950/40 border-emerald-500 text-white'
                            : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-neutral-200">{c.name}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">MCC/MNC: {c.mccMnc} • {c.country}</div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          isSel ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-500'
                        }`}>
                          {c.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5G Network Slicing */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-purple-400" />
                  5G Network Slicing (S-NSSAI)
                </h3>
                <p className="text-xs text-neutral-400">
                  Select quality-of-service traffic slice enforced on the radio layer.
                </p>

                <div className="space-y-2 pt-1">
                  {[
                    { id: 'eMBB', label: 'eMBB (Enhanced Mobile Broadband)', desc: 'Prioritizes gigabit throughput for 4K streaming and bulk downloads.' },
                    { id: 'URLLC', label: 'URLLC (Ultra-Reliable Low Latency)', desc: 'Caps ping to sub-4ms for real-time cloud gaming and remote robotics.' },
                    { id: 'mMTC', label: 'mMTC (Massive IoT Low-Power)', desc: 'Aggressive battery conservation and low radio sleep states.' },
                    { id: 'private_airgap', label: 'Private 5G Air-gapped Mesh', desc: 'Isolates packet flow strictly within the local device/host network.' },
                  ].map((sl) => {
                    const isSel = state.slice === sl.id;
                    return (
                      <div
                        key={sl.id}
                        onClick={() => {
                          network5gEngine.setSlice(sl.id as NetworkSlice);
                          setState(network5gEngine.getState());
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                          isSel
                            ? 'bg-purple-950/40 border-purple-500 text-white'
                            : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div className="font-semibold text-neutral-200">{sl.label}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{sl.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Advanced Switches (SA, VoNR, CA) */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const next = !state.saMode;
                    network5gEngine.setSaMode(next);
                    setState(network5gEngine.getState());
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    state.saMode
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {state.saMode ? '✓ 5G Standalone (SA)' : '5G Non-Standalone (NSA)'}
                </button>

                <button
                  onClick={() => {
                    const next = !state.vonrEnabled;
                    network5gEngine.toggleVoNR(next);
                    setState(network5gEngine.getState());
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    state.vonrEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  <PhoneCall size={12} />
                  <span>{state.vonrEnabled ? 'VoNR Ultra-HD' : 'VoNR Muted'}</span>
                </button>

                <button
                  onClick={() => {
                    const next = !state.carrierAggregation;
                    network5gEngine.toggleCarrierAggregation(next);
                    setState(network5gEngine.getState());
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    state.carrierAggregation
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {state.carrierAggregation ? '✓ 3CC Carrier Aggregation' : 'Single Carrier'}
                </button>
              </div>

              <div className="text-xs text-neutral-400 font-mono">
                Modem HAL: <span className="text-white">Qualcomm Snapdragon X75 / MTK M80 Emulated</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SPEED TEST */}
        {activeTab === 'speedtest' && (
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shadow-lg">
              <Gauge size={32} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">5G Gigabit Throughput Benchmark</h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Live end-to-end network stress test over the {state.activeBand} {activeBandMeta.type} interface.
              </p>
            </div>

            {/* Gauge Value */}
            <div className="relative w-64 h-32 flex flex-col items-center justify-end">
              <div className="text-5xl font-mono font-extrabold tracking-tight text-white">
                {testingSpeed ? speedProgress.currentSpeed : (state.lastSpeedTest?.downlink || 0)}
              </div>
              <div className="text-sm font-bold text-cyan-400 uppercase tracking-widest mt-1">
                Mbps Downlink
              </div>
            </div>

            {/* Progress bar during test */}
            {testingSpeed && (
              <div className="w-full max-w-md space-y-2">
                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-200"
                    style={{ width: `${speedProgress.progress}%` }}
                  />
                </div>
                <div className="text-xs text-neutral-400 font-mono capitalize">
                  Phase: {speedProgress.phase} testing ({speedProgress.progress}%)
                </div>
              </div>
            )}

            {/* Test Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-lg w-full bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 font-mono text-center">
              <div>
                <div className="text-[11px] text-neutral-500">PING</div>
                <div className="text-base font-bold text-purple-400 mt-0.5">
                  {state.lastSpeedTest?.ping || 0} ms
                </div>
              </div>
              <div>
                <div className="text-[11px] text-neutral-500">DOWNLOAD</div>
                <div className="text-base font-bold text-cyan-400 mt-0.5">
                  {state.lastSpeedTest?.downlink || 0} Mbps
                </div>
              </div>
              <div>
                <div className="text-[11px] text-neutral-500">UPLOAD</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {state.lastSpeedTest?.uplink || 0} Mbps
                </div>
              </div>
            </div>

            <button
              onClick={handleStartSpeedTest}
              disabled={testingSpeed}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-bold text-sm shadow-xl shadow-cyan-600/30 transition-all active:scale-95 flex items-center gap-2"
            >
              <Play size={16} />
              <span>{testingSpeed ? 'Testing 5G Radio...' : 'Start 5G Speed Test'}</span>
            </button>
          </div>
        )}

        {/* TAB 3: DIAGNOSTICS & AT COMMANDS */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-4">
            {/* Interface Dump */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                <span className="flex items-center gap-2">
                  <Terminal size={14} className="text-cyan-400" />
                  Kernel Network Interface (Linux IP Route)
                </span>
                <span className="text-emerald-400 font-mono">STATUS: UP (BRIDGED)</span>
              </div>
              <pre className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl font-mono text-[11px] text-cyan-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {network5gEngine.getVirtualInterfaceDump()}
              </pre>
            </div>

            {/* AT Command QMI Modem Dump */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                <span className="flex items-center gap-2">
                  <Cpu size={14} className="text-purple-400" />
                  Baseband Modem AT / QMI Diagnostics Console
                </span>
                <span className="text-neutral-500 font-mono">ttyUSB2 @ 115200</span>
              </div>
              <pre className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl font-mono text-[11px] text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {network5gEngine.getAtCommandDiagDump()}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
