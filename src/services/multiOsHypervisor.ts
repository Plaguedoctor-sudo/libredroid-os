export type OsDomainId = 
  | 'vault-airgap' 
  | 'anonymity-whonix' 
  | 'hardened-android' 
  | 'disposable-alpine' 
  | 'workstation-debian';

export interface TorCircuitNode {
  type: 'guard' | 'middle' | 'exit';
  name: string;
  country: string;
  flag: string;
  ip: string;
  latencyMs: number;
}

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
  technicalGuarantee: string;
  details: {
    // Vault specific
    isabelleProofStatus?: string;
    networkDriversLoaded?: number;
    pledgePromises?: string;
    masterKeyFingerprint?: string;
    
    // Whonix specific
    torGatewayIp?: string;
    torWorkstationIp?: string;
    socks5Port?: number;
    torCircuit?: TorCircuitNode[];
    exitIp?: string;
    
    // GrapheneOS Android specific
    aospVersion?: string;
    hardenedMallocActive?: boolean;
    memoryTaggingMode?: 'Synchronous MTE' | 'Asynchronous' | 'Off';
    microgSandboxed?: boolean;
    perAppFirewallCount?: number;
    
    // Disposable Alpine specific
    tmpfsMounted?: boolean;
    volatileRamUsageMb?: number;
    persistedDiskBytes?: number;
    detonationCount?: number;
    
    // Debian Workstation specific
    luksCipher?: string;
    argon2idKdf?: boolean;
    nextcloudSyncStatus?: 'connected' | 'syncing' | 'idle';
    nextcloudStorageQuota?: string;
    aptRepoSigning?: string;
  };
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
    securityRole: 'Master Passwords, Cryptographic Keys, Root Identity',
    colorBorder: 'border-blue-500 shadow-blue-500/20',
    colorHex: '#3b82f6',
    badgeLabel: 'Vault (Air-Gapped)',
    networkMode: 'airgapped-none',
    persistence: 'encrypted-vault',
    vCpuCores: 2,
    memoryAllocatedMb: 256,
    status: 'running',
    runningApps: ['notes', 'settings'],
    description: 'Mathematically verified seL4 microkernel. Zero network drivers loaded. Even if the rest of the machine is exploited, the vault remains physically unreachable from network sockets.',
    technicalGuarantee: 'Zero network drivers loaded. Mathematically verified microkernel proof (Isabelle/HOL). Even if the rest of the machine is exploited, the vault remains physically unreachable from network sockets.',
    details: {
      isabelleProofStatus: 'Verified (Confidentiality & Integrity Invariants Proved)',
      networkDriversLoaded: 0,
      pledgePromises: 'stdio rpath wpath (Strictly NO socket/bpf/network syscalls)',
      masterKeyFingerprint: 'ED25519 4096-bit 0x98A1_C40D_FE31_7942',
    },
  },
  {
    id: 'anonymity-whonix',
    name: 'Whonix Anonymity OS',
    baseOs: 'Whonix Linux + Tor Gateway VM',
    securityRole: 'Private Web Research & Whistleblower Comms',
    colorBorder: 'border-purple-500 shadow-purple-500/20',
    colorHex: '#a855f7',
    badgeLabel: 'Whonix (Tor Routed)',
    networkMode: 'tor-gateway',
    persistence: 'non-persistent-ram',
    vCpuCores: 2,
    memoryAllocatedMb: 512,
    status: 'running',
    runningApps: ['browser'],
    description: 'Hardware-isolated Tor routing. Sockets are bridged through an independent Tor Gateway. Browser zero-day exploits cannot discover your real IP address or MAC address.',
    technicalGuarantee: 'Hardware-isolated Tor routing. Sockets are bridged through an independent Tor Gateway. Browser zero-day exploits cannot discover your real IP address or MAC address.',
    details: {
      torGatewayIp: '10.152.152.10',
      torWorkstationIp: '10.152.152.11',
      socks5Port: 9050,
      exitIp: '185.220.101.5',
      torCircuit: [
        { type: 'guard', name: 'de-fra-guard-01', country: 'Germany', flag: '🇩🇪', ip: '185.165.169.12', latencyMs: 34 },
        { type: 'middle', name: 'is-reyk-relay-09', country: 'Iceland', flag: '🇮🇸', ip: '193.187.91.44', latencyMs: 76 },
        { type: 'exit', name: 'ch-zur-exit-node', country: 'Switzerland', flag: '🇨🇭', ip: '185.220.101.5', latencyMs: 112 },
      ],
    },
  },
  {
    id: 'hardened-android',
    name: 'GrapheneOS Android Subsystem',
    baseOs: 'Hardened AOSP 15 + SELinux Enforcing',
    securityRole: 'Untrusted Android APK Execution (.apk)',
    colorBorder: 'border-amber-500 shadow-amber-500/20',
    colorHex: '#eab308',
    badgeLabel: 'GrapheneOS Android',
    networkMode: 'firewalled-bridge',
    persistence: 'sandboxed-storage',
    vCpuCores: 4,
    memoryAllocatedMb: 1024,
    status: 'running',
    runningApps: ['org.videolan.vlc', 'org.schabi.newpipe', 'apk_installer'],
    description: 'Runs existing mobile Android apps inside a containerized sandbox with hardened memory allocation, microG compatibility, and per-app network killswitches.',
    technicalGuarantee: 'Runs existing mobile Android apps inside a containerized sandbox with hardened memory allocation, microG compatibility, and per-app network killswitches.',
    details: {
      aospVersion: 'Android 15 (Hardened AOSP Vanir)',
      hardenedMallocActive: true,
      memoryTaggingMode: 'Synchronous MTE',
      microgSandboxed: true,
      perAppFirewallCount: 5,
    },
  },
  {
    id: 'disposable-alpine',
    name: 'Disposable Ephemeral MicroVM',
    baseOs: 'Alpine Linux (RAM-only musl/busybox)',
    securityRole: 'Untrusted Downloads, Suspicious Files, Unknown URLs',
    colorBorder: 'border-red-500 shadow-red-500/20',
    colorHex: '#ef4444',
    badgeLabel: 'Disposable VM (RAM Only)',
    networkMode: 'ephemeral-nat',
    persistence: 'non-persistent-ram',
    vCpuCores: 2,
    memoryAllocatedMb: 256,
    status: 'running',
    runningApps: ['terminal'],
    description: 'Non-persistent ephemeral microVM. Operates 100% in volatile RAM. When this window closes, the entire operating system and all files are permanently wiped from memory.',
    technicalGuarantee: 'Non-persistent ephemeral microVM. Operates 100% in volatile RAM. When this window closes, the entire operating system and all files are permanently wiped from memory.',
    details: {
      tmpfsMounted: true,
      volatileRamUsageMb: 86,
      persistedDiskBytes: 0,
      detonationCount: 12,
    },
  },
  {
    id: 'workstation-debian',
    name: 'Debian Workstation OS',
    baseOs: 'Debian GNU/Linux 12 (Bookworm)',
    securityRole: 'Everyday Office Work, Documents, Nextcloud Sync',
    colorBorder: 'border-emerald-500 shadow-emerald-500/20',
    colorHex: '#10b981',
    badgeLabel: 'Workstation OS',
    networkMode: 'standard-nat',
    persistence: 'persistent-ext4',
    vCpuCores: 4,
    memoryAllocatedMb: 1024,
    status: 'running',
    runningApps: ['files', 'calculator', 'clock'],
    description: 'Trusted persistent environment for office files, local development, and encrypted Nextcloud synchronization.',
    technicalGuarantee: 'Trusted persistent environment for office files, local development, and encrypted Nextcloud synchronization.',
    details: {
      luksCipher: 'AES-256-XTS (LUKS2 Container)',
      argon2idKdf: true,
      nextcloudSyncStatus: 'connected',
      nextcloudStorageQuota: '14.8 GB / 100 GB (E2EE Synced)',
      aptRepoSigning: 'Debian Archive GPG 2026 Key Verified',
    },
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

// Helper functions for simulating live domain operations

export function generateNewTorCircuit(): TorCircuitNode[] {
  const relays = [
    { name: 'no-oslo-guard-03', country: 'Norway', flag: '🇳🇴', ip: '185.220.103.8', latencyMs: 41 },
    { name: 'se-stock-middle-07', country: 'Sweden', flag: '🇸🇪', ip: '194.26.29.112', latencyMs: 65 },
    { name: 'nl-ams-privacy-exit', country: 'Netherlands', flag: '🇳🇱', ip: '185.220.101.19', latencyMs: 98 },
    { name: 'fi-hel-guard-02', country: 'Finland', flag: '🇫🇮', ip: '193.187.92.10', latencyMs: 38 },
    { name: 'ca-mtl-middle-04', country: 'Canada', flag: '🇨🇦', ip: '198.98.56.23', latencyMs: 88 },
    { name: 'ro-buch-exit-01', country: 'Romania', flag: '🇷🇴', ip: '185.220.100.245', latencyMs: 104 },
  ];
  
  const shuffled = [...relays].sort(() => 0.5 - Math.random());
  return [
    { ...shuffled[0], type: 'guard' },
    { ...shuffled[1], type: 'middle' },
    { ...shuffled[2], type: 'exit' },
  ];
}
