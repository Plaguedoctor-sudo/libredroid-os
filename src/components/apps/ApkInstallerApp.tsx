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
  ExternalLink,
  Apple,
  Sparkles
} from 'lucide-react';
import { 
  getInstalledApks, 
  saveInstalledApk, 
  uninstallApk, 
  parseApkFile, 
  SideloadedApk 
} from '../../services/apkManager';
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

export const ApkInstallerApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'android' | 'apple'>('all');
  const [apks, setApks] = useState<SideloadedApk[]>(getInstalledApks());
  const [appleApps, setAppleApps] = useState<SideloadedAppleApp[]>(getInstalledAppleApps());
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedApk, setSelectedApk] = useState<SideloadedApk | null>(null);
  const [selectedAppleApp, setSelectedAppleApp] = useState<SideloadedAppleApp | null>(null);

  const { openApp } = useWindow();
  const { addNotification } = useSystem();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    const isApple = lower.endsWith('.ipa') || lower.endsWith('.app');
    const isAndroid = lower.endsWith('.apk') || (lower.endsWith('.zip') && !isApple);

    if (!isApple && !isAndroid) {
      alert('Please select a valid package: Android (.apk) or Apple iOS/macOS (.ipa / .app)');
      return;
    }

    setIsInstalling(true);
    setInstallProgress(15);
    setStatusMessage(`Analyzing binary bundle ${file.name}...`);

    if (isApple) {
      setTimeout(async () => {
        setInstallProgress(45);
        setStatusMessage('Extracting Payload/*.app, Info.plist & Mach-O ARM64 headers...');

        setTimeout(async () => {
          setInstallProgress(80);
          setStatusMessage('Configuring Darwin / touchHLE CocoaTouch bridge...');

          const parsed = await parseIpaFile(file);

          setTimeout(() => {
            setInstallProgress(100);
            const updated = saveInstalledAppleApp(parsed);
            setAppleApps(updated);
            setIsInstalling(false);
            setStatusMessage('');

            addNotification({
              appId: 'apk_installer',
              appName: 'Package Installer',
              title: `${parsed.name} Ready`,
              body: `Apple iOS app ${parsed.bundleId} loaded via Darwin CocoaTouch bridge.`,
            });
          }, 500);
        }, 600);
      }, 500);
    } else {
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
              body: `Android package ${parsed.packageName} is ready in Waydroid container.`,
            });
          }, 500);
        }, 600);
      }, 500);
    }
  };

  const handleUninstallApk = (pkg: string) => {
    const updated = uninstallApk(pkg);
    setApks(updated);
    if (selectedApk?.packageName === pkg) setSelectedApk(null);
  };

  const handleUninstallApple = (bundleId: string) => {
    const updated = uninstallAppleApp(bundleId);
    setAppleApps(updated);
    if (selectedAppleApp?.bundleId === bundleId) setSelectedAppleApp(null);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden font-sans">
      {/* Top Header */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-emerald-500 to-rose-500 text-white rounded-xl">
            <Box size={18} />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              Universal Package Hub
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                Android APK + Apple IPA
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Run Android apps (Waydroid) and Apple iOS/macOS apps (Darwin CocoaTouch) seamlessly
            </div>
          </div>
        </div>

        {/* Sideload File Button */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-rose-600 hover:from-emerald-500 hover:to-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow">
          <Upload size={14} />
          <span>Sideload .APK / .IPA</span>
          <input
            type="file"
            accept=".apk,.ipa,.app,.zip"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isInstalling}
          />
        </label>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 py-2 bg-neutral-950/70 border-b border-neutral-800 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1 rounded-xl font-medium transition-colors ${
            activeTab === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          All Packages ({apks.length + appleApps.length})
        </button>
        <button
          onClick={() => setActiveTab('android')}
          className={`px-3 py-1 rounded-xl font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === 'android' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Android AOSP ({apks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('apple')}
          className={`px-3 py-1 rounded-xl font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === 'apple' ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Apple size={12} className="text-rose-400" />
          <span>Apple Darwin ({appleApps.length})</span>
        </button>
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
              className="h-full bg-gradient-to-r from-emerald-500 to-rose-500 transition-all duration-300"
              style={{ width: `${installProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Two-Column View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left List of Installed Packages */}
        <div className="w-full sm:w-1/2 p-4 overflow-y-auto border-r border-neutral-800 space-y-3">
          {/* Android Packages */}
          {(activeTab === 'all' || activeTab === 'android') && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                <span>Android Applications (Waydroid LXC)</span>
                <span className="font-mono text-[10px] text-neutral-400">{apks.length} apps</span>
              </div>
              {apks.map((apk) => (
                <div
                  key={apk.packageName}
                  onClick={() => {
                    setSelectedApk(apk);
                    setSelectedAppleApp(null);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedApk?.packageName === apk.packageName
                      ? 'bg-neutral-800 border-emerald-500 ring-1 ring-emerald-500/50'
                      : 'bg-neutral-850/60 border-neutral-800 hover:bg-neutral-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AppIcon appId={apk.id} size="md" />
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>{apk.name}</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">APK</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono truncate max-w-[160px]">{apk.packageName}</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openApp(apk.id, apk.name, 'hardened-android');
                    }}
                    className="p-2 bg-emerald-600/30 hover:bg-emerald-600/60 text-emerald-300 rounded-xl transition-colors"
                    title="Launch in Waydroid"
                  >
                    <Play size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Apple Packages */}
          {(activeTab === 'all' || activeTab === 'apple') && (
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center justify-between">
                <span>Apple iOS / macOS Apps (Darwin CocoaTouch)</span>
                <span className="font-mono text-[10px] text-neutral-400">{appleApps.length} apps</span>
              </div>
              {appleApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    setSelectedAppleApp(app);
                    setSelectedApk(null);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedAppleApp?.id === app.id
                      ? 'bg-neutral-800 border-rose-500 ring-1 ring-rose-500/50'
                      : 'bg-neutral-850/60 border-neutral-800 hover:bg-neutral-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${app.iconBg} flex items-center justify-center shadow`}>
                      <Apple size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>{app.name}</span>
                        <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-mono">IPA</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono truncate max-w-[160px]">{app.bundleId}</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openApp(app.id, app.name, 'darwin-apple');
                    }}
                    className="p-2 bg-rose-600/30 hover:bg-rose-600/60 text-rose-300 rounded-xl transition-colors"
                    title="Launch in Darwin Runner"
                  >
                    <Play size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
                      Waydroid AOSP 13 Sandbox Isolated
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleUninstallApk(selectedApk.packageName)}
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
                  onClick={() => openApp(selectedApk.id, selectedApk.name, 'hardened-android')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={15} />
                  <span>Launch Android App</span>
                </button>
              </div>
            </div>
          ) : selectedAppleApp ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl ${selectedAppleApp.iconBg} flex items-center justify-center shadow-lg`}>
                    <Apple size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedAppleApp.name}</h3>
                    <p className="text-xs text-neutral-400 font-mono">{selectedAppleApp.bundleId}</p>
                    <span className="inline-block mt-1 text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md font-mono">
                      Darwin CocoaTouch / touchHLE Active
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleUninstallApple(selectedAppleApp.bundleId)}
                  className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  title="Uninstall App"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/80 p-3.5 rounded-2xl border border-neutral-800">
                {selectedAppleApp.description}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-850">
                  <span className="text-neutral-400">Architecture</span>
                  <span className="text-rose-300 font-mono">{selectedAppleApp.architecture} ({selectedAppleApp.binaryType})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-850">
                  <span className="text-neutral-400">Target Framework</span>
                  <span className="text-white font-mono">{selectedAppleApp.framework}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-850">
                  <span className="text-neutral-400">Code Signature</span>
                  <span className="text-emerald-400 font-mono">{selectedAppleApp.codeSignature}</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => openApp(selectedAppleApp.id, selectedAppleApp.name, 'darwin-apple')}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={15} />
                  <span>Launch Apple App</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 text-xs">
              <Box size={48} className="mb-3 opacity-30 text-emerald-400" />
              <p className="font-semibold text-neutral-400">Select any installed package</p>
              <p className="text-[11px] text-neutral-500 mt-1 max-w-xs">
                Or click "Sideload .APK / .IPA" above to run any Android or Apple app on LibreDroid OS.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
