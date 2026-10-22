import React, { useState } from 'react';
import { 
  Apple, 
  Upload, 
  Play, 
  Trash2, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Check, 
  AlertCircle,
  FileCode,
  HardDrive
} from 'lucide-react';
import { 
  getInstalledAppleApps, 
  saveInstalledAppleApp, 
  uninstallAppleApp, 
  parseIpaFile, 
  SideloadedAppleApp 
} from '../../services/appleAppManager';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { AppIcon } from '../common/AppIcon';

export const AppleDarwinBridgeApp: React.FC = () => {
  const [apps, setApps] = useState<SideloadedAppleApp[]>(getInstalledAppleApps());
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedApp, setSelectedApp] = useState<SideloadedAppleApp | null>(null);

  const { openApp } = useWindow();
  const { addNotification } = useSystem();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.ipa') && 
        !file.name.toLowerCase().endsWith('.app') && 
        !file.name.toLowerCase().endsWith('.zip')) {
      alert('Please select a valid Apple application bundle (.ipa or .app)');
      return;
    }

    setIsInstalling(true);
    setInstallProgress(20);
    setStatusMessage(`Extracting Payload/${file.name}...`);

    setTimeout(async () => {
      setInstallProgress(50);
      setStatusMessage('Parsing Info.plist & Mach-O ARM64 headers...');

      setTimeout(async () => {
        setInstallProgress(80);
        setStatusMessage('Linking CocoaTouch / UIKit dylibs & bypassing code signatures...');

        const parsed = await parseIpaFile(file);

        setTimeout(() => {
          setInstallProgress(100);
          const updated = saveInstalledAppleApp(parsed);
          setApps(updated);
          setIsInstalling(false);
          setStatusMessage('');

          addNotification({
            appId: 'darwin_bridge',
            appName: 'Darwin Bridge',
            title: `${parsed.name} Ready`,
            body: `Bundle ${parsed.bundleId} loaded via touchHLE / Darling runtime.`,
          });
        }, 500);
      }, 600);
    }, 500);
  };

  const handleUninstall = (bundleId: string) => {
    const updated = uninstallAppleApp(bundleId);
    setApps(updated);
    if (selectedApp?.bundleId === bundleId) {
      setSelectedApp(null);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden font-sans">
      {/* Top Header */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-xl">
            <Apple size={20} />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              Apple Darwin / CocoaTouch Bridge
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-mono">
                Darwin 23.4 (XNU)
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Run iOS (.ipa) & macOS (.app) binaries natively on Linux via Darling & touchHLE
            </div>
          </div>
        </div>

        {/* Upload IPA Button */}
        <label className="cursor-pointer px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition-colors">
          <Upload size={14} />
          <span>Sideload .IPA</span>
          <input
            type="file"
            accept=".ipa,.app,.zip"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isInstalling}
          />
        </label>
      </div>

      {/* Installation Progress Bar */}
      {isInstalling && (
        <div className="bg-neutral-950 p-3 border-b border-rose-500/30 shrink-0 animate-fade-in">
          <div className="flex justify-between text-xs mb-1 font-mono">
            <span className="text-rose-400">{statusMessage}</span>
            <span className="text-white font-bold">{installProgress}%</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-300"
              style={{ width: `${installProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Apps List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Installed Apple Apps ({apps.length})</span>
            <span className="text-[10px] text-rose-400 font-mono">Mach-O ARM64 / Universal</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {apps.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`p-3 bg-neutral-850 hover:bg-neutral-800 border rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  selectedApp?.id === app.id
                    ? 'border-rose-500 shadow-lg shadow-rose-500/10'
                    : 'border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl ${app.iconBg} flex items-center justify-center shrink-0 shadow`}>
                    <Apple size={22} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{app.name}</div>
                    <div className="text-[11px] text-neutral-400 font-mono truncate">{app.bundleId}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-mono">
                        {app.framework}
                      </span>
                      <span className="text-[9px] text-neutral-400 font-mono">{app.minimumIosVersion}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openApp(app.id, app.name, 'darwin-apple');
                    }}
                    className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors shadow"
                    title="Launch iOS App"
                  >
                    <Play size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUninstall(app.bundleId);
                    }}
                    className="p-2 bg-neutral-800 hover:bg-red-600/40 text-neutral-400 hover:text-red-300 rounded-xl transition-colors"
                    title="Uninstall"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Darwin / CocoaTouch Architecture Banner */}
          <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-2xl space-y-2 mt-4 text-xs">
            <div className="font-bold text-white flex items-center gap-2">
              <Zap size={14} className="text-rose-400" />
              <span>How LibreDroid Runs Apple Apps Without Apple Hardware</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-neutral-400 pt-1">
              <div className="p-2 bg-neutral-900 rounded-xl border border-neutral-850">
                <span className="text-rose-300 font-bold block mb-1">1. Darling XNU Kernel</span>
                Emulates Darwin 23.4 system calls, mach ports, and pthread primitives directly on Linux.
              </div>
              <div className="p-2 bg-neutral-900 rounded-xl border border-neutral-850">
                <span className="text-amber-300 font-bold block mb-1">2. touchHLE / UIKit</span>
                High-level translation of Apple UIKit & CoreGraphics rendering directly to Wayland surfaces.
              </div>
              <div className="p-2 bg-neutral-900 rounded-xl border border-neutral-850">
                <span className="text-cyan-300 font-bold block mb-1">3. Metal-to-Vulkan</span>
                Compiles Apple MSL shading language into SPIR-V shaders executed on host Vulkan GPUs.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Selected App Details Drawer */}
        {selectedApp && (
          <div className="w-72 bg-neutral-950 border-l border-neutral-800 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="space-y-4">
              <div className="text-center pb-2 border-b border-neutral-800">
                <div className={`w-14 h-14 rounded-2xl ${selectedApp.iconBg} flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                  <Apple size={28} className="text-white" />
                </div>
                <h3 className="text-sm font-bold text-white">{selectedApp.name}</h3>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{selectedApp.bundleId}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-850">
                  <span className="text-neutral-400">Binary Type</span>
                  <span className="text-rose-300 font-mono">{selectedApp.binaryType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-850">
                  <span className="text-neutral-400">Target Framework</span>
                  <span className="text-white font-mono">{selectedApp.framework}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-850">
                  <span className="text-neutral-400">Code Signature</span>
                  <span className="text-emerald-400 font-mono">{selectedApp.codeSignature}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-850">
                  <span className="text-neutral-400">Binary Size</span>
                  <span className="text-neutral-200 font-mono">{selectedApp.size}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-850">
                  <span className="text-neutral-400">Min OS Target</span>
                  <span className="text-neutral-200 font-mono">{selectedApp.minimumIosVersion}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold block mb-1">
                  Active Entitlements:
                </span>
                <div className="space-y-1">
                  {selectedApp.entitlements.map((ent) => (
                    <div key={ent} className="text-[10px] font-mono p-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-rose-300 truncate">
                      {ent}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button
                onClick={() => openApp(selectedApp.id, selectedApp.name, 'darwin-apple')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow transition-colors"
              >
                <Play size={14} />
                <span>Launch in Darwin Runner</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
