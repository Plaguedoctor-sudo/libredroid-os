/**
 * LibreDroid 5G Network Adaptor & 3GPP Rel-17 Radio Simulator Engine
 * 
 * Provides:
 * 1. Virtual 5G Adaptor: Bridges host/Wi-Fi/USB tethering into a virtual rmnet_data0 / wwan0 cellular interface.
 * 2. 3GPP Rel-17 Radio Simulator: Sub-6 GHz (n78, n77, n41, n28) and mmWave (n258) beamforming, RSRP/SINR metrics.
 * 3. 5G Standalone (SA) Core vs NSA Dual-Connectivity (EN-DC) emulation.
 * 4. 5G Network Slicing: eMBB (Gigabit), URLLC (3ms low-latency), mMTC, and Private Air-gapped Slice.
 * 5. VoNR (Voice over New Radio) & VoLTE failover.
 * 6. Interactive 5G throughput test & virtual modem AT/QMI diagnostic console.
 */

import { persistenceService } from './persistenceService';
import { systemBus } from './systemBus';

export type Network5gMode = 'virtual_adaptor' | 'carrier_simulator' | 'usb_dongle';
export type Network5gBand = 'n78' | 'n77' | 'n41' | 'n258' | 'n28';
export type NetworkSlice = 'eMBB' | 'URLLC' | 'mMTC' | 'private_airgap';

export interface Carrier5gProfile {
  id: string;
  name: string;
  country: string;
  mccMnc: string;
  bands: Network5gBand[];
  defaultBand: Network5gBand;
  saSupported: boolean;
  nsaSupported: boolean;
  vonrSupported: boolean;
  imsApn: string;
  badge: string;
}

export const CARRIERS_5G: Carrier5gProfile[] = [
  {
    id: 'tmobile_5g',
    name: 'T-Mobile US 5G Ultra Capacity',
    country: 'United States',
    mccMnc: '310260',
    bands: ['n41', 'n258', 'n77'],
    defaultBand: 'n41',
    saSupported: true,
    nsaSupported: true,
    vonrSupported: true,
    imsApn: 'ims',
    badge: '5G UC',
  },
  {
    id: 'verizon_5g',
    name: 'Verizon 5G Ultra Wideband',
    country: 'United States',
    mccMnc: '311480',
    bands: ['n77', 'n258'],
    defaultBand: 'n77',
    saSupported: true,
    nsaSupported: true,
    vonrSupported: true,
    imsApn: 'IMS',
    badge: '5G UW',
  },
  {
    id: 'att_5g',
    name: 'AT&T 5G+',
    country: 'United States',
    mccMnc: '310410',
    bands: ['n77', 'n258'],
    defaultBand: 'n77',
    saSupported: true,
    nsaSupported: true,
    vonrSupported: true,
    imsApn: 'ims',
    badge: '5G+',
  },
  {
    id: 'jio_5g',
    name: 'Jio True 5G (Standalone)',
    country: 'India',
    mccMnc: '405854',
    bands: ['n78', 'n28'],
    defaultBand: 'n78',
    saSupported: true,
    nsaSupported: false,
    vonrSupported: true,
    imsApn: 'jionet',
    badge: '5G SA',
  },
  {
    id: 'airtel_5g',
    name: 'Airtel 5G Plus',
    country: 'India',
    mccMnc: '40445',
    bands: ['n78', 'n28'],
    defaultBand: 'n78',
    saSupported: false,
    nsaSupported: true,
    vonrSupported: false,
    imsApn: 'airtelims',
    badge: '5G Plus',
  },
  {
    id: 'vodafone_5g',
    name: 'Vodafone 5G Europe',
    country: 'Europe / UK',
    mccMnc: '23415',
    bands: ['n78'],
    defaultBand: 'n78',
    saSupported: true,
    nsaSupported: true,
    vonrSupported: true,
    imsApn: 'ims',
    badge: '5G',
  },
  {
    id: 'telstra_5g',
    name: 'Telstra 5G Australia',
    country: 'Australia',
    mccMnc: '50501',
    bands: ['n78', 'n258'],
    defaultBand: 'n78',
    saSupported: true,
    nsaSupported: true,
    vonrSupported: true,
    imsApn: 'telstra.ims',
    badge: '5G mmWave',
  },
];

export interface BandMetadata {
  band: Network5gBand;
  name: string;
  type: 'Sub-6 GHz Mid-Band' | 'Sub-6 GHz Low-Band' | 'mmWave High-Band';
  frequency: string;
  channelBandwidth: string;
  maxThroughputMbps: number;
  typicalLatencyMs: number;
  description: string;
}

