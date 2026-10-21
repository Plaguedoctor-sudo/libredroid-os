export interface LinuxEvolutionEra {
  id: string;
  year: string;
  name: string;
  mechanism: string;
  securityImpact: string;
  status: 'enforcing' | 'hardware-backed' | 'sandboxed';
}

export interface AppContainerSandbox {
  appId: string;
  appName: string;
  containerId: string;
  namespaces: {
    pid: boolean; // Process ID isolation (app only sees its own processes)
    mnt: boolean; // Private mount namespace (read-only /usr, private /tmp, masked /sys)
    net: boolean; // Network namespace isolation
    user: boolean; // User namespace (unprivileged root mapping)
    ipc: boolean; // Inter-Process Communication isolation
    uts: boolean; // Hostname isolation
  };
  cgroupsV2: {
    memoryLimitMb: number;
    currentMemoryMb: number;
    cpuQuotaPercent: number;
    maxPids: number;
    ioWeight: number;
  };
  seccompBpf: {
    policy: 'strict-whitelist' | 'standard' | 'unrestricted';
    allowedSyscallsCount: number;
    blockedSyscalls: string[];
  };
  landlockLsm: {
    active: boolean;
    readPaths: string[];
    writePaths: string[];
    blockedPaths: string[];
  };
  xdgPortals: {
    fileChooserMediated: boolean;
    cameraMediated: boolean;
    locationMediated: boolean;
    clipboardMediated: boolean;
  };
  waylandIsolation: {
    isolatedSurfaceBuffers: boolean;
    keyloggerImmunity: boolean;
  };
}

export interface XdgPortalRequest {
  id: string;
  timestamp: string;
  app: string;
  portal: 'FileChooser' | 'Camera' | 'Location' | 'ScreenCast' | 'Notification';
  requestedAction: string;
  status: 'prompting' | 'granted' | 'denied';
}

export const LINUX_EVOLUTION_TIMELINE: LinuxEvolutionEra[] = [
  {
    id: 'dac',
    year: '1991',
    name: 'Discretionary Access Control (DAC)',
    mechanism: 'Traditional Unix UID, GID, and rwx file permission bits.',
    securityImpact: 'Basic multi-user security. Defeated if an app runs as root or shares a UID.',
    status: 'enforcing',
  },
  {
    id: 'posix_caps',
    year: '1999',
    name: 'POSIX Linux Capabilities (cap_set_proc)',
    mechanism: 'Splits superuser privileges into 40 distinct flags (e.g. CAP_NET_ADMIN, CAP_SYS_ADMIN).',
    securityImpact: 'Sandboxed apps drop all capabilities, stripping root execution potential.',
    status: 'enforcing',
  },
  {
    id: 'lsm_mac',
    year: '2001-2003',
    name: 'LSM: SELinux & AppArmor',
    mechanism: 'Kernel-level Mandatory Access Control. Decouples permissions from user IDs.',
    securityImpact: 'Enforces type transitions. Confines untrusted apps even if they attempt privilege escalation.',
    status: 'enforcing',
  },
  {
    id: 'namespaces',
    year: '2002-2013',
    name: 'Linux Kernel Namespaces',
    mechanism: 'PID, MNT, NET, IPC, UTS, and USER namespaces virtualize system resources per-process.',
    securityImpact: 'The foundation of containers. Apps cannot see or interact with foreign processes or mounts.',
    status: 'enforcing',
  },
  {
    id: 'cgroups_v2',
    year: '2008 & 2016',
    name: 'Control Groups v2 (cgroups)',
    mechanism: 'Unified hierarchical resource controller for Memory, CPU, I/O, and PIDs.',
    securityImpact: 'Prevents resource starvation DOS, fork-bombs, and memory exhaustion attacks.',
    status: 'enforcing',
  },
  {
    id: 'seccomp_bpf',
    year: '2012',
    name: 'Seccomp-BPF Syscall Filtering',
    mechanism: 'Kernel BPF program inspection of system call numbers and register arguments.',
    securityImpact: 'Reduces the Linux kernel attack surface by blocking ~380 unused or dangerous syscalls.',
    status: 'enforcing',
  },
  {
    id: 'bwrap_portals',
    year: '2016',
    name: 'Bubblewrap & XDG Desktop Portals',
    mechanism: 'Unprivileged user-namespace sandboxing paired with D-Bus capability-based portals.',
    securityImpact: 'Apps have zero direct file or hardware access. Only user-selected files are opened.',
    status: 'enforcing',
  },
  {
    id: 'landlock_wayland',
    year: '2021-Present',
    name: 'Landlock LSM & Wayland Surface Isolation',
    mechanism: 'Unprivileged in-process filesystem rules & compositor-isolated window buffers.',
    securityImpact: 'Immunity to cross-window keylogging and unprivileged filesystem traversal.',
    status: 'hardware-backed',
  },
];

