import React, { useState } from 'react';
import { 
  Box, 
  Upload, 
  Check, 
  ShieldCheck, 
  Play, 
  Trash2, 
  FileText, 
  Cpu, 
  Layers, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { 
  getInstalledApks, 
  saveInstalledApk, 
  uninstallApk, 
  parseApkFile, 
  SideloadedApk 
} from '../../services/apkManager';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { AppIcon } from '../common/AppIcon';

export const ApkInstallerApp: React.FC = () => {
  const [apks, setApks] = useState<SideloadedApk[]>(getInstalledApks());
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedApk, setSelectedApk] = useState<SideloadedApk | null>(null);

  const { openApp } = useWindow();
  const { addNotification } = useSystem();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.apk') && !file.name.toLowerCase().endsWith('.zip')) {
      alert('Please select a valid Android package file (.apk)');
      return;
    }

    setIsInstalling(true);
    setInstallProgress(15);
    setStatusMessage(`Reading ${file.name}...`);

    setTimeout(async () => {
      setInstallProgress(45);
      setStatusMessage('Extracting AndroidManifest.xml & verifying signatures...');

      setTimeout(async () => {
        setInstallProgress(80);
        setStatusMessage('Configuring Waydroid LXC sandbox permissions...');

        const parsed = await parseApkFile(file);

        setTimeout(() => {
          setInstallProgress(100);
          const updated = saveInstalledApk(parsed);
          setApks(updated);
          setIsInstalling(false);
          setStatusMessage('');

          addNotification({
            appId: 'apk_installer',
            appName: 'Package Installer',
            title: `${parsed.name} Installed`,
            body: `Package ${parsed.packageName} is now ready in the Waydroid container.`,
          });
        }, 600);
      }, 700);
    }, 600);
  };

  const handleUninstall = (pkg: string) => {
    const updated = uninstallApk(pkg);
    setApks(updated);
    if (selectedApk?.packageName === pkg) {
      setSelectedApk(null);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Box size={18} />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              APK Installer & Waydroid Runner
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                AOSP Runtime
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Run existing Android APKs independently without Google Play Services
            </div>
          </div>
        </div>

        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow">
          <Upload size={14} />
          <span>Sideload .APK</span>
          <input
            type="file"
            accept=".apk,.zip"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Installation Progress Bar */}
      {isInstalling && (
        <div className="p-4 bg-neutral-850 border-b border-neutral-700 animate-fade-in shrink-0">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-emerald-400 flex items-center gap-2">
              <Cpu size={14} className="animate-spin" />
              <span>{statusMessage}</span>
            </span>
            <span>{installProgress}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${installProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Two-Column View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left List of Installed Android APKs */}
        <div className="w-full sm:w-1/2 p-4 overflow-y-auto border-r border-neutral-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            <span>Installed Packages ({apks.length})</span>
            <span className="text-emerald-400 font-mono">microG Spoofing Active</span>
          </div>

          {apks.map((apk) => (
            <div
              key={apk.packageName}
              onClick={() => setSelectedApk(apk)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedApk?.packageName === apk.packageName
                  ? 'bg-neutral-800 border-emerald-500 ring-1 ring-emerald-500/50'
                  : 'bg-neutral-800/40 border-neutral-700/80 hover:bg-neutral-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <AppIcon appId={apk.id} size="md" />
                <div>
                  <div className="text-sm font-semibold text-white">{apk.name}</div>
                  <div className="text-xs text-neutral-400 font-mono">{apk.packageName}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    v{apk.version} • {apk.size}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openApp(apk.id, apk.name);
                  }}
                  className="p-2 bg-emerald-600/30 hover:bg-emerald-600/60 text-emerald-300 rounded-xl transition-colors"
                  title="Launch in Waydroid container"
                >
                  <Play size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Detail Pane */}
        <div className="hidden sm:flex flex-1 p-5 flex-col justify-between overflow-y-auto bg-neutral-950/60">
          {selectedApk ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                  <AppIcon appId={selectedApk.id} size="lg" />
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedApk.name}</h3>
                    <p className="text-xs text-neutral-400 font-mono">{selectedApk.packageName}</p>
                    <span className="inline-block mt-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono">
                      Waydroid Sandbox Isolated
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleUninstall(selectedApk.packageName)}
                  className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  title="Uninstall APK"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/80 p-3.5 rounded-2xl border border-neutral-800">
                {selectedApk.description}
              </div>

              {/* Permissions & Security */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Declared Android Permissions</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApk.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="text-[11px] bg-neutral-800 border border-neutral-700 px-2.5 py-1 rounded-lg font-mono text-neutral-300"
                    >
                      android.permission.{perm}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => openApp(selectedApk.id, selectedApk.name)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={15} />
                  <span>Launch Application</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 text-xs">
              <Box size={48} className="mb-3 opacity-30 text-emerald-400" />
              <p className="font-semibold text-neutral-400">Select an installed Android package</p>
              <p className="text-[11px] text-neutral-500 mt-1 max-w-xs">
                Or click "Sideload .APK" above to install any existing Android app from your storage.
              </p>
            </div>
          )}

          {/* MicroG Status Banner */}
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-[11px] flex items-center justify-between text-neutral-400 shrink-0 mt-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>microG GmsCore: Mocking Google Play Services safely</span>
            </span>
            <span className="text-emerald-400 font-mono">Status: Pure FOSS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
