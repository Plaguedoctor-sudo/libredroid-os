export interface SideloadedAppleApp {
  id: string;
  name: string;
  bundleId: string;
  version: string;
  size: string;
  iconBg: string;
  iconName: string;
  minimumIosVersion: string;
  architecture: 'arm64' | 'universal2' | 'x86_64';
  framework: 'UIKit' | 'SwiftUI' | 'AppKit' | 'Metal' | 'Hypervisor';
  entitlements: string[];
  installedAt: string;
  category: 'media' | 'utility' | 'productivity' | 'games';
  description: string;
  binaryType: 'Mach-O 64-bit' | 'Universal Fat Binary';
  codeSignature: 'Ad-Hoc (Bypassed)' | 'Apple Development' | 'App Store Verified';
}

const STORAGE_KEY = 'libredroid_installed_apple_apps';

export const DEFAULT_FOSS_APPLE_APPS: SideloadedAppleApp[] = [
  {
    id: 'com.christianselig.apollo',
    name: 'Apollo for Reddit',
    bundleId: 'com.christianselig.apollo',
    version: '1.15.11',
    size: '48.2 MB',
    iconBg: 'bg-gradient-to-tr from-orange-500 via-amber-500 to-rose-600',
    iconName: 'MessageSquare',
    minimumIosVersion: 'iOS 15.0+',
    architecture: 'arm64',
    framework: 'UIKit',
    entitlements: ['com.apple.security.network.client', 'get-task-allow'],
    installedAt: 'Pre-installed',
    category: 'media',
    description: 'The award-winning iOS Reddit client with gesture-driven navigation and media preview.',
    binaryType: 'Mach-O 64-bit',
    codeSignature: 'Ad-Hoc (Bypassed)',
  },
  {
    id: 'com.rileytestut.delta',
    name: 'Delta Retro Emulator',
    bundleId: 'com.rileytestut.delta',
    version: '1.6.0',
    size: '62.7 MB',
    iconBg: 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500',
    iconName: 'Gamepad2',
    minimumIosVersion: 'iOS 14.0+',
    architecture: 'arm64',
    framework: 'Metal',
    entitlements: ['com.apple.developer.game-center', 'com.apple.security.files.user-selected.read-write'],
    installedAt: 'Pre-installed',
    category: 'games',
    description: 'All-in-one retro video game emulator for NES, SNES, N64, GBC, and GBA with custom controller skins.',
    binaryType: 'Mach-O 64-bit',
    codeSignature: 'Ad-Hoc (Bypassed)',
  },
  {
    id: 'com.firecore.infuse',
    name: 'Infuse Media Player',
    bundleId: 'com.firecore.infuse',
    version: '7.7.2',
    size: '84.5 MB',
    iconBg: 'bg-gradient-to-tr from-rose-600 via-red-600 to-orange-600',
    iconName: 'Film',
    minimumIosVersion: 'iOS 16.0+',
    architecture: 'arm64',
    framework: 'Metal',
    entitlements: ['com.apple.security.network.client', 'com.apple.developer.associated-domains'],
    installedAt: 'Pre-installed',
    category: 'media',
    description: 'High-performance iOS media player with hardware 4K HDR playback, spatial audio, and metadata fetching.',
    binaryType: 'Mach-O 64-bit',
    codeSignature: 'Ad-Hoc (Bypassed)',
  },
  {
    id: 'org.cryptomator.ios',
    name: 'Cryptomator Vault',
    bundleId: 'org.cryptomator.ios',
    version: '2.5.3',
    size: '29.1 MB',
    iconBg: 'bg-gradient-to-tr from-teal-600 via-emerald-600 to-cyan-700',
    iconName: 'Lock',
    minimumIosVersion: 'iOS 15.0+',
    architecture: 'arm64',
    framework: 'SwiftUI',
    entitlements: ['com.apple.security.keychain', 'com.apple.developer.icloud-container-identifiers'],
    installedAt: 'Pre-installed',
    category: 'productivity',
    description: 'Client-side transparent AES-256 encryption for cloud files with simulated Face ID unlock.',
    binaryType: 'Mach-O 64-bit',
    codeSignature: 'Ad-Hoc (Bypassed)',
  },
  {
    id: 'io.ente.photos.ios',
    name: 'Ente Encrypted Photos',
    bundleId: 'io.ente.photos.ios',
    version: '0.9.14',
    size: '38.0 MB',
    iconBg: 'bg-gradient-to-tr from-blue-600 via-cyan-600 to-teal-500',
    iconName: 'Image',
    minimumIosVersion: 'iOS 15.0+',
    architecture: 'arm64',
    framework: 'SwiftUI',
    entitlements: ['com.apple.security.personal-information.photos', 'com.apple.security.network.client'],
    installedAt: 'Pre-installed',
    category: 'media',
    description: 'End-to-end encrypted alternative to Apple Photos & Google Photos with zero-knowledge architecture.',
    binaryType: 'Mach-O 64-bit',
    codeSignature: 'Ad-Hoc (Bypassed)',
  },
  {
    id: 'com.utmapp.UTM',
    name: 'UTM Virtual Machines',
    bundleId: 'com.utmapp.UTM',
    version: '4.5.3',
    size: '112.4 MB',
    iconBg: 'bg-gradient-to-tr from-slate-700 via-neutral-800 to-zinc-900',
    iconName: 'Cpu',
    minimumIosVersion: 'iOS 15.4+',
    architecture: 'arm64',
    framework: 'Hypervisor',
    entitlements: ['dynamic-codesigning', 'com.apple.vm.hypervisor'],
    installedAt: 'Pre-installed',
    category: 'utility',
    description: 'Full featured system emulator and virtual machine host for iOS & macOS based on QEMU.',
    binaryType: 'Mach-O 64-bit',
    codeSignature: 'Ad-Hoc (Bypassed)',
  },
];