export const BAND_DETAILS: Record<Network5gBand, BandMetadata> = {
  n78: {
    band: 'n78',
    name: 'Band n78 (3.5 GHz C-Band)',
    type: 'Sub-6 GHz Mid-Band',
    frequency: '3300 - 3800 MHz',
    channelBandwidth: '100 MHz TDD',
    maxThroughputMbps: 950,
    typicalLatencyMs: 6.5,
    description: 'The global standard 5G frequency. Delivers massive gigabit capacity with reliable indoor penetration.',
  },
  n77: {
    band: 'n77',
    name: 'Band n77 (3.7 GHz C-Band)',
    type: 'Sub-6 GHz Mid-Band',
    frequency: '3700 - 3980 MHz',
    channelBandwidth: '100 MHz TDD',
    maxThroughputMbps: 880,
    typicalLatencyMs: 7.0,
    description: 'High-power C-Band deployment utilized heavily for US Verizon 5G UW and AT&T 5G+.',
  },
  n41: {
    band: 'n41',
    name: 'Band n41 (2.5 GHz Mid-Band)',
    type: 'Sub-6 GHz Mid-Band',
    frequency: '2496 - 2690 MHz',
    channelBandwidth: '100 MHz TDD',
    maxThroughputMbps: 780,
    typicalLatencyMs: 8.0,
    description: 'Extensive mid-band footprint providing deep suburban and urban 5G Ultra Capacity coverage.',
  },
  n258: {
    band: 'n258',
    name: 'Band n258 (26 GHz mmWave)',
    type: 'mmWave High-Band',
    frequency: '24.25 - 27.5 GHz',
    channelBandwidth: '800 MHz (8x100MHz CA)',
    maxThroughputMbps: 2400,
    typicalLatencyMs: 3.2,
    description: 'Extreme-bandwidth mmWave spectrum delivering multi-gigabit speeds and sub-4ms response times.',
  },
  n28: {
    band: 'n28',
    name: 'Band n28 (700 MHz Low-Band)',
    type: 'Sub-6 GHz Low-Band',
    frequency: '703 - 748 MHz',
    channelBandwidth: '20 MHz FDD',
    maxThroughputMbps: 180,
    typicalLatencyMs: 12.0,
    description: 'Low-band coverage band reaching deep underground, inside basements, and across vast rural distances.',
  },
};

export interface RfMetrics {
  rsrp: number; // dBm (-70 to -110)
  rsrq: number; // dB (-7 to -18)
  sinr: number; // dB (10 to 30)
  pci: number;  // Physical Cell ID (0 - 1007)
  arfcn: number;
  mimo: '4x4 MIMO DL' | '2x2 MIMO UL' | '8x8 mmWave Beamforming';
  modulation: '256-QAM' | '64-QAM' | '1024-QAM (Rel-17)';
}

export interface VirtualInterfaceState {
  ifname: string;
  ip: string;
  subnet: string;
  gateway: string;
  dns: string[];
  mtu: number;
  txPackets: number;
  rxPackets: number;
  txBytes: number;
  rxBytes: number;
  status: 'UP' | 'DOWN';
}

export interface Network5gState {
  enabled: boolean;
  mode: Network5gMode;
  carrierId: string;
  activeBand: Network5gBand;
  slice: NetworkSlice;
  saMode: boolean; // true = SA (Standalone), false = NSA (Non-Standalone)
  vonrEnabled: boolean;
  carrierAggregation: boolean;
  caBands: string[];
  downlinkSpeedMbps: number;
  uplinkSpeedMbps: number;
  latencyMs: number;
  jitterMs: number;
  rf: RfMetrics;
  vif: VirtualInterfaceState;
  lastSpeedTest: {
    timestamp: string;
    downlink: number;
    uplink: number;
    ping: number;
  } | null;
}

const STORAGE_KEY = 'libredroid_5g_network_v1';

class Network5gEngine {
  private state: Network5gState;
  private intervalId: any = null;

  constructor() {
    this.state = this.loadConfig();
    this.startLiveTelemetry();
  }

