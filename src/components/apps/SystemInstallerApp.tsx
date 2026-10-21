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
  Check
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

export const SystemInstallerApp: React.FC = () => {
  const { addNotification } = useSystem();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDisk, setSelectedDisk] = useState('/dev/nvme0n1');
  const [installMode, setInstallMode] = useState<'clean' | 'dualboot'>('clean');
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashProgress, setFlashProgress] = useState(0);
  const [flashLogs, setFlashLogs] = useState<string[]>([]);

  const disks = [
    { id: '/dev/nvme0n1', name: 'NVMe Solid State Drive (Samsung 980 Pro)', size: '512 GB', type: 'Internal SSD' },
    { id: '/dev/sda', name: 'SATA Drive (Crucial MX500)', size: '1000 GB', type: 'Internal HDD/SSD' },
    { id: '/dev/sdb', name: 'USB Flash Installer Drive (SanDisk Extreme)', size: '64 GB', type: 'Removable USB' },
  ];

  const startInstallation = () => {
    setIsFlashing(true);
    setFlashProgress(5);
    setFlashLogs(['[1/6] Scanning partition tables and checking UEFI boot entries...']);

    setTimeout(() => {
      setFlashProgress(25);
      setFlashLogs((prev) => [
        ...prev,
        `[2/6] Partitioning ${selectedDisk} (ESP: 512MB, ROOTFS: Ext4, WAYDROID_DATA: 64GB)...`,
      ]);

      setTimeout(() => {
        setFlashProgress(55);
        setFlashLogs((prev) => [
          ...prev,
          '[3/6] Deploying Linux 6.6 LTS Kernel with Ashmem & Binder IPC modules...',
          '[4/6] Installing Waydroid containerized AOSP runtime with microG core...',
        ]);

        setTimeout(() => {
          setFlashProgress(85);
          setFlashLogs((prev) => [
            ...prev,
            '[5/6] Writing GRUB2 EFI bootloader with touch navigation support...',
          ]);

          setTimeout(() => {
            setFlashProgress(100);
            setFlashLogs((prev) => [
              ...prev,
              '[6/6] Installation successfully completed! LibreDroid OS is now bootable.',
            ]);
            setIsFlashing(false);
            setStep(4);

            addNotification({
              appId: 'system_installer',
              appName: 'OS Installer',
              title: 'System Installation Complete',
              body: `LibreDroid has been written to ${selectedDisk}. Ready to reboot.`,
            });
          }, 1200);
        }, 1200);
      }, 1200);
    }, 1000);
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
              LibreDroid Hardware System Installer
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                Independent OS
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Deploy as an independent bare-metal OS or dual-boot system
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
                  ? 'bg-purple-600 text-white'
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

      {/* Main Step Container */}
      <div className="flex-1 p-6 overflow-y-auto max-w-2xl mx-auto w-full flex flex-col justify-center">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">Hardware Compatibility & Target Drive</h2>
              <p className="text-xs text-neutral-400">
                Choose the storage drive where LibreDroid OS and the Waydroid container will be deployed.
              </p>
            </div>

            <div className="space-y-2 mt-4">
              {disks.map((d) => (
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

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors"
              >
                Continue to Partitioning →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">Partition & Installation Type</h2>
              <p className="text-xs text-neutral-400">
                Select how LibreDroid should co-exist with your existing drives.
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
                <div className="text-sm font-bold text-white">Full Disk Erase (Recommended)</div>
                <div className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Dedicate the entire drive to LibreDroid for optimum performance, encrypted storage, and maximum Waydroid container speed.
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
                <div className="text-sm font-bold text-white">Dual-Boot Alongside OS</div>
                <div className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Shrinks an existing Windows or Linux partition by 64 GB and installs LibreDroid with a dual-boot bootloader.
                </div>
              </div>
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
                Review & Confirm →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">Ready to Flash & Install</h2>
              <p className="text-xs text-neutral-400">
                Writing LibreDroid to <span className="font-mono text-purple-300 font-semibold">{selectedDisk}</span>.
              </p>
            </div>

            <div className="bg-neutral-800/60 border border-neutral-700 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-700/60">
                <span className="text-neutral-400">Target Disk</span>
                <span className="font-mono text-white">{selectedDisk}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-700/60">
                <span className="text-neutral-400">Base System</span>
                <span className="text-white">Independent Linux 6.6 LTS + Waydroid AOSP</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-700/60">
                <span className="text-neutral-400">App Runtime</span>
                <span className="text-emerald-400 font-semibold">Native Android APK Execution + microG</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Monopoly Independence</span>
                <span className="text-purple-300 font-semibold">100% De-Googled / FOSS Certified</span>
              </div>
            </div>

            {isFlashing ? (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-purple-300">Installing system...</span>
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
              <h2 className="text-xl font-bold">LibreDroid OS Installed Successfully!</h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Your computer is now equipped with an independent, de-googled universal Android OS with native APK execution capabilities.
              </p>
            </div>

            <div className="bg-neutral-800/60 border border-neutral-700 p-4 rounded-2xl max-w-md mx-auto text-left text-xs space-y-2">
              <div className="font-semibold text-white">Manual USB Flash Command:</div>
              <div className="bg-black p-2.5 rounded-xl font-mono text-[11px] text-purple-300 break-all border border-neutral-800">
                sudo dd if=libredroid-universal.iso of=/dev/sdX bs=4M status=progress
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl"
              >
                Configure Another Drive
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
