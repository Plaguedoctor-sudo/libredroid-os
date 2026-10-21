export interface SecurityGuardrail {
  id: string;
  name: string;
  category: 'kernel' | 'memory' | 'storage' | 'network' | 'hardware';
  status: 'active' | 'warning' | 'disabled';
  enforcementLevel: 'Strict Enforcing' | 'Hardware Enforced' | 'Sandboxed';
  description: string;
}

export interface AppPermissionRule {
  appId: string;
  appName: string;
  allowNetwork: boolean;
  allowCamera: boolean;
  allowMicrophone: boolean;
  allowSensors: boolean;
  allowStorage: boolean;
  isolatedSandbox: boolean;
}

export interface SecurityIncident {
  id: string;
  timestamp: string;
  threatType: 'SELinux Violation' | 'Seccomp Syscall Blocked' | 'Exploit Mitigation (ASLR/MTE)' | 'USB BadUSB Probed' | 'DNS Leak Blocked';
  process: string;
  details: string;
  severity: 'high' | 'critical' | 'medium';
}

export const CORE_GUARDRAILS: SecurityGuardrail[] = [
  {
    id: 'selinux',
    name: 'SELinux Mandatory Access Control',
    category: 'kernel',
    status: 'active',
    enforcementLevel: 'Strict Enforcing',
    description: 'Fine-grained process isolation. Prevents privilege escalation and isolates app domains (u:r:untrusted_app:s0).',
  },
  {
    id: 'dm_verity',
    name: 'dm-verity Cryptographic Verified Boot',
    category: 'kernel',
    status: 'active',
    enforcementLevel: 'Hardware Enforced',
    description: 'Cryptographic SHA-256 tree verification of system binaries on read. Prevents rootkits and boot-level tampering.',
  },
  {
    id: 'hardened_malloc',
    name: 'Hardened Memory Allocator & MTE/ASLR',
    category: 'memory',
    status: 'active',
    enforcementLevel: 'Strict Enforcing',
    description: 'Zero-tolerance guard pages, randomized memory layout (ASLR), and memory tagging (MTE) neutralizing buffer-overflow and use-after-free exploits.',
  },
  {
    id: 'seccomp_bpf',
    name: 'Seccomp-BPF Syscall Filtering',
    category: 'kernel',
    status: 'active',
    enforcementLevel: 'Hardware Enforced',
    description: 'Blocks hazardous Linux system calls (ptrace, kexec_load, process_vm_writev, raw sockets) from sandboxed applications.',
  },
  {
    id: 'fbe_encryption',
    name: 'File-Based Encryption (FBE) & LUKS2',
    category: 'storage',
    status: 'active',
    enforcementLevel: 'Hardware Enforced',
    description: 'AES-256-XTS cryptographic storage encryption with hardware security module (HSM/TPM) key wrapping.',
  },
  {
    id: 'usb_data_guard',
    name: 'USB Port Data Bus Isolation',
    category: 'hardware',
    status: 'active',
    enforcementLevel: 'Hardware Enforced',
    description: 'Disables USB data transfer while the screen is locked, neutralizing BadUSB attacks and forensic hardware extractors.',
  },
  {
    id: 'doh_dnssec',
    name: 'DNS-over-HTTPS (DoH) & DNSSEC',
    category: 'network',
    status: 'active',
    enforcementLevel: 'Strict Enforcing',
    description: 'Routes all system DNS queries through encrypted Quad9/Mullvad channels, preventing ISP surveillance and DNS spoofing.',
  },
  {
    id: 'sensor_spoofing',
    name: 'Sensor Sampling Rate Capping',
    category: 'hardware',
    status: 'active',
    enforcementLevel: 'Sandboxed',
    description: 'Caps accelerometer and gyroscope sampling rates to 50Hz to block acoustic keystroke eavesdropping attacks.',
  },
];

export const DEFAULT_APP_RULES: AppPermissionRule[] = [
  {
    appId: 'org.videolan.vlc',
    appName: 'VLC Media Player',
    allowNetwork: false, // GrapheneOS-style: Media player doesn't need internet!
    allowCamera: false,
    allowMicrophone: false,
    allowSensors: false,
    allowStorage: true,
    isolatedSandbox: true,
  },
  {
    appId: 'org.schabi.newpipe',
    appName: 'NewPipe Video',
    allowNetwork: true,
    allowCamera: false,
    allowMicrophone: false,
    allowSensors: false,
    allowStorage: true,
    isolatedSandbox: true,
  },
  {
    appId: 'net.osmand.plus',
    appName: 'OsmAnd Maps',
    allowNetwork: true,
    allowCamera: false,
    allowMicrophone: false,
    allowSensors: true,
    allowStorage: true,
    isolatedSandbox: true,
  },
  {
    appId: 'browser',
    appName: 'LibreBrowse',
    allowNetwork: true,
    allowCamera: false,
    allowMicrophone: false,
    allowSensors: false,
    allowStorage: true,
    isolatedSandbox: true,
  },
  {
    appId: 'calculator',
    appName: 'LibreCalc',
    allowNetwork: false,
    allowCamera: false,
    allowMicrophone: false,
    allowSensors: false,
    allowStorage: false,
    isolatedSandbox: true,
  },
];

export const INITIAL_SECURITY_INCIDENTS: SecurityIncident[] = [
  {
    id: 'sec-1',
    timestamp: 'Just now',
    threatType: 'Seccomp Syscall Blocked',
    process: 'untrusted_app (PID: 4182)',
    details: 'App attempted unauthorized ptrace() syscall on init process. Terminated immediately by Seccomp filter.',
    severity: 'critical',
  },
  {
    id: 'sec-2',
    timestamp: '15 mins ago',
    threatType: 'Exploit Mitigation (ASLR/MTE)',
    process: 'web_renderer (PID: 3910)',
    details: 'Out-of-bounds heap write attempt trapped by Hardened Malloc canary page. Process safely isolated.',
    severity: 'high',
  },
  {
    id: 'sec-3',
    timestamp: '1 hour ago',
    threatType: 'USB BadUSB Probed',
    process: 'kernel_usb_bus',
    details: 'Unauthenticated HID keyboard emulation attempt blocked while screen locked. USB data disabled.',
    severity: 'high',
  },
  {
    id: 'sec-4',
    timestamp: '3 hours ago',
    threatType: 'SELinux Violation',
    process: 'sideloaded_daemon (PID: 2840)',
    details: 'Denied read access to /data/system/users/0. Enforcing policy prevented cross-app credential extraction.',
    severity: 'critical',
  },
];
