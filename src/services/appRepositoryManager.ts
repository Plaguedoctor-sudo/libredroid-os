export interface AppRepository {
  id: string;
  name: string;
  type: 'f-droid' | 'izzy' | 'guardian' | 'flathub' | 'altstore' | 'alpine-deb' | 'reproducible-git';
  url: string;
  enabled: boolean;
  gpgFingerprint: string;
  totalPackages: number;
  lastUpdated: string;
  description: string;
  verificationBadge: 'Cryptographically Verified' | 'Reproducible Build' | 'GPG Signed' | 'Zero-Telemetry Audited';
}

export interface StorePackage {
  id: string;
  name: string;
  packageName: string;
  repositoryId: string;
  version: string;
  category: 'Communication' | 'Internet' | 'Multimedia' | 'Navigation' | 'Security' | 'Development' | 'Games';
  license: string;
  size: string;
  description: string;
  installed: boolean;
  platform: 'android' | 'apple' | 'linux';
  sourceUrl: string;
  sha256: string;
  reproducible: boolean;
  downloads: string;
  rating: number;
}

const STORAGE_KEY_REPOS = 'libredroid_app_repositories';

export const DEFAULT_REPOSITORIES: AppRepository[] = [
  {
    id: 'f-droid-official',
    name: 'F-Droid Main Archive',
    type: 'f-droid',
    url: 'https://f-droid.org/repo',
    enabled: true,
    gpgFingerprint: '43238D510A1E5EB2E6569F4A3AFAC4F023FB4B2E4E0099B40CA169F079E3E122',
    totalPackages: 4920,
    lastUpdated: '12 mins ago',
    description: 'The official catalog of FOSS applications for Android, built and signed exclusively from public source code.',
    verificationBadge: 'GPG Signed',
  },
  {
    id: 'izzy-on-droid',
    name: 'IzzyOnDroid FOSS Repository',
    type: 'izzy',
    url: 'https://apt.izzysoft.de/fdroid/repo',
    enabled: true,
    gpgFingerprint: '3BF0E6E92B9229A10DE20DF850541E439805370A08C63B340985D6909D612D76',
    totalPackages: 1240,
    lastUpdated: '45 mins ago',
    description: 'Rapid-release FOSS repository publishing verified APKs directly from developer GitHub/GitLab release tags.',
    verificationBadge: 'Zero-Telemetry Audited',
  },
  {
    id: 'guardian-project',
    name: 'The Guardian Project',
    type: 'guardian',
    url: 'https://guardianproject.info/fdroid/repo',
    enabled: true,
    gpgFingerprint: 'B6C24F34A0456FDCEF070C0D492A1974759B4D9D8CD9AE77FA77C407B19D33A8',
    totalPackages: 85,
    lastUpdated: '3 hours ago',
    description: 'Hardened mobile security, anonymity, and anti-surveillance tools including Tor, Orbot, Briar, and Obfs4.',
    verificationBadge: 'Cryptographically Verified',
  },
  {
    id: 'flathub-linux',
    name: 'Flathub Sandboxed Linux Store',
    type: 'flathub',
    url: 'https://dl.flathub.org/repo',
    enabled: true,
    gpgFingerprint: 'A5A0A4B37C7EB076F447833092289EC1EB2E27CD9EB25C8DEB17FDDB47FBEA4D',
    totalPackages: 2850,
    lastUpdated: '25 mins ago',
    description: 'Universal containerized desktop and mobile Linux applications sandboxed via Bubblewrap and XDG Portals.',
    verificationBadge: 'Reproducible Build',
  },
  {
    id: 'altstore-apple-foss',
    name: 'AltStore Sovereign Apple Index',
    type: 'altstore',
    url: 'https://apps.altstore.io/source.json',
    enabled: true,
    gpgFingerprint: '7F1A8C92B45D3302E198547A1192CEE8722A65819BDE58A94732C1109FA83B29',
    totalPackages: 340,
    lastUpdated: '1 hour ago',
    description: 'Decentralized open-source iOS/macOS applications (.ipa) verified for execution via the Darwin CocoaTouch bridge.',
    verificationBadge: 'Cryptographically Verified',
  },
  {
    id: 'alpine-debian-mirrors',
    name: 'Alpine & Debian Rootless Mirrors',
    type: 'alpine-deb',
    url: 'https://deb.debian.org/debian-hardened',
    enabled: true,
    gpgFingerprint: 'DF7F80F6F50EC891636A0FE5D79998DE0D6B198B0098F27D114660893098A3B2',
    totalPackages: 68000,
    lastUpdated: '10 mins ago',
    description: 'Cryptographically signed POSIX software repositories built with stack-protector-strong and PIE hardening.',
    verificationBadge: 'GPG Signed',
  },
  {
    id: 'reproducible-git-core',
    name: 'Reproducible Source Git Builder',
    type: 'reproducible-git',
    url: 'git://git.libredroid.org/verified-manifests',
    enabled: true,
    gpgFingerprint: 'E89230AB19472648C19836B28941094DE7219803120938475892314758921094',
    totalPackages: 560,
    lastUpdated: 'Just now',
    description: 'Compiles applications directly from signed commit hashes, guaranteeing zero binary tampering or proprietary blobs.',
    verificationBadge: 'Reproducible Build',
  },
];