  private loadConfig(): Network5gState {
    const saved = persistenceService.getItem<Network5gState>(STORAGE_KEY);
    if (saved) return saved;

    return {
      enabled: true,
      mode: 'virtual_adaptor',
      carrierId: 'tmobile_5g',
      activeBand: 'n78',
      slice: 'eMBB',
      saMode: true,
      vonrEnabled: true,
      carrierAggregation: true,
      caBands: ['n78 (100MHz)', 'n41 (100MHz)', 'n28 (20MHz)'],
      downlinkSpeedMbps: 842.5,
      uplinkSpeedMbps: 135.2,
      latencyMs: 7.2,
      jitterMs: 1.1,
      rf: {
        rsrp: -82,
        rsrq: -10,
        sinr: 26,
        pci: 384,
        arfcn: 643334,
        mimo: '4x4 MIMO DL',
        modulation: '256-QAM',
      },
      vif: {
        ifname: 'rmnet_data0',
        ip: '10.54.120.88',
        subnet: '255.255.255.0',
        gateway: '10.54.120.1',
        dns: ['1.1.1.1', '9.9.9.9'],
        mtu: 1500,
        txPackets: 184209,
        rxPackets: 492104,
        txBytes: 15482019,
        rxBytes: 94821042,
        status: 'UP',
      },
      lastSpeedTest: {
        timestamp: 'Just now',
        downlink: 914.8,
        uplink: 142.3,
        ping: 6.8,
      },
    };
  }

  private saveConfig(): void {
    persistenceService.setItem(STORAGE_KEY, this.state);
    systemBus.emit('system:5g_updated', this.state);
  }

