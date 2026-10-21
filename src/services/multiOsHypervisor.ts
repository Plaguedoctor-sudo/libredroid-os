export type OsDomainId = 
  | 'vault-airgap' 
  | 'anonymity-whonix' 
  | 'hardened-android' 
  | 'disposable-alpine' 
  | 'workstation-debian';

export interface OsDomainConfig {
  id: OsDomainId;
  name: string;
  baseOs: string;
  securityRole: string;
  colorBorder: string;
  colorHex: string;
  badgeLabel: string;
  networkMode: 'airgapped-none' | 'tor-gateway' | 'firewalled-bridge' | 'ephemeral-nat' | 'standard-nat';
  persistence: 'non-persistent-ram' | 'encrypted-vault' | 'sandboxed-storage' | 'persistent-ext4';
  vCpuCores: number;
  memoryAllocatedMb: number;
  status: 'running' | 'idle' | 'stopped';
  runningApps: string[];
  description: string;
}

export interface InterDomainTransfer {
  id: string;
  timestamp: string;
  sourceDomain: OsDomainId;
  targetDomain: OsDomainId;
  type: 'clipboard' | 'file';
  summary: string;
  status: 'verified_allowed' | 'quarantined' | 'user_prompt';
}

export const MULTI_OS_DOMAINS: OsDomainConfig[] = [
  {
    id: 'vault-airgap',
    name: 'Air-Gapped Vault OS',
    baseOs: 'seL4 Microkernel / OpenBSD Pledge',
    securityRole: 'Cryptographic Keys, Passwords, Root Identity',
    colorBorder: 'border-blue-500 shadow-blue-500/20',
    colorHex: '#3b82f6',
    badgeLabel: 'Vault (Air-Gapped)',
    networkMode: 'airgapped-none',
    persistence: 'encrypted-vault',
    vCpuCores: 2,
    memoryAllocatedMb: 256,
    status: 'running',
    runningApps: ['notes', 'settings'],
    description: 'Mathematically verified seL4 microkernel. Zero network interface drivers loaded. Holds GPG keys, master password vault, and root identities.',
  },
  {
    id: 'anonymity-whonix',
    name: 'Whonix Anonymity OS',
    baseOs: 'Whonix Linux + Tor Gateway',
    securityRole: 'Private Browsing & Anonymity Mesh',
    colorBorder: 'border-purple-500 shadow-purple-500/20',
    colorHex: '#a855f7',
    badgeLabel: 'Whonix (Tor Routed)',
    networkMode: 'tor-gateway',
    persistence: 'non-persistent-ram',
    vCpuCores: 2,
    memoryAllocatedMb: 512,
    status: 'running',
    runningApps: ['browser'],
    description: '100% of network sockets are physically routed through an isolated Tor Gateway VM. Browser exploits cannot discover your real IP address or MAC address.',
  },
  {
    id: 'hardened-android',
    name: 'GrapheneOS Android Container',
    baseOs: 'Hardened AOSP 15 + SELinux Enforcing',
    securityRole: 'Untrusted Android APK Execution',
    colorBorder: 'border-amber-500 shadow-amber-500/20',
    colorHex: '#eab308',
    badgeLabel: 'GrapheneOS Android',
    networkMode: 'firewalled-bridge',
    persistence: 'sandboxed-storage',
    vCpuCores: 4,
    memoryAllocatedMb: 1024,
    status: 'running',
    runningApps: ['org.videolan.vlc', 'org.schabi.newpipe', 'apk_installer'],
    description: 'Containerized Android user-space with hardened memory allocator, sandboxed Google Play compatibility (microG), and per-app network killswitches.',
  },
  {
    id: 'disposable-alpine',
    name: 'Disposable Ephemeral MicroVM',
    baseOs: 'Alpine Linux (RAM-only musl/busybox)',
    securityRole: 'Untrusted Downloads, Suspicious Links, Malicious Files',
    colorBorder: 'border-red-500 shadow-red-500/20',
    colorHex: '#ef4444',
    badgeLabel: 'Disposable VM (RAM Only)',
    networkMode: 'ephemeral-nat',
    persistence: 'non-persistent-ram',
    vCpuCores: 2,
    memoryAllocatedMb: 256,
    status: 'running',
    runningApps: ['terminal'],
    description: 'Disposable Qube. Runs strictly in RAM. When this window closes, the entire operating system and all files are permanently purged from memory.',
  },
  {
    id: 'workstation-debian',
    name: 'Debian Workstation OS',
    baseOs: 'Debian GNU/Linux 12 (Bookworm)',
    securityRole: 'Everyday Productivity & Development',
    colorBorder: 'border-emerald-500 shadow-emerald-500/20',
    colorHex: '#10b981',
    badgeLabel: 'Workstation OS',
    networkMode: 'standard-nat',
    persistence: 'persistent-ext4',
    vCpuCores: 4,
    memoryAllocatedMb: 1024,
    status: 'running',
    runningApps: ['files', 'calculator', 'clock'],
    description: 'Hardened general workstation container for trusted office documents, Nextcloud sync, and local development.',
  },
];

export const INITIAL_INTER_DOMAIN_TRANSFERS: InterDomainTransfer[] = [
  {
    id: 'tx-1',
    timestamp: 'Just now',
    sourceDomain: 'anonymity-whonix',
    targetDomain: 'disposable-alpine',
    type: 'clipboard',
    summary: 'Sanitized URL copied from Whonix Tor Browser to Disposable Alpine VM.',
    status: 'verified_allowed',
  },
  {
    id: 'tx-2',
    timestamp: '14 mins ago',
    sourceDomain: 'disposable-alpine',
    targetDomain: 'vault-airgap',
    type: 'clipboard',
    summary: 'BLOCKED: Untrusted Disposable VM attempted cross-domain clipboard leak into Air-Gapped Vault.',
    status: 'quarantined',
  },
  {
    id: 'tx-3',
    timestamp: '1 hour ago',
    sourceDomain: 'workstation-debian',
    targetDomain: 'hardened-android',
    type: 'file',
    summary: 'Transferred "presentation.pdf" via qvm-copy file bridge with user approval.',
    status: 'verified_allowed',
  },
];