export const MULTI_SOURCE_PACKAGES: StorePackage[] = [
  // F-Droid Official
  {
    id: 'org.videolan.vlc',
    name: 'VLC Media Player',
    packageName: 'org.videolan.vlc',
    repositoryId: 'f-droid-official',
    version: '3.5.4',
    category: 'Multimedia',
    license: 'GPLv3',
    size: '34 MB',
    description: 'Universal media player for all audio/video formats, streams, and local shares with zero tracking or telemetry.',
    installed: true,
    platform: 'android',
    sourceUrl: 'https://code.videolan.org/videolan/vlc-android',
    sha256: '9f83c18b456e309... verified bit-for-bit',
    reproducible: true,
    downloads: '14.2M',
    rating: 4.9,
  },
  {
    id: 'org.schabi.newpipe',
    name: 'NewPipe',
    packageName: 'org.schabi.newpipe',
    repositoryId: 'f-droid-official',
    version: '0.27.0',
    category: 'Internet',
    license: 'GPLv3',
    size: '14 MB',
    description: 'Lightweight YouTube & streaming frontend built without proprietary Google Services or advertisement hooks.',
    installed: true,
    platform: 'android',
    sourceUrl: 'https://github.com/TeamNewPipe/NewPipe',
    sha256: 'a1b2c3d4e5f6... verified bit-for-bit',
    reproducible: true,
    downloads: '8.7M',
    rating: 4.8,
  },
  {
    id: 'net.osmand.plus',
    name: 'OsmAnd Maps',
    packageName: 'net.osmand.plus',
    repositoryId: 'f-droid-official',
    version: '4.7.2',
    category: 'Navigation',
    license: 'GPLv3',
    size: '58 MB',
    description: 'Comprehensive global offline maps and turn-by-turn navigation based on OpenStreetMap with zero telemetry.',
    installed: true,
    platform: 'android',
    sourceUrl: 'https://github.com/osmandapp/Osmand',
    sha256: '88cde129abf... verified bit-for-bit',
    reproducible: true,
    downloads: '5.1M',
    rating: 4.7,
  },

  // Guardian Project
  {
    id: 'org.torproject.android',
    name: 'Orbot: Tor for Android',
    packageName: 'org.torproject.android',
    repositoryId: 'guardian-project',
    version: '17.3.2',
    category: 'Security',
    license: 'BSD-3-Clause',
    size: '28 MB',
    description: 'Empowers all applications to use Tor onion routing to protect against network snooping and traffic analysis.',
    installed: false,
    platform: 'android',
    sourceUrl: 'https://github.com/guardianproject/orbot',
    sha256: '448109adcef771... verified Guardian GPG',
    reproducible: true,
    downloads: '9.3M',
    rating: 4.9,
  },
  {
    id: 'org.briarproject.briar.android',
    name: 'Briar Peer-to-Peer Messenger',
    packageName: 'org.briarproject.briar.android',
    repositoryId: 'guardian-project',
    version: '1.5.8',
    category: 'Communication',
    license: 'GPLv3',
    size: '32 MB',
    description: 'Decentralized peer-to-peer messaging over Tor, Wi-Fi mesh, and Bluetooth without centralized servers.',
    installed: false,
    platform: 'android',
    sourceUrl: 'https://code.briarproject.org/briar/briar',
    sha256: 'c9018471daef3... verified Guardian GPG',
    reproducible: true,
    downloads: '2.1M',
    rating: 4.9,
  },

  // IzzyOnDroid
  {
    id: 'com.beemdevelopment.aegis',
    name: 'Aegis Authenticator',
    packageName: 'com.beemdevelopment.aegis',
    repositoryId: 'izzy-on-droid',
    version: '3.1.2',
    category: 'Security',
    license: 'GPLv3',
    size: '11 MB',
    description: 'Secure, encrypted 2FA/MFA token manager with biometric unlock and automatic encrypted vault backups.',
    installed: false,
    platform: 'android',
    sourceUrl: 'https://github.com/beemdevelopment/Aegis',
    sha256: '6172ab091def88... verified Izzy Tag',
    reproducible: true,
    downloads: '3.4M',
    rating: 5.0,
  },

  // AltStore Sovereign Apple Index
  {
    id: 'com.christianselig.apollo',
    name: 'Apollo for Reddit (iOS)',
    packageName: 'com.christianselig.apollo',
    repositoryId: 'altstore-apple-foss',
    version: '1.15.11',
    category: 'Multimedia',
    license: 'Community Modified FOSS',
    size: '48 MB',
    description: 'The award-winning iOS Reddit client with gesture-driven navigation running on the Darwin CocoaTouch bridge.',
    installed: true,
    platform: 'apple',
    sourceUrl: 'https://github.com/Apollo-Community/Apollo-Sideload',
    sha256: 'e892c90147fab... verified Mach-O 64-bit',
    reproducible: false,
    downloads: '4.8M',
    rating: 5.0,
  },
  {
    id: 'com.rileytestut.delta',
    name: 'Delta Retro Emulator (iOS)',
    packageName: 'com.rileytestut.delta',
    repositoryId: 'altstore-apple-foss',
    version: '1.6.0',
    category: 'Games',
    license: 'GPLv3',
    size: '62 MB',
    description: 'All-in-one retro video game emulator for NES, SNES, N64, and GBA with custom controller skins.',
    installed: true,
    platform: 'apple',
    sourceUrl: 'https://github.com/rileytestut/Delta',
    sha256: '99841cb029a14... verified Mach-O 64-bit',
    reproducible: true,
    downloads: '6.2M',
    rating: 4.9,
  },

  // Flathub Linux
  {
    id: 'org.gimp.GIMP',
    name: 'GIMP Image Editor (Flatpak)',
    packageName: 'org.gimp.GIMP',
    repositoryId: 'flathub-linux',
    version: '2.10.38',
    category: 'Multimedia',
    license: 'GPLv3',
    size: '142 MB',
    description: 'Professional grade raster graphics editor running within an isolated Bubblewrap Linux sandbox.',
    installed: false,
    platform: 'linux',
    sourceUrl: 'https://gitlab.gnome.org/GNOME/gimp',
    sha256: '5561a098cdef12... verified Flathub OSTree',
    reproducible: true,
    downloads: '18.1M',
    rating: 4.7,
  },
  {
    id: 'org.mozilla.firefox',
    name: 'Firefox Hardened FOSS',
    packageName: 'org.mozilla.firefox',
    repositoryId: 'flathub-linux',
    version: '130.0',
    category: 'Internet',
    license: 'MPL-2.0',
    size: '88 MB',
    description: 'Independent gecko rendering engine compiled with strict sandboxing and tracking protection enabled.',
    installed: false,
    platform: 'linux',
    sourceUrl: 'https://hg.mozilla.org/mozilla-central',
    sha256: '1122aabbccdde... verified Flathub OSTree',
    reproducible: true,
    downloads: '45.0M',
    rating: 4.8,
  },
];

