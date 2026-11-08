/**
 * @concept-ui
 * @experimental-mock
 * LibreDroid Hardware HAL Bridge & Carrier Engine
 * 
 * Provides:
 * 1. Camera HAL Bridge: Camera2 API Level 3, GCam HDR+ computational pipeline, multi-lens switching.
 * 2. VoLTE / VoWiFi IMS Engine: Global carrier configuration profiles, IMS registration, AMR-WB / EVS HD Voice.
 * 3. Biometric HAL Bridge: Android CDD Class 3 Biometric Strong, under-display optical & ultrasonic scanner support.
 */

import { persistenceService } from './persistenceService';
import { systemBus } from './systemBus';

export interface CarrierProfile {
  id: string;
  name: string;
  country: string;
  mccMnc: string;
  volteSupported: boolean;
  vowifiSupported: boolean;
  vilteSupported: boolean;
  rcsSupported: boolean;
  imsApn: string;
  voiceCodec: 'EVS (Ultra-HD 48kHz)' | 'AMR-WB (HD Voice 16kHz)' | 'AMR-NB';
}

export const GLOBAL_CARRIER_PROFILES: CarrierProfile[] = [
  {
    id: 'tmobile_us',
    name: 'T-Mobile US 5G Ultra Capacity',
    country: 'United States',
    mccMnc: '310260',
    volteSupported: true,
    vowifiSupported: true,
    vilteSupported: true,
    rcsSupported: true,
    imsApn: 'ims',
    voiceCodec: 'EVS (Ultra-HD 48kHz)',
  },
  {
    id: 'verizon_us',
    name: 'Verizon Wireless 5G Ultra Wideband',
    country: 'United States',
    mccMnc: '311480',
    volteSupported: true,
    vowifiSupported: true,
    vilteSupported: true,
    rcsSupported: true,
    imsApn: 'IMS',
    voiceCodec: 'EVS (Ultra-HD 48kHz)',
  },
  {
    id: 'att_us',
    name: 'AT&T 5G+',
    country: 'United States',
    mccMnc: '310410',
    volteSupported: true,
    vowifiSupported: true,
    vilteSupported: true,
    rcsSupported: true,
    imsApn: 'ims',
    voiceCodec: 'AMR-WB (HD Voice 16kHz)',
  },
  {
    id: 'jio_india',
    name: 'Jio True 5G (Standalone)',
    country: 'India',
    mccMnc: '405854',
    volteSupported: true,
    vowifiSupported: true,
    vilteSupported: true,
    rcsSupported: true,
    imsApn: 'jionet',
    voiceCodec: 'EVS (Ultra-HD 48kHz)',
  },
  {
    id: 'airtel_india',
    name: 'Airtel 5G Plus',
    country: 'India',
    mccMnc: '40445',
    volteSupported: true,
    vowifiSupported: true,
    vilteSupported: true,
    rcsSupported: true,
    imsApn: 'airtelims',
    voiceCodec: 'AMR-WB (HD Voice 16kHz)',
  },
  {
    id: 'vodafone_eu',
    name: 'Vodafone 5G Europe',
    country: 'Europe / UK',
    mccMnc: '23415',
    volteSupported: true,
    vowifiSupported: true,
    vilteSupported: true,
    rcsSupported: true,
    imsApn: 'ims',
    voiceCodec: 'EVS (Ultra-HD 48kHz)',
  },
  {
    id: 'telstra_au',
    name: 'Telstra 5G Australia',
    country: 'Australia',
    mccMnc: '50501',
    volteSupported: true,
    vowifiSupported: true,
    vilteSupported: true,
    rcsSupported: true,
    imsApn: 'telstra.ims',
    voiceCodec: 'EVS (Ultra-HD 48kHz)',
  },
];