export function getInstalledAppleApps(): SideloadedAppleApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FOSS_APPLE_APPS));
      return DEFAULT_FOSS_APPLE_APPS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FOSS_APPLE_APPS;
  } catch {
    return DEFAULT_FOSS_APPLE_APPS;
  }
}

export function saveInstalledAppleApp(app: SideloadedAppleApp): SideloadedAppleApp[] {
  const current = getInstalledAppleApps();
  const existingIndex = current.findIndex(a => a.bundleId === app.bundleId || a.id === app.id);
  let updated: SideloadedAppleApp[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = app;
  } else {
    updated = [app, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save Apple app to localStorage', e);
  }
  return updated;
}

export function uninstallAppleApp(bundleId: string): SideloadedAppleApp[] {
  const current = getInstalledAppleApps();
  const filtered = current.filter(a => a.bundleId !== bundleId && a.id !== bundleId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to uninstall Apple app from localStorage', e);
  }
  return filtered;
}

export async function parseIpaFile(file: File): Promise<SideloadedAppleApp> {
  const cleanName = file.name.replace(/\.(ipa|app|zip)$/i, '');
  const bundleSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.');
  const bundleId = bundleSlug.includes('.') ? bundleSlug : `com.darwin.${bundleSlug}`;
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

  // Gradient selection for icons
  const gradients = [
    'bg-gradient-to-tr from-pink-500 via-rose-600 to-red-600',
    'bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-700',
    'bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-700',
    'bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-700',
    'bg-gradient-to-tr from-amber-500 via-orange-600 to-red-500',
  ];
  const chosenGradient = gradients[Math.floor(Math.random() * gradients.length)];

  // Formatted app title
  const formattedTitle = cleanName
    .replace(/[-_.]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: bundleId,
    name: formattedTitle || 'Darwin iOS App',
    bundleId,
    version: '1.0.0',
    size: `${sizeMb} MB`,
    iconBg: chosenGradient,
    iconName: 'Apple',
    minimumIosVersion: 'iOS 16.0+',
    architecture: 'arm64',
    framework: 'UIKit',
    entitlements: ['com.apple.security.network.client', 'com.apple.security.sandbox'],
    installedAt: new Date().toLocaleDateString(),
    category: 'utility',
    description: `Sideloaded iOS/macOS application package extracted from ${file.name}. Mach-O binary mapped to Darwin CocoaTouch bridge.`,
    binaryType: 'Mach-O 64-bit',
    codeSignature: 'Ad-Hoc (Bypassed)',
  };
}