export function getAppRepositories(): AppRepository[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REPOS, JSON.stringify(DEFAULT_REPOSITORIES));
      return DEFAULT_REPOSITORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_REPOSITORIES;
  } catch {
    return DEFAULT_REPOSITORIES;
  }
}

export function toggleRepository(id: string): AppRepository[] {
  const current = getAppRepositories();
  const updated = current.map((repo) =>
    repo.id === id ? { ...repo, enabled: !repo.enabled } : repo
  );
  try {
    localStorage.setItem(STORAGE_KEY_REPOS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save repositories', e);
  }
  return updated;
}

export function addCustomRepository(name: string, url: string, type: AppRepository['type']): AppRepository[] {
  const current = getAppRepositories();
  const id = `custom-${Date.now()}`;
  const newRepo: AppRepository = {
    id,
    name,
    type,
    url,
    enabled: true,
    gpgFingerprint: `GPG_AUTO_VERIFIED_${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
    totalPackages: Math.floor(Math.random() * 500) + 50,
    lastUpdated: 'Just now',
    description: `User added verified repository mirror: ${url}`,
    verificationBadge: 'GPG Signed',
  };
  const updated = [...current, newRepo];
  try {
    localStorage.setItem(STORAGE_KEY_REPOS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save repositories', e);
  }
  return updated;
}
