/**
 * LibreDroid Unified Hardened OS Security Engine
 * Bridges Apple Hardened OS (Lockdown Mode, Hardened Runtime, BlastDoor, Gatekeeper, SEP, SSV)
 * with Linux Kernel Hardening (SELinux Enforcing, KSPP sysctl, Landlock LSM, Seccomp-BPF, Hardened Malloc).
 */

export interface AppleHardenedStack {
  lockdownMode: boolean;
  hardenedRuntime: boolean;
  blastDoorSandboxing: boolean;
  gatekeeperNotarization: boolean;
  pointerAuthentication: boolean; // ARM64 PAC
  wxMemoryProtection: boolean; // Write XOR Execute
  secureEnclaveProcessor: boolean; // SEP Key Isolation
  signedSystemVolume: boolean; // APFS SSV Sealed Snapshot
  usbRestrictedMode: boolean; // Shuts off Lightning/USB data when locked
  jitCompilationDisabled: boolean; // Eliminates WebKit JIT heap spray
}

export interface LinuxHardenedStack {
  selinuxMode: 'enforcing' | 'permissive' | 'disabled';
  ksppSysctlLocked: boolean;
  landlockLsm: boolean;
  seccompBpfWhitelist: boolean;
  hardenedMalloc: boolean;
  memoryTaggingExtension: boolean; // ARMv8.5+ MTE
  bubblewrapNamespaces: boolean;
  dmVerityVerifiedBoot: boolean;
  ebpfAnomalyDetection: boolean;
  sysctlParameters: Record<string, { value: string; hardenedDefault: string; description: string; isHardened: boolean }>;
}

export interface PenetrationTestVector {
  id: string;
  name: string;
  category: 'apple_layer' | 'linux_layer' | 'hybrid_layer';
  cveReference?: string;
  targetSubsystem: string;
  attackVector: string;
  mitigationMechanism: string;
  appleDefense: string;
  linuxDefense: string;
}

export interface SecurityAuditIncident {
  id: string;
  timestamp: string;
  attackId: string;
  attackName: string;
  severity: 'critical' | 'high' | 'medium';
  interceptedBy: 'Apple BlastDoor' | 'Apple Lockdown Mode' | 'Apple PAC / W^X' | 'Linux SELinux' | 'Linux Seccomp-BPF' | 'Linux Landlock LSM' | 'Linux Hardened Malloc';
  processName: string;
  status: 'intercepted_and_neutralized' | 'isolated_in_sandbox';
  forensicSummary: string;
}

export const HARDENED_SYSCTL_SETTINGS: Record<string, { value: string; hardenedDefault: string; description: string; isHardened: boolean }> = {
  'kernel.kptr_restrict': {
    value: '2',
    hardenedDefault: '2',
    description: 'Hides all kernel memory pointers from /proc/kallsyms, blocking kernel ASLR bypasses.',
    isHardened: true,
  },
  'kernel.dmesg_restrict': {
    value: '1',
    hardenedDefault: '1',
    description: 'Restricts dmesg kernel ring buffer to root, stopping unprivileged exploit reconnaissance.',
    isHardened: true,
  },
  'kernel.yama.ptrace_scope': {
    value: '3',
    hardenedDefault: '3',
    description: 'Completely disables ptrace debugging. No process can inspect or inject into memory.',
    isHardened: true,
  },
  'kernel.unprivileged_bpf_disabled': {
    value: '2',
    hardenedDefault: '2',
    description: 'Permanently locks out unprivileged eBPF program loading to neutralize speculative execution bugs.',
    isHardened: true,
  },
  'vm.mmap_min_addr': {
    value: '65536',
    hardenedDefault: '65536',
    description: 'Enforces minimum virtual memory address for mmap, neutralizing NULL pointer dereference exploits.',
    isHardened: true,
  },
  'fs.protected_hardlinks': {
    value: '1',
    hardenedDefault: '1',
    description: 'Prevents hardlink creation to files the user does not own, thwarting race-condition attacks.',
    isHardened: true,
  },
  'fs.protected_symlinks': {
    value: '1',
    hardenedDefault: '1',
    description: 'Forbids following symlinks in world-writable sticky directories (like /tmp).',
    isHardened: true,
  },
  'net.ipv4.conf.all.rp_filter': {
    value: '1',
    hardenedDefault: '1',
    description: 'Enforces strict reverse-path filtering to drop spoofed IP packets at the socket level.',
    isHardened: true,
  },
  'net.ipv4.tcp_syncookies': {
    value: '1',
    hardenedDefault: '1',
    description: 'Issues cryptographic SYN cookies under heavy network loads, defeating TCP SYN flood DoS attacks.',
    isHardened: true,
  },
};