export interface CameraHalConfig {
  apiLevel: 'LEVEL_3' | 'FULL' | 'LIMITED';
  rawStreamEnabled: boolean;
  computationalPhotography: boolean;
  gcamTuningProfile: 'HDR+ Enhanced' | 'Night Sight RAW' | 'Natural Balanced' | 'Motion ZSL';
  multiLensArray: {
    id: string;
    type: 'wide' | 'ultra_wide' | 'telephoto';
    focalLength: string;
    aperture: string;
    resolutionMp: number;
    sensorVendor: string;
  }[];
  activeLens: 'wide' | 'ultra_wide' | 'telephoto';
}

export interface BiometricHalStatus {
  sensorType: 'Ultrasonic Under-Display' | 'Optical Under-Display' | 'Capacitive Side-Mounted';
  cddClass: 'BIOMETRIC_STRONG (Class 3)' | 'BIOMETRIC_WEAK (Class 2)';
  spoofAcceptanceRate: '< 0.002%';
  falseAcceptanceRate: '1:50,000';
  enrolledFingersCount: number;
  secureEnclaveIsolation: 'TrustZone / seL4 Verified';
  hardwarePromptAvailable: boolean;
}

export interface HardwareHalState {
  // Carrier & IMS
  activeCarrierId: string;
  volteEnabled: boolean;
  vowifiEnabled: boolean;
  imsRegistered: boolean;
  signalBars: number;
  networkType: '5G' | '4G LTE' | '3G';
  // Camera HAL
  camera: CameraHalConfig;
  // Biometrics
  biometrics: BiometricHalStatus;
}

const STORAGE_KEY = 'libredroid_hardware_hal_v1';

class HardwareHalBridge {
  private state: HardwareHalState;

  constructor() {
    this.state = this.loadConfig();
  }

  private loadConfig(): HardwareHalState {
    const saved = persistenceService.getItem<HardwareHalState>(STORAGE_KEY);
    if (saved) return saved;

    return {
      activeCarrierId: 'tmobile_us',
      volteEnabled: true,
      vowifiEnabled: true,
      imsRegistered: true,
      signalBars: 4,
      networkType: '5G',
      camera: {
        apiLevel: 'LEVEL_3',
        rawStreamEnabled: true,
        computationalPhotography: true,
        gcamTuningProfile: 'HDR+ Enhanced',
        multiLensArray: [
          { id: 'cam-0', type: 'wide', focalLength: '24mm', aperture: 'f/1.68', resolutionMp: 50, sensorVendor: 'Sony IMX890 / LYT-808' },
          { id: 'cam-1', type: 'ultra_wide', focalLength: '14mm', aperture: 'f/2.2', resolutionMp: 48, sensorVendor: 'Sony IMX581 120° FOV' },
          { id: 'cam-2', type: 'telephoto', focalLength: '120mm', aperture: 'f/2.8', resolutionMp: 64, sensorVendor: 'OmniVision OV64B 5x Periscope' },
        ],
        activeLens: 'wide',
      },
      biometrics: {
        sensorType: 'Ultrasonic Under-Display',
        cddClass: 'BIOMETRIC_STRONG (Class 3)',
        spoofAcceptanceRate: '< 0.002%',
        falseAcceptanceRate: '1:50,000',
        enrolledFingersCount: 2,
        secureEnclaveIsolation: 'TrustZone / seL4 Verified',
        hardwarePromptAvailable: true,
      },
    };
  }

  private saveConfig(): void {
    persistenceService.setItem(STORAGE_KEY, this.state);
    systemBus.emit('system:hal_updated', this.state);
  }

  public getState(): HardwareHalState {
    return { ...this.state };
  }

  public getActiveCarrier(): CarrierProfile {
    return GLOBAL_CARRIER_PROFILES.find(c => c.id === this.state.activeCarrierId) || GLOBAL_CARRIER_PROFILES[0];
  }

  public setCarrier(carrierId: string): void {
    const carrier = GLOBAL_CARRIER_PROFILES.find(c => c.id === carrierId);
    if (carrier) {
      this.state.activeCarrierId = carrierId;
      this.state.imsRegistered = true;
      this.saveConfig();
    }
  }