export const DEFAULT_APP_CONTAINERS: AppContainerSandbox[] = [
  {
    appId: 'org.videolan.vlc',
    appName: 'VLC Media Player',
    containerId: 'bwrap-vlc-0841',
    namespaces: {
      pid: true,
      mnt: true,
      net: false, // Network isolated (offline player)
      user: true,
      ipc: true,
      uts: true,
    },
    cgroupsV2: {
      memoryLimitMb: 512,
      currentMemoryMb: 68,
      cpuQuotaPercent: 40,
      maxPids: 16,
      ioWeight: 100,
    },
    seccompBpf: {
      policy: 'strict-whitelist',
      allowedSyscallsCount: 54,
      blockedSyscalls: ['ptrace', 'kexec_load', 'sys_chroot', 'reboot', 'setuid'],
    },
    landlockLsm: {
      active: true,
      readPaths: ['/app/vlc/runtime', '/usr/share/fonts'],
      writePaths: ['/tmp/vlc-sandbox'],
      blockedPaths: ['/home/user', '/etc/shadow', '/proc/kcore'],
    },
    xdgPortals: {
      fileChooserMediated: true,
      cameraMediated: false,
      locationMediated: false,
      clipboardMediated: true,
    },
    waylandIsolation: {
      isolatedSurfaceBuffers: true,
      keyloggerImmunity: true,
    },
  },
  {
    appId: 'browser',
    appName: 'LibreBrowse',
    containerId: 'bwrap-browser-1920',
    namespaces: {
      pid: true,
      mnt: true,
      net: true,
      user: true,
      ipc: true,
      uts: true,
    },
    cgroupsV2: {
      memoryLimitMb: 1024,
      currentMemoryMb: 184,
      cpuQuotaPercent: 60,
      maxPids: 32,
      ioWeight: 100,
    },
    seccompBpf: {
      policy: 'strict-whitelist',
      allowedSyscallsCount: 68,
      blockedSyscalls: ['ptrace', 'kexec_load', 'process_vm_writev', 'sys_raw'],
    },
    landlockLsm: {
      active: true,
      readPaths: ['/app/browser/bin', '/usr/share'],
      writePaths: ['/app/browser/cache'],
      blockedPaths: ['/home/user/keys', '/etc', '/sys'],
    },
    xdgPortals: {
      fileChooserMediated: true,
      cameraMediated: true,
      locationMediated: true,
      clipboardMediated: true,
    },
    waylandIsolation: {
      isolatedSurfaceBuffers: true,
      keyloggerImmunity: true,
    },
  },
  {
    appId: 'org.schabi.newpipe',
    appName: 'NewPipe Video',
    containerId: 'bwrap-newpipe-2411',
    namespaces: {
      pid: true,
      mnt: true,
      net: true,
      user: true,
      ipc: true,
      uts: true,
    },
    cgroupsV2: {
      memoryLimitMb: 512,
      currentMemoryMb: 92,
      cpuQuotaPercent: 50,
      maxPids: 20,
      ioWeight: 100,
    },
    seccompBpf: {
      policy: 'strict-whitelist',
      allowedSyscallsCount: 58,
      blockedSyscalls: ['ptrace', 'setgid', 'sys_mount'],
    },
    landlockLsm: {
      active: true,
      readPaths: ['/app/newpipe/runtime'],
      writePaths: ['/tmp/newpipe-media'],
      blockedPaths: ['/home/user/documents', '/proc/version'],
    },
    xdgPortals: {
      fileChooserMediated: true,
      cameraMediated: false,
      locationMediated: false,
      clipboardMediated: false,
    },
    waylandIsolation: {
      isolatedSurfaceBuffers: true,
      keyloggerImmunity: true,
    },
  },
];

export const INITIAL_XDG_PORTAL_REQUESTS: XdgPortalRequest[] = [
  {
    id: 'req-1',
    timestamp: 'Just now',
    app: 'LibreBrowse',
    portal: 'FileChooser',
    requestedAction: 'User explicitly selected "wallpaper.jpg" via FileChooser Portal.',
    status: 'granted',
  },
  {
    id: 'req-2',
    timestamp: '12 mins ago',
    app: 'VLC Media Player',
    portal: 'FileChooser',
    requestedAction: 'Provided isolated file descriptor for "video.mkv". Full folder access was withheld.',
    status: 'granted',
  },
  {
    id: 'req-3',
    timestamp: '45 mins ago',
    app: 'Sideloaded Game APK',
    portal: 'Camera',
    requestedAction: 'App requested background video access without user trigger. Automatically rejected by Portal.',
    status: 'denied',
  },
];