export const PENETRATION_TEST_VECTORS: PenetrationTestVector[] = [
  {
    id: 'pegasus_zero_click',
    name: 'Pegasus N-Day Zero-Click iMessage / PDF Exploit',
    category: 'apple_layer',
    cveReference: 'FORCEDENTRY (CVE-2021-30860)',
    targetSubsystem: 'CoreGraphics / ImageIO / Mach IPC',
    attackVector: 'Crafted JBIG2 stream embedded in message attachment to trigger integer overflow and arbitrary code execution with zero user interaction.',
    mitigationMechanism: 'BlastDoor Sandboxed Decoder + Apple Lockdown Mode',
    appleDefense: 'Incoming payload redirected to untrusted Mach sandbox with no filesystem, network, or camera access. Attachment parsing terminated safely.',
    linuxDefense: 'Linux Landlock LSM blocks file creation; Seccomp-BPF drops mach_vm_allocate syscall.',
  },
  {
    id: 'webkit_jit_spray',
    name: 'WebKit JIT Heap Spray & Memory Corruption',
    category: 'apple_layer',
    cveReference: 'CVE-2023-28204 / CVE-2024-23222',
    targetSubsystem: 'JavaScriptCore JIT Engine & WebKit',
    attackVector: 'Malicious website invokes type confusion in JavaScript JIT compiler to spray executable memory and bypass W^X flags.',
    mitigationMechanism: 'Apple Lockdown Mode JIT Stripping + W^X Strict Page Tables',
    appleDefense: 'JIT compilation is completely disabled under Lockdown Mode. Dynamic executable memory allocation immediately triggers SIGKILL.',
    linuxDefense: 'Hardened Malloc zero-tolerance guard pages detect out-of-bounds heap spray; MTE tag mismatch traps process.',
  },
  {
    id: 'dirty_pipe_privesc',
    name: 'Dirty Pipe Kernel Privilege Escalation',
    category: 'linux_layer',
    cveReference: 'CVE-2022-0847',
    targetSubsystem: 'Linux Kernel Pipe Buffer / Page Cache',
    attackVector: 'Unprivileged process injects arbitrary data into read-only page cache files (like /etc/passwd or root binaries) via spliced pipe buffer.',
    mitigationMechanism: 'Linux SELinux Enforcing + Landlock LSM + dm-verity',
    appleDefense: 'APFS Signed System Volume (SSV) validates SHA-256 Merkle root on every page read; tampered blocks rejected instantly.',
    linuxDefense: 'SELinux strict rule untrusted_app:s0 denies write access to root inodes; dm-verity triggers immediate kernel panic on corrupt block.',
  },
  {
    id: 'ptrace_keylogger',
    name: 'ptrace() Process Memory Sniffing & Injection',
    category: 'linux_layer',
    cveReference: 'Linux Yama Violation',
    targetSubsystem: 'POSIX Process Subsystem / Yama LSM',
    attackVector: 'Sideloaded spy daemon executes ptrace(PTRACE_ATTACH) on keyboard input process or browser to dump decrypted master passwords.',
    mitigationMechanism: 'Yama ptrace_scope=3 + Seccomp-BPF Whitelist',
    appleDefense: 'Hardened Runtime entitlement `get-task-allow: false` prevents any foreign task from querying the Mach task port.',
    linuxDefense: 'Linux kernel yama.ptrace_scope=3 unconditionally returns -EPERM. Seccomp-BPF drops process_vm_readv.',
  },
  {
    id: 'badusb_dma_extractor',
    name: 'BadUSB Hardware Keylogger & DMA Extractor',
    category: 'hybrid_layer',
    cveReference: 'Forensic Hardware Box Exploit',
    targetSubsystem: 'USB-C Controller & DMA Bus',
    attackVector: 'Physical malicious USB cable or forensic box connected to device port while locked, emulating HID keystrokes and attempting DMA memory extraction.',
    mitigationMechanism: 'Apple USB Restricted Mode + Hardware Data Bus Lock',
    appleDefense: 'Lightning/USB-C controller physically disengages data pins 60 seconds after screen lock. Only charging is allowed.',
    linuxDefense: 'USB Port Data Bus isolation blocks USB enumeration until cryptographic biometric user authentication.',
  },
  {
    id: 'rop_buffer_overflow',
    name: 'Return-Oriented Programming (ROP) Gadget Chain',
    category: 'hybrid_layer',
    cveReference: 'Heap/Stack Overflow Hijack',
    targetSubsystem: 'C/C++ Native Runtime & Call Stack',
    attackVector: 'Corrupts function return address on stack to pivot execution flow through legitimate code snippets (ROP gadgets) to bypass non-executable stack.',
    mitigationMechanism: 'Apple PAC (Pointer Authentication) + Linux Hardened Malloc',
    appleDefense: 'ARM64 PAC signs every return address with cryptographic PACIBEG instruction. Mismatched pointer hash triggers instant PAC exception.',
    linuxDefense: 'Hardened Malloc inserts non-executable guard pages between all slab chunks and zero-fills on free, destroying gadget chains.',
  },
];