  public toggleVoLte(enabled: boolean): void {
    this.state.volteEnabled = enabled;
    this.saveConfig();
  }

  public toggleVoWiFi(enabled: boolean): void {
    this.state.vowifiEnabled = enabled;
    this.saveConfig();
  }

  public setCameraProfile(profile: CameraHalConfig['gcamTuningProfile']): void {
    this.state.camera.gcamTuningProfile = profile;
    this.saveConfig();
  }

  public setActiveLens(lens: 'wide' | 'ultra_wide' | 'telephoto'): void {
    this.state.camera.activeLens = lens;
    this.saveConfig();
  }

  public applySamsungM14Profile(): void {
    this.state.networkType = '5G';
    this.state.volteEnabled = true;
    this.state.vowifiEnabled = true;
    this.state.camera = {
      apiLevel: 'LEVEL_3',
      rawStreamEnabled: true,
      computationalPhotography: true,
      gcamTuningProfile: 'HDR+ Enhanced',
      multiLensArray: [
        { id: 'cam-0', type: 'wide', focalLength: '26mm', aperture: 'f/1.8', resolutionMp: 50, sensorVendor: 'Samsung ISOCELL JN1 50MP' },
        { id: 'cam-1', type: 'ultra_wide', focalLength: '22mm', aperture: 'f/2.4', resolutionMp: 2, sensorVendor: 'Galaxy Macro Sensor' },
        { id: 'cam-2', type: 'telephoto', focalLength: '24mm', aperture: 'f/2.4', resolutionMp: 2, sensorVendor: 'Galaxy Depth Sensor' },
      ],
      activeLens: 'wide',
    };
    this.state.biometrics = {
      sensorType: 'Capacitive Side-Mounted',
      cddClass: 'BIOMETRIC_STRONG (Class 3)',
      spoofAcceptanceRate: '< 0.002%',
      falseAcceptanceRate: '1:50,000',
      enrolledFingersCount: 2,
      secureEnclaveIsolation: 'TrustZone / seL4 Verified',
      hardwarePromptAvailable: true,
    };
    this.saveConfig();
  }

  public async verifyBiometricScan(): Promise<{ success: boolean; fingerId: number; latencyMs: number }> {
    const start = Date.now();
    await new Promise(r => setTimeout(r, 220));
    const latencyMs = Date.now() - start;
    return {
      success: true,
      fingerId: 1,
      latencyMs,
    };
  }
}

export interface SamsungM14HardwareProfile {
  model: 'SM-M146B' | 'SM-M146B/DS';
  soc: 'Samsung Exynos 1330 (5nm)';
  cpuClusters: string;
  gpu: 'ARM Mali-G68 MP2';
  batteryCapacityMah: 6000;
  chargingRateWatt: 25;
  screenSpec: '6.6" 90Hz FHD+ (1080x2408) Infinity-V';
  cameraSensors: {
    main: string;
    macro: string;
    depth: string;
    selfie: string;
  };
  supported5gBands: string[];
}

export const SAMSUNG_M14_SPEC: SamsungM14HardwareProfile = {
  model: 'SM-M146B',
  soc: 'Samsung Exynos 1330 (5nm)',
  cpuClusters: '2x 2.4GHz Cortex-A78 + 6x 2.0GHz Cortex-A55',
  gpu: 'ARM Mali-G68 MP2',
  batteryCapacityMah: 6000,
  chargingRateWatt: 25,
  screenSpec: '6.6" 90Hz FHD+ (1080x2408) Infinity-V',
  cameraSensors: {
    main: '50 MP f/1.8 PDAF Wide',
    macro: '2 MP f/2.4 Macro',
    depth: '2 MP f/2.4 Depth',
    selfie: '13 MP f/2.0 Wide',
  },
  supported5gBands: ['n1', 'n3', 'n5', 'n7', 'n8', 'n20', 'n28', 'n38', 'n40', 'n41', 'n66', 'n77', 'n78'],
};

export const hardwareHalBridge = new HardwareHalBridge();
