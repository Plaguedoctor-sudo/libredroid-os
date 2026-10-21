export interface HardwareSpecs {
  cpuCores: number;
  cpuArchitecture: string;
  ramGb: number;
  gpuVendor: string;
  gpuRenderer: string;
  hasHardwareGpu: boolean;
  hasTouch: boolean;
  maxTouchPoints: number;
  pointerType: 'fine' | 'coarse' | 'hybrid';
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  colorDepth: number;
  refreshRateEstimate: number;
  batterySupported: boolean;
  batteryLevel: number;
  isCharging: boolean;
  networkType: string;
  networkDownlink: number;
  saveDataActive: boolean;
  tier: 'low-end' | 'mid-range' | 'flagship' | 'workstation';
}

export interface AdaptivePolicy {
  tier: 'low-end' | 'mid-range' | 'flagship' | 'workstation';
  enableBlur: boolean;
  animationScale: number; // 0 (off), 0.5 (fast), 1.0 (smooth)
  maxActiveWindows: number;
  backgroundTasksLimit: number;
  renderScale: number;
  powerGovernor: 'powersave' | 'balanced' | 'performance';
  defaultFormFactor: 'phone' | 'tablet' | 'desktop';
  description: string;
}

export const detectHardwareSpecs = async (): Promise<HardwareSpecs> => {
  // 1. CPU
  const cpuCores = navigator.hardwareConcurrency || 4;
  const cpuArchitecture = navigator.userAgent.includes('ARM') || navigator.userAgent.includes('Android')
    ? 'ARM64 (aarch64)'
    : 'x86_64 (AMD64)';

  // 2. RAM (navigator.deviceMemory in GB if supported, fallback to estimation based on cores)
  const navMemory = (navigator as any).deviceMemory;
  const ramGb = navMemory ? navMemory : cpuCores >= 8 ? 16 : cpuCores >= 4 ? 8 : 4;

  // 3. GPU via WebGL Debug Info
  let gpuVendor = 'Generic Standard GPU';
  let gpuRenderer = 'Mesa Software Rasterizer';
  let hasHardwareGpu = false;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Mesa / Khronos';
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'ANGLE Hardware Acceleration';
        hasHardwareGpu = !gpuRenderer.toLowerCase().includes('llvmpipe') && !gpuRenderer.toLowerCase().includes('software');
      } else {
        gpuRenderer = gl.getParameter(gl.RENDERER) || 'Hardware Accelerated';
        hasHardwareGpu = true;
      }
    }
  } catch {
    hasHardwareGpu = false;
  }

  // 4. Input & Touch
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const hasTouch = maxTouchPoints > 0;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  const pointerType = hasTouch && isFinePointer ? 'hybrid' : hasTouch ? 'coarse' : 'fine';

  // 5. Display & Refresh Rate
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const colorDepth = window.screen.colorDepth || 24;

  // 6. Battery
  let batterySupported = false;
  let batteryLevel = 85;
  let isCharging = false;

  try {
    const navBattery = await (navigator as any).getBattery?.();
    if (navBattery) {
      batterySupported = true;
      batteryLevel = Math.round(navBattery.level * 100);
      isCharging = navBattery.charging;
    }
  } catch {}

  // 7. Network
  const conn = (navigator as any).connection;
  const networkType = conn?.effectiveType || '4g';
  const networkDownlink = conn?.downlink || 10;
  const saveDataActive = !!conn?.saveData;

  // 8. Compute Tier
  let tier: 'low-end' | 'mid-range' | 'flagship' | 'workstation' = 'mid-range';
  if (cpuCores >= 8 && ramGb >= 12 && hasHardwareGpu && !hasTouch) {
    tier = 'workstation';
  } else if (cpuCores >= 6 && ramGb >= 6 && hasHardwareGpu) {
    tier = 'flagship';
  } else if (cpuCores <= 2 || ramGb <= 3 || !hasHardwareGpu) {
    tier = 'low-end';
  } else {
    tier = 'mid-range';
  }

  return {
    cpuCores,
    cpuArchitecture,
    ramGb,
    gpuVendor,
    gpuRenderer,
    hasHardwareGpu,
    hasTouch,
    maxTouchPoints,
    pointerType,
    screenWidth,
    screenHeight,
    devicePixelRatio,
    colorDepth,
    refreshRateEstimate: window.matchMedia('(min-resolution: 2dppx)').matches ? 120 : 60,
    batterySupported,
    batteryLevel,
    isCharging,
    networkType,
    networkDownlink,
    saveDataActive,
    tier,
  };
};

export const getAdaptivePolicyForHardware = (specs: HardwareSpecs): AdaptivePolicy => {
  switch (specs.tier) {
    case 'workstation':
      return {
        tier: 'workstation',
        enableBlur: true,
        animationScale: 1.0,
        maxActiveWindows: 12,
        backgroundTasksLimit: 16,
        renderScale: 1.0,
        powerGovernor: 'performance',
        defaultFormFactor: 'desktop',
        description: 'Multi-Core Workstation Detected: Full GPU acceleration, high-density desktop windowing, 120Hz glassmorphism enabled.',
      };

    case 'flagship':
      return {
        tier: 'flagship',
        enableBlur: true,
        animationScale: 1.0,
        maxActiveWindows: 6,
        backgroundTasksLimit: 8,
        renderScale: 1.0,
        powerGovernor: specs.isCharging ? 'performance' : 'balanced',
        defaultFormFactor: specs.screenWidth > 1024 ? 'desktop' : specs.hasTouch ? 'tablet' : 'desktop',
        description: 'Flagship Hardware Detected: Smooth 60/120fps fluid physics, balanced memory policy, hardware shaders active.',
      };

    case 'low-end':
      return {
        tier: 'low-end',
        enableBlur: false,
        animationScale: 0.4,
        maxActiveWindows: 2,
        backgroundTasksLimit: 3,
        renderScale: 0.9,
        powerGovernor: 'powersave',
        defaultFormFactor: 'phone',
        description: 'Low-Spec Hardware (Android Go Profile): Disabled GPU blur shaders, reduced animation overhead, aggressive memory reclaiming.',
      };

    case 'mid-range':
    default:
      return {
        tier: 'mid-range',
        enableBlur: true,
        animationScale: 0.8,
        maxActiveWindows: 4,
        backgroundTasksLimit: 6,
        renderScale: 1.0,
        powerGovernor: 'balanced',
        defaultFormFactor: specs.hasTouch ? 'tablet' : 'desktop',
        description: 'Standard Hardware Profile: Adaptive glassmorphism, responsive window manager, optimized battery drain.',
      };
  }
};