export const INITIAL_AUDIT_LOGS: SecurityAuditIncident[] = [
  {
    id: 'audit-001',
    timestamp: '2 mins ago',
    attackId: 'pegasus_zero_click',
    attackName: 'Pegasus N-Day Zero-Click iMessage / PDF Exploit',
    severity: 'critical',
    interceptedBy: 'Apple BlastDoor',
    processName: 'blastdoor_decoder (PID: 9021)',
    status: 'isolated_in_sandbox',
    forensicSummary: 'Malformed JBIG2 stream trapped in zero-privilege Mach sandbox. Process memory quarantined before reaching UI framework.',
  },
  {
    id: 'audit-002',
    timestamp: '18 mins ago',
    attackId: 'ptrace_keylogger',
    attackName: 'ptrace() Process Memory Sniffing & Injection',
    severity: 'high',
    interceptedBy: 'Linux Seccomp-BPF',
    processName: 'sideloaded_spyware (PID: 7412)',
    status: 'intercepted_and_neutralized',
    forensicSummary: 'Attempted ptrace(PTRACE_ATTACH) rejected by Yama ptrace_scope=3. Seccomp-BPF terminated offending thread with SIGSYS.',
  },
  {
    id: 'audit-003',
    timestamp: '1 hour ago',
    attackId: 'webkit_jit_spray',
    attackName: 'WebKit JIT Heap Spray & Memory Corruption',
    severity: 'critical',
    interceptedBy: 'Apple Lockdown Mode',
    processName: 'web_render_worker (PID: 6108)',
    status: 'intercepted_and_neutralized',
    forensicSummary: 'Lockdown Mode JIT disablement enforced. Attempt to mark memory as PROT_EXEC rejected by W^X policy.',
  },
  {
    id: 'audit-004',
    timestamp: '3 hours ago',
    attackId: 'dirty_pipe_privesc',
    attackName: 'Dirty Pipe Kernel Privilege Escalation',
    severity: 'critical',
    interceptedBy: 'Linux SELinux',
    processName: 'pipe_spliter (PID: 5312)',
    status: 'intercepted_and_neutralized',
    forensicSummary: 'SELinux MCS domain isolated_app:s0:c200 denied write to read-only page cache. dm-verity root tree confirmed pristine.',
  },
];

const STORAGE_KEY = 'libredroid_hardened_security_state_v1';

export class HardenedSecurityEngine {
  private static instance: HardenedSecurityEngine;

  private appleStack: AppleHardenedStack = {
    lockdownMode: true,
    hardenedRuntime: true,
    blastDoorSandboxing: true,
    gatekeeperNotarization: true,
    pointerAuthentication: true,
    wxMemoryProtection: true,
    secureEnclaveProcessor: true,
    signedSystemVolume: true,
    usbRestrictedMode: true,
    jitCompilationDisabled: true,
  };

  private linuxStack: LinuxHardenedStack = {
    selinuxMode: 'enforcing',
    ksppSysctlLocked: true,
    landlockLsm: true,
    seccompBpfWhitelist: true,
    hardenedMalloc: true,
    memoryTaggingExtension: true,
    bubblewrapNamespaces: true,
    dmVerityVerifiedBoot: true,
    ebpfAnomalyDetection: true,
    sysctlParameters: { ...HARDENED_SYSCTL_SETTINGS },
  };

  private auditLogs: SecurityAuditIncident[] = [...INITIAL_AUDIT_LOGS];

  private constructor() {
    this.loadState();
  }

  public static getInstance(): HardenedSecurityEngine {
    if (!HardenedSecurityEngine.instance) {
      HardenedSecurityEngine.instance = new HardenedSecurityEngine();
    }
    return HardenedSecurityEngine.instance;
  }