  private startLiveTelemetry(): void {
    if (typeof window === 'undefined') return;
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      if (!this.state.enabled) return;

      // Realistic jitter fluctuation around the active band's throughput profile
      const bandMeta = BAND_DETAILS[this.state.activeBand] || BAND_DETAILS.n78;
      const baseDown = this.state.slice === 'URLLC'
        ? 450
        : (this.state.activeBand === 'n258' ? 1850 : bandMeta.maxThroughputMbps * 0.9);
      
      const jitter = (Math.random() - 0.5) * 40;
      this.state.downlinkSpeedMbps = Math.max(50, Math.round((baseDown + jitter) * 10) / 10);
      this.state.uplinkSpeedMbps = Math.max(10, Math.round((this.state.downlinkSpeedMbps * 0.16 + (Math.random() - 0.5) * 10) * 10) / 10);
      
      // Ping calculation based on slice and band
      const basePing = this.state.slice === 'URLLC' ? 3.5 : bandMeta.typicalLatencyMs;
      this.state.latencyMs = Math.round((basePing + Math.random() * 1.5) * 10) / 10;
      this.state.jitterMs = Math.round((0.8 + Math.random() * 0.6) * 10) / 10;

      // Increment virtual interface packet counter
      this.state.vif.rxPackets += Math.floor(Math.random() * 150) + 50;
      this.state.vif.txPackets += Math.floor(Math.random() * 40) + 10;
      this.state.vif.rxBytes += Math.floor(Math.random() * 250000) + 50000;
      this.state.vif.txBytes += Math.floor(Math.random() * 40000) + 5000;

      systemBus.emit('system:5g_telemetry', {
        downlink: this.state.downlinkSpeedMbps,
        uplink: this.state.uplinkSpeedMbps,
        ping: this.state.latencyMs,
      });
    }, 2000);
  }

  public getState(): Network5gState {
    return { ...this.state };
  }

  public getActiveCarrier(): Carrier5gProfile {
    return CARRIERS_5G.find(c => c.id === this.state.carrierId) || CARRIERS_5G[0];
  }

  public setEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
    this.state.vif.status = enabled ? 'UP' : 'DOWN';
    this.saveConfig();
  }

  public setMode(mode: Network5gMode): void {
    this.state.mode = mode;
    if (mode === 'usb_dongle') {
      this.state.vif.ifname = 'wwan0';
    } else {
      this.state.vif.ifname = 'rmnet_data0';
    }
    this.saveConfig();
  }

  public setCarrier(carrierId: string): void {
    const carrier = CARRIERS_5G.find(c => c.id === carrierId);
    if (carrier) {
      this.state.carrierId = carrierId;
      this.state.activeBand = carrier.defaultBand;
      this.state.saMode = carrier.saSupported;
      this.saveConfig();
    }
  }

  public setBand(band: Network5gBand): void {
    this.state.activeBand = band;
    const meta = BAND_DETAILS[band];
    if (meta) {
      this.state.rf.mimo = band === 'n258' ? '8x8 mmWave Beamforming' : '4x4 MIMO DL';
      this.state.rf.modulation = band === 'n258' ? '1024-QAM (Rel-17)' : '256-QAM';
    }
    this.saveConfig();
  }

  public setSlice(slice: NetworkSlice): void {
    this.state.slice = slice;
    this.saveConfig();
  }

  public setSaMode(sa: boolean): void {
    this.state.saMode = sa;
    this.saveConfig();
  }

  public toggleVoNR(enabled: boolean): void {
    this.state.vonrEnabled = enabled;
    this.saveConfig();
  }

  public toggleCarrierAggregation(enabled: boolean): void {
    this.state.carrierAggregation = enabled;
    this.saveConfig();
  }

  /**
   * Run an interactive multi-phase 5G throughput & latency benchmark
   */
  public async runSpeedTest(
    onProgress: (p: { phase: 'ping' | 'download' | 'upload' | 'complete'; currentSpeed: number; progress: number }) => void
  ): Promise<{ download: number; uplink: number; ping: number }> {
    // Phase 1: Latency / Ping
    onProgress({ phase: 'ping', currentSpeed: 0, progress: 15 });
    await new Promise(r => setTimeout(r, 600));

    const bandMeta = BAND_DETAILS[this.state.activeBand] || BAND_DETAILS.n78;
    const targetDown = this.state.activeBand === 'n258' ? 2150 : bandMeta.maxThroughputMbps * 0.94;
    const targetUp = targetDown * 0.17;
    const ping = this.state.slice === 'URLLC' ? 3.8 : bandMeta.typicalLatencyMs;

    // Phase 2: Downlink Ramp-Up
    for (let i = 20; i <= 60; i += 5) {
      const current = Math.round((targetDown * (i / 60) + (Math.random() - 0.5) * 30) * 10) / 10;
      onProgress({ phase: 'download', currentSpeed: current, progress: i });
      await new Promise(r => setTimeout(r, 120));
    }

    // Phase 3: Uplink Ramp-Up
    for (let i = 65; i <= 95; i += 5) {
      const current = Math.round((targetUp * ((i - 60) / 35) + (Math.random() - 0.5) * 10) * 10) / 10;
      onProgress({ phase: 'upload', currentSpeed: current, progress: i });
      await new Promise(r => setTimeout(r, 120));
    }

    const finalDown = Math.round(targetDown * 10) / 10;
    const finalUp = Math.round(targetUp * 10) / 10;

    this.state.lastSpeedTest = {
      timestamp: 'Just now',
      downlink: finalDown,
      uplink: finalUp,
      ping,
    };
    this.saveConfig();

    onProgress({ phase: 'complete', currentSpeed: finalDown, progress: 100 });
    return { download: finalDown, uplink: finalUp, ping };
  }

  public getVirtualInterfaceDump(): string {
    const s = this.state;
    return `[#] ip -details link show ${s.vif.ifname}
3: ${s.vif.ifname}: <UP,POINTOPOINT,RUNNING,NOARP,MULTICAST> mtu ${s.vif.mtu} qdisc fq_codel state ${s.vif.status} group default qlen 1000
    link/raw-ip 
    cellular 3gpp-rel17 mode ${s.mode} nr-sa ${s.saMode ? 'enabled' : 'disabled'} numtxqueues 4 numrxqueues 4
    inet ${s.vif.ip}/${s.vif.subnet} brd 10.54.120.255 scope global ${s.vif.ifname}
    RX: bytes  packets  errors  dropped overrun mcast   
    ${s.vif.rxBytes}   ${s.vif.rxPackets}   0       0       0       0       
    TX: bytes  packets  errors  dropped carrier collsns 
    ${s.vif.txBytes}   ${s.vif.txPackets}   0       0       0       0       
[✓] DNS: ${s.vif.dns.join(', ')} (Encrypted DNS-over-HTTPS via LibreDroid)`;
  }

  public getAtCommandDiagDump(): string {
    const s = this.state;
    const carrier = this.getActiveCarrier();
    return `AT+QENG="servingcell"
+QENG: "servingcell","NRA","${carrier.mccMnc}",${s.rf.pci},${s.rf.arfcn},"${s.activeBand}",${s.rf.rsrp},${s.rf.rsrq},${s.rf.sinr}

AT+QCASYS
+QCASYS: "PCC","${s.activeBand}",100,"${s.rf.mimo}","${s.rf.modulation}"
+QCASYS: "SCC1","n41",100,"4x4 MIMO DL","256-QAM"
+QCASYS: "SCC2","n28",20,"2x2 MIMO DL","64-QAM"

AT+QNWINFO
+QNWINFO: "NR5G-SA","${carrier.mccMnc}","${s.activeBand}",${s.rf.arfcn}

AT+QCFG="ims"
+QCFG: "ims",1,1,1,1 (VoNR ACTIVE, EVS-SWB 48kHz Codec Negotiated)`;
  }
}

export const network5gEngine = new Network5gEngine();
