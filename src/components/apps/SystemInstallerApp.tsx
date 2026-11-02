import React, { useState } from 'react';
import { 
  HardDrive, 
  Cpu, 
  CheckCircle, 
  Download, 
  Terminal, 
  ShieldAlert, 
  Layers, 
  Disc,
  Play,
  Check,
  Smartphone,
  Server,
  Laptop,
  Copy,
  ExternalLink,
  RefreshCw,
  Sliders,
  Info
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

export type TargetDeviceType = 'pc' | 'android' | 'sbc' | 'vm';

export const SystemInstallerApp: React.FC = () => {
  const { addNotification } = useSystem();
  const [deviceType, setDeviceType] = useState<TargetDeviceType>('pc');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDisk, setSelectedDisk] = useState('/dev/nvme0n1');
  const [installMode, setInstallMode] = useState<'clean' | 'dualboot' | 'kiosk' | 'gsi' | 'sdcard' | 'qcow2'>('clean');
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashProgress, setFlashProgress] = useState(0);
  const [flashLogs, setFlashLogs] = useState<string[]>([]);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const pcDisks = [
    { id: '/dev/nvme0n1', name: 'NVMe Solid State Drive (Samsung 980 Pro)', size: '512 GB', type: 'Internal PCIe NVMe SSD' },
    { id: '/dev/sda', name: 'SATA Drive (Crucial MX500)', size: '1000 GB', type: 'Internal SATA SSD' },
    { id: '/dev/sdb', name: 'USB Flash Live Installer (SanDisk Extreme)', size: '64 GB', type: 'Removable USB 3.2 Drive' },
  ];

  const androidTargets = [
    { 
      id: 'gsi-baremetal', 
      name: 'Project Treble ARM64 GSI (Preserves Vendor HAL & Kernel)', 
      desc: 'Flashes LibreDroid onto /system while keeping your phone\'s Snapdragon/MediaTek kernel (/boot) and Vendor HAL (/vendor for Camera, VoLTE, Display) 100% intact.',
      shielded: true
    },
    { 
      id: 'kiosk-standalone', 
      name: 'Zero-Risk Standalone Kiosk (Safe Suppressed Stock)', 
      desc: 'Replaces stock OEM launcher with LibreDroid OS without partition wipe. Restorable anytime.',
      shielded: false
    },
    { 
      id: 'termux-chroot', 
      name: 'Containerized Linux + Wayland chroot', 
      desc: 'Runs full desktop environment and Waydroid within unrooted Termux environment.',
      shielded: false
    },
  ];

  const copyToClipboard = (cmd: string) => {
    navigator.clipboard?.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const getLogSteps = () => {
    switch (deviceType) {
      case 'android':
        return [
          '[1/5] Probing ADB and fastboot device connection over USB...',
          '[2/5] Inspecting OEM partition schema and Treble GSI compatibility...',
          '[3/5] Applying Hardened SELinux policies and de-googling system packages...',
          '[4/5] Deploying LibreDroid Standalone Launcher & microG IPC bridge...',
          '[5/5] Android device provisioning complete! LibreDroid active.',
        ];
      case 'sbc':
        return [
          '[1/5] Initializing target SD Card / eMMC sector geometry...',
          '[2/5] Writing U-Boot bootloader with DeviceTree overlays for Mali/Panfrost GPU...',
          '[3/5] Flashing Alpine Linux aarch64 base kernel with ashmem & binder drivers...',
          '[4/5] Pre-caching Waydroid container images and microG FOSS services...',
          '[5/5] Flash verification complete! Insert SD card into SBC and power on.',
        ];
      case 'vm':
        return [
          '[1/5] Generating cloud-init metadata and QEMU virtio configuration...',
          '[2/5] Creating 64GB sparse QCOW2 virtual drive with ext4 filesystem...',
          '[3/5] Mounting squashfs rootfs and configuring virgl 3D hardware acceleration...',
          '[4/5] Injecting network tap device and port forwards (3001, 5555, 22)...',
          '[5/5] VM image deployed! Ready to launch via QEMU / Proxmox / VirtualBox.',
        ];
      case 'pc':
      default:
        return [
          '[1/6] Scanning partition tables and checking UEFI boot entries...',
          `[2/6] Partitioning ${selectedDisk} (ESP: 512MB, ROOTFS: Ext4, WAYDROID: 64GB)...`,
          '[3/6] Deploying Linux 6.6 LTS Kernel with Ashmem & Binder IPC modules...',
          '[4/6] Installing Waydroid containerized AOSP runtime with microG core...',
          '[5/6] Writing GRUB2 EFI bootloader with touch navigation support...',
          '[6/6] Installation completed! LibreDroid OS is ready to boot.',
        ];
    }
  };

  const startInstallation = () => {
    setIsFlashing(true);
    setFlashProgress(5);
    const steps = getLogSteps();
    setFlashLogs([steps[0]]);

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < steps.length) {
        setFlashProgress(Math.round(((current + 1) / steps.length) * 100));
        setFlashLogs((prev) => [...prev, steps[current]]);
      } else {
        clearInterval(interval);
        setIsFlashing(false);
        setStep(4);
        addNotification({
          appId: 'system_installer',
          appName: 'OS Installer',
          title: 'Installation Complete',
          body: `LibreDroid successfully installed for target: ${deviceType.toUpperCase()}.`,
        });
      }
    }, 900);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 text-purple-300 rounded-xl">
            <HardDrive size={18} />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              LibreDroid Universal Hardware Installer
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                Multi-Platform
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Install as primary OS or dual-boot on PC, Android, Raspberry Pi, or VM
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                step === s
                  ? 'bg-purple-600 text-white shadow-md'
                  : step > s
                  ? 'bg-purple-950 text-purple-300 border border-purple-600/50'
                  : 'bg-neutral-800 text-neutral-500'
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Device Type Selector Tabs */}
      <div className="px-4 py-2 bg-neutral-950/70 border-b border-neutral-800/80 flex items-center justify-center gap-2 shrink-0 overflow-x-auto">
        <button
          onClick={() => { setDeviceType('pc'); setStep(1); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            deviceType === 'pc' ? 'bg-purple-600 text-white shadow' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          <Laptop size={14} />
          <span>PC / Laptop (x86_64)</span>
        </button>

        <button
          onClick={() => { setDeviceType('android'); setStep(1); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            deviceType === 'android' ? 'bg-purple-600 text-white shadow' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          <Smartphone size={14} />
          <span>Android Tablet / Phone</span>
        </button>

        <button
          onClick={() => { setDeviceType('sbc'); setStep(1); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            deviceType === 'sbc' ? 'bg-purple-600 text-white shadow' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          <Cpu size={14} />
          <span>Raspberry Pi & SBCs</span>
        </button>

        <button
          onClick={() => { setDeviceType('vm'); setStep(1); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            deviceType === 'vm' ? 'bg-purple-600 text-white shadow' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          <Server size={14} />
          <span>Virtual Machine (VM)</span>
        </button>
      </div>

      {/* Main Step Container */}
      <div className="flex-1 p-6 overflow-y-auto max-w-2xl mx-auto w-full flex flex-col justify-center">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">
                {deviceType === 'pc' && 'Select Target Disk for Bare-Metal PC'}
                {deviceType === 'android' && 'Select Android Deployment Strategy'}
                {deviceType === 'sbc' && 'Target MicroSD or NVMe Storage for SBC'}
                {deviceType === 'vm' && 'Select Virtual Machine Hypervisor'}
              </h2>
              <p className="text-xs text-neutral-400">
                {deviceType === 'pc' && 'Choose where LibreDroid OS with Waydroid AOSP container will be installed.'}
                {deviceType === 'android' && 'Choose between non-destructive standalone kiosk or bare-metal AOSP flashing.'}
                {deviceType === 'sbc' && 'Flash directly to Raspberry Pi 4/5, Orange Pi, or Radxa micro-SD / eMMC.'}
                {deviceType === 'vm' && 'Generate a live bootable VM disk image with virtio 3D graphics acceleration.'}
              </p>
            </div>

            {/* PC Disks */}
            {deviceType === 'pc' && (
              <div className="space-y-2 mt-4">
                {pcDisks.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDisk(d.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedDisk === d.id
                        ? 'bg-purple-900/30 border-purple-500 ring-1 ring-purple-500'
                        : 'bg-neutral-800/40 border-neutral-700/80 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <HardDrive size={20} className={selectedDisk === d.id ? 'text-purple-400' : 'text-neutral-400'} />
                      <div>
                        <div className="text-sm font-semibold text-white">{d.name}</div>
                        <div className="text-xs text-neutral-400 font-mono">{d.id} • {d.type}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold bg-neutral-800 px-2.5 py-1 rounded-lg">
                      {d.size}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Android Options */}
            {deviceType === 'android' && (
              <div className="space-y-3 mt-4">
                {androidTargets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedDisk(t.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      selectedDisk === t.id
                        ? 'bg-purple-900/30 border-purple-500 ring-1 ring-purple-500'
                        : 'bg-neutral-800/40 border-neutral-700/80 hover:bg-neutral-800'
                    }`}
                  >
                    <Smartphone size={20} className={selectedDisk === t.id ? 'text-purple-400 shrink-0 mt-0.5' : 'text-neutral-400 shrink-0 mt-0.5'} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{t.name}</span>
                        {t.shielded && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            HAL Shield Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1 leading-relaxed">{t.desc}</div>
                    </div>
                  </div>
                ))}

                {/* Hardware Partition Protection Visual */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle size={15} className="text-emerald-400" />
                    <span>Android Hardware Partition Isolation:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      <div className="font-bold">/vendor & /odm</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Camera, VoLTE, Display HAL</div>
                      <div className="text-[9px] font-bold mt-1 text-emerald-400">✔ 100% PRESERVED</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      <div className="font-bold">/boot & kernel</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Snapdragon / MediaTek</div>
                      <div className="text-[9px] font-bold mt-1 text-emerald-400">✔ 100% PRESERVED</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300">
                      <div className="font-bold">/system</div>
                      <div className="text-[10px] opacity-80 mt-0.5">LibreDroid OS Framework</div>
                      <div className="text-[9px] font-bold mt-1 text-purple-400">⚡ REPLACED (Sovereign)</div>
                    </div>
                  </div>
                </div>

                {/* Terminal 1-Click Flash Command */}
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <div className="text-neutral-400 text-[10px]">Direct USB Fastboot Command:</div>
                    <code className="text-purple-300 font-mono text-[11px]">./installer/flash-treble-device.sh</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard('./installer/flash-treble-device.sh')}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-xs flex items-center gap-1 transition-colors"
                  >
                    <Copy size={12} />
                    <span>{copiedCmd === './installer/flash-treble-device.sh' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* SBC Options */}
            {deviceType === 'sbc' && (
              <div className="space-y-2 mt-4">
                <div
                  onClick={() => setSelectedDisk('/dev/mmcblk0')}
                  className="p-3.5 rounded-2xl border bg-purple-900/30 border-purple-500 ring-1 ring-purple-500 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Cpu size={20} className="text-purple-400" />
                    <div>
                      <div className="text-sm font-semibold text-white">MicroSD / eMMC Storage (/dev/mmcblk0)</div>
                      <div className="text-xs text-neutral-400 font-mono">Broadcom BCM2712 / Rockchip RK3588 • 32 GB+</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold bg-neutral-800 px-2.5 py-1 rounded-lg">Target Ready</span>
                </div>
              </div>
            )}

            {/* VM Options */}
            {deviceType === 'vm' && (
              <div className="space-y-2 mt-4">
                <div
                  onClick={() => setSelectedDisk('qemu-kvm')}
                  className="p-3.5 rounded-2xl border bg-purple-900/30 border-purple-500 ring-1 ring-purple-500 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Server size={20} className="text-purple-400" />
                    <div>
                      <div className="text-sm font-semibold text-white">QEMU / KVM / Proxmox VE (x86_64 or ARM64)</div>
                      <div className="text-xs text-neutral-400 font-mono">VirtIO-SCSI • VirGL 3D • 64GB Dynamic Image</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold bg-neutral-800 px-2.5 py-1 rounded-lg">QCOW2 / ISO</span>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors"
              >
                Continue to Configuration →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">Partition & Deployment Mode</h2>
              <p className="text-xs text-neutral-400">
                Choose installation type and coexistence parameters.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div
                onClick={() => setInstallMode('clean')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  installMode === 'clean'
                    ? 'bg-purple-900/30 border-purple-500 ring-1 ring-purple-500'
                    : 'bg-neutral-800/40 border-neutral-700 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Disc size={20} className="text-purple-400" />
                  {installMode === 'clean' && <Check size={16} className="text-purple-400" />}
                </div>
                <div className="text-sm font-bold text-white">Primary Independent OS</div>
                <div className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Dedicates the storage drive to LibreDroid for optimum speed, full disk encryption, and isolated kernel sandboxing.
                </div>
              </div>

              <div
                onClick={() => setInstallMode('dualboot')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  installMode === 'dualboot'
                    ? 'bg-purple-900/30 border-purple-500 ring-1 ring-purple-500'
                    : 'bg-neutral-800/40 border-neutral-700 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Layers size={20} className="text-amber-400" />
                  {installMode === 'dualboot' && <Check size={16} className="text-purple-400" />}
                </div>
                <div className="text-sm font-bold text-white">Dual-Boot Side-by-Side</div>
                <div className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Preserves your existing OS (Windows/macOS/Linux) and configures a touch-friendly GRUB2 boot menu.
                </div>
              </div>
            </div>

            {/* Quick Live ISO Download Action */}
            <div className="p-3 bg-neutral-800/60 rounded-xl border border-neutral-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Disc size={16} className="text-purple-400" />
                <div>
                  <span className="font-semibold text-white">Bootable Live ISO Image</span>
                  <span className="text-neutral-400 ml-2 font-mono">(111 MB • Dual EFI/BIOS)</span>
                </div>
              </div>
              <a
                href="/libredroid-universal-x86_64.iso"
                download="libredroid-universal-x86_64.iso"
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-1 transition-colors"
              >
                <Download size={12} />
                <span>Download ISO</span>
              </a>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-xl"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg"
              >
                Review & Flash →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">Ready to Flash & Install</h2>
              <p className="text-xs text-neutral-400">
                Deploying LibreDroid OS for <span className="font-mono text-purple-300 font-semibold">{deviceType.toUpperCase()}</span> ({selectedDisk}).
              </p>
            </div>

            <div className="bg-neutral-800/60 border border-neutral-700 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-700/60">
                <span className="text-neutral-400">Target Device Architecture</span>
                <span className="font-mono text-white font-semibold">{deviceType === 'pc' ? 'x86_64 UEFI/BIOS' : 'ARM64 / aarch64'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-700/60">
                <span className="text-neutral-400">Installation Mode</span>
                <span className="text-white capitalize">{installMode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-700/60">
                <span className="text-neutral-400">Base System</span>
                <span className="text-white">Independent Hardened Linux 6.6 LTS + Waydroid AOSP</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-700/60">
                <span className="text-neutral-400">App Runtimes</span>
                <span className="text-emerald-400 font-semibold">Native Android APKs + Linux Flatpak + Apple Darwin</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Privacy & Freedom</span>
                <span className="text-purple-300 font-semibold">100% De-Googled / FOSS Certified</span>
              </div>
            </div>

            {isFlashing ? (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-purple-300">Writing system image...</span>
                  <span>{flashProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${flashProgress}%` }}
                  />
                </div>
                <div className="bg-black/80 p-3 rounded-xl font-mono text-[11px] text-emerald-400 max-h-36 overflow-y-auto space-y-1 border border-neutral-800">
                  {flashLogs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-xl"
                >
                  ← Back
                </button>
                <button
                  onClick={startInstallation}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2"
                >
                  <Play size={15} />
                  <span>Begin Installation</span>
                </button>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-4 animate-fade-in py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle size={36} />
            </div>
            <div>
              <h2 className="text-xl font-bold">LibreDroid OS Deployed Successfully!</h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Target <span className="text-purple-300 font-semibold">{deviceType.toUpperCase()}</span> is configured with full native Android APK runtime and hardened security layers.
              </p>
            </div>

            {/* Terminal Commands Box */}
            <div className="bg-neutral-800/60 border border-neutral-700 p-4 rounded-2xl max-w-lg mx-auto text-left text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Manual Terminal Commands:</span>
                <span className="text-[10px] text-neutral-400 font-mono">One-click copy</span>
              </div>

              {deviceType === 'pc' && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-neutral-400">Flash to USB Flash Drive:</div>
                  <div
                    onClick={() => copyToClipboard('sudo dd if=libredroid-universal-x86_64.iso of=/dev/sdX bs=4M status=progress && sync')}
                    className="bg-black p-2 rounded-xl font-mono text-[11px] text-purple-300 break-all border border-neutral-800 cursor-pointer flex justify-between items-center hover:border-purple-600"
                  >
                    <span>sudo dd if=libredroid-universal-x86_64.iso of=/dev/sdX bs=4M status=progress && sync</span>
                    <Copy size={13} className="shrink-0 ml-2 text-neutral-400" />
                  </div>
                </div>
              )}

              {deviceType === 'android' && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-neutral-400">Launch Standalone Kiosk or Restore:</div>
                  <div
                    onClick={() => copyToClipboard('./installer/freeze-stock-launcher.sh')}
                    className="bg-black p-2 rounded-xl font-mono text-[11px] text-purple-300 break-all border border-neutral-800 cursor-pointer flex justify-between items-center hover:border-purple-600 mb-1"
                  >
                    <span>./installer/freeze-stock-launcher.sh</span>
                    <Copy size={13} className="shrink-0 ml-2 text-neutral-400" />
                  </div>
                  <div
                    onClick={() => copyToClipboard('./installer/restore-stock-os.sh')}
                    className="bg-black p-2 rounded-xl font-mono text-[11px] text-emerald-400 break-all border border-neutral-800 cursor-pointer flex justify-between items-center hover:border-emerald-600"
                  >
                    <span>./installer/restore-stock-os.sh</span>
                    <Copy size={13} className="shrink-0 ml-2 text-neutral-400" />
                  </div>
                </div>
              )}

              {deviceType === 'sbc' && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-neutral-400">Flash Raspberry Pi SD Card:</div>
                  <div
                    onClick={() => copyToClipboard('xzcat libredroid-rpi-arm64.img.xz | sudo dd of=/dev/mmcblk0 bs=4M status=progress && sync')}
                    className="bg-black p-2 rounded-xl font-mono text-[11px] text-purple-300 break-all border border-neutral-800 cursor-pointer flex justify-between items-center hover:border-purple-600"
                  >
                    <span>xzcat libredroid-rpi-arm64.img.xz | sudo dd of=/dev/mmcblk0 bs=4M status=progress && sync</span>
                    <Copy size={13} className="shrink-0 ml-2 text-neutral-400" />
                  </div>
                </div>
              )}

              {deviceType === 'vm' && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-neutral-400">Launch in QEMU with 3D acceleration:</div>
                  <div
                    onClick={() => copyToClipboard('qemu-system-x86_64 -enable-kvm -m 4096 -smp 4 -cdrom libredroid-universal-x86_64.iso -vga virtio')}
                    className="bg-black p-2 rounded-xl font-mono text-[11px] text-purple-300 break-all border border-neutral-800 cursor-pointer flex justify-between items-center hover:border-purple-600"
                  >
                    <span>qemu-system-x86_64 -enable-kvm -m 4096 -smp 4 -cdrom libredroid-universal-x86_64.iso -vga virtio</span>
                    <Copy size={13} className="shrink-0 ml-2 text-neutral-400" />
                  </div>
                </div>
              )}

              {copiedCmd && (
                <div className="text-[10px] text-emerald-400 text-center font-semibold">
                  ✓ Command copied to clipboard!
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl"
              >
                Configure Another Target
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