  public getAppleStack(): AppleHardenedStack {
    return { ...this.appleStack };
  }

  public getLinuxStack(): LinuxHardenedStack {
    return { 
      ...this.linuxStack,
      sysctlParameters: { ...this.linuxStack.sysctlParameters }
    };
  }

  public getAuditLogs(): SecurityAuditIncident[] {
    return [...this.auditLogs];
  }

  public toggleAppleLockdownMode(): boolean {
    const newVal = !this.appleStack.lockdownMode;
    this.appleStack.lockdownMode = newVal;
    this.appleStack.jitCompilationDisabled = newVal;
    this.appleStack.usbRestrictedMode = newVal;
    this.saveState();
    return newVal;
  }

  public updateAppleFeature(feature: keyof AppleHardenedStack, val: boolean): void {
    this.appleStack[feature] = val as any;
    this.saveState();
  }

  public setSelinuxMode(mode: 'enforcing' | 'permissive' | 'disabled'): void {
    this.linuxStack.selinuxMode = mode;
    this.saveState();
  }

  public updateLinuxFeature(feature: keyof Omit<LinuxHardenedStack, 'sysctlParameters' | 'selinuxMode'>, val: boolean): void {
    this.linuxStack[feature] = val as any;
    this.saveState();
  }

  public toggleSysctlParameter(key: string): boolean {
    if (this.linuxStack.sysctlParameters[key]) {
      const current = this.linuxStack.sysctlParameters[key];
      const nextIsHardened = !current.isHardened;
      current.isHardened = nextIsHardened;
      current.value = nextIsHardened ? current.hardenedDefault : '0';
      this.saveState();
      return nextIsHardened;
    }
    return false;
  }

  public executePenetrationTest(attackId: string): SecurityAuditIncident {
    const vector = PENETRATION_TEST_VECTORS.find(v => v.id === attackId) || PENETRATION_TEST_VECTORS[0];
    
    // Determine interceptor based on vector
    let interceptor: SecurityAuditIncident['interceptedBy'] = 'Apple BlastDoor';
    if (vector.id === 'pegasus_zero_click') interceptor = 'Apple BlastDoor';
    else if (vector.id === 'webkit_jit_spray') interceptor = 'Apple Lockdown Mode';
    else if (vector.id === 'dirty_pipe_privesc') interceptor = 'Linux SELinux';
    else if (vector.id === 'ptrace_keylogger') interceptor = 'Linux Seccomp-BPF';
    else if (vector.id === 'badusb_dma_extractor') interceptor = 'Apple Lockdown Mode';
    else if (vector.id === 'rop_buffer_overflow') interceptor = 'Apple PAC / W^X';

    const incident: SecurityAuditIncident = {
      id: `incident-${Date.now().toString(36)}`,
      timestamp: 'Just now',
      attackId: vector.id,
      attackName: vector.name,
      severity: 'critical',
      interceptedBy: interceptor,
      processName: `simulated_${vector.id} (PID: ${Math.floor(1000 + Math.random() * 8000)})`,
      status: vector.id === 'pegasus_zero_click' ? 'isolated_in_sandbox' : 'intercepted_and_neutralized',
      forensicSummary: `Attack attempt simulated live. ${interceptor} identified anomalous payload: "${vector.attackVector.slice(0, 70)}...". Neutralized via ${vector.mitigationMechanism}.`,
    };

    this.auditLogs.unshift(incident);
    if (this.auditLogs.length > 50) this.auditLogs.pop();
    this.saveState();
    return incident;
  }

  public clearAuditLogs(): void {
    this.auditLogs = [];
    this.saveState();
  }

  private saveState(): void {
    if (typeof window !== 'undefined') {
      try {
        const payload = {
          appleStack: this.appleStack,
          linuxStack: this.linuxStack,
          auditLogs: this.auditLogs,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {
        console.warn('Failed to save hardened security state:', err);
      }
    }
  }

  private loadState(): void {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.appleStack) this.appleStack = { ...this.appleStack, ...parsed.appleStack };
          if (parsed.linuxStack) this.linuxStack = { ...this.linuxStack, ...parsed.linuxStack };
          if (parsed.auditLogs && Array.isArray(parsed.auditLogs)) this.auditLogs = parsed.auditLogs;
        }
      } catch (err) {
        console.warn('Failed to parse hardened security state:', err);
      }
    }
  }
}
