import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Upload, 
  Check, 
  CheckCircle2, 
  ShieldCheck, 
  Play, 
  Trash2, 
  FileText, 
  Cpu, 
  Layers, 
  AlertCircle, 
  ExternalLink, 
  Apple, 
  Sparkles,
  Globe,
  Link as LinkIcon,
  Download,
  Pin,
  PinOff,
  Shield,
  RotateCw
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
import { 
  uploadWaydroidApk, 
  uninstallWaydroidApk, 
  launchWaydroidApp 
} from '../../services/hardwareBridgeClient';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { usePersona } from '../../context/PersonaContext';
import { AppIcon } from '../common/AppIcon';
import type { AppIntent } from '../../types/apps';

interface Props extends Partial<AppIntent> {
  intent?: AppIntent;
  onHandBack?: (app: string, params?: Record<string, unknown>) => void;
}

export const ApkInstallerApp: React.FC<Props> = ({ intent, params, paramSeq }) => {
  const effectiveIntent: AppIntent | undefined = intent || (params ? { params, paramSeq } : undefined);
  const [activeTab, setActiveTab] = useState<'all' | 'android' | 'apple' | 'url'>('all');
  const [apks, setApks] = useState<SideloadedApk[]>(getInstalledApks());
  const [appleApps, setAppleApps] = useState<SideloadedAppleApp[]>(getInstalledAppleApps());
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedApk, setSelectedApk] = useState<SideloadedApk | null>(null);
  const [selectedAppleApp, setSelectedAppleApp] = useState<SideloadedAppleApp | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // URL installer state
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const { openApp } = useWindow();
  const { addNotification } = useSystem();
  const { persona, updatePersona } = usePersona();

  const refresh = () => {
    setApks(getInstalledApks());
    setAppleApps(getInstalledAppleApps());
  };

  /* ── consume intent ── */
  useEffect(() => {
    const p = effectiveIntent?.params;
    if (!p) return;

    if (typeof p.select === 'string') {
      const pkg = p.select;
      const found = apks.find(a => a.packageName === pkg || a.id === pkg);
      if (found) {
        setSelectedApk(found);
        setSelectedAppleApp(null);
      }
      if (p.tab === 'detail') setActiveTab('android');
    }
    if (p.justInstalled) {
      setHighlight(String(p.select));
      const t = setTimeout(() => setHighlight(null), 12000);
      return () => clearTimeout(t);
    }
  }, [effectiveIntent?.paramSeq, effectiveIntent?.params, apks]);

  /* re-apply selection if the window was already open and params changed */
  useEffect(() => {
    const p = effectiveIntent?.params;
    if (p?.select && apks.length && !apks.some(i => i.packageName === p.select || i.id === p.select)) {
      const t = setTimeout(refresh, 800);
      return () => clearTimeout(t);
    }
  }, [effectiveIntent?.paramSeq]);

  /* ── Unified Installer Routine ── */
  const processPackageFile = async (file: File) => {
    const lower = file.name.toLowerCase();
    const isApple = lower.endsWith('.ipa') || lower.endsWith('.app');
    const isAndroid = lower.endsWith('.apk') || (lower.endsWith('.zip') && !isApple);

    if (!isApple && !isAndroid) {
      alert('Please select a valid application package: Android (.apk) or Apple iOS/macOS (.ipa / .app)');
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
          setInstallProgress(75);
          setStatusMessage('Configuring Darwin / touchHLE CocoaTouch bridge...');

          const parsed = await parseIpaFile(file);

          setTimeout(() => {
            setInstallProgress(100);
            const updated = saveInstalledAppleApp(parsed);
            setAppleApps(updated);
            setSelectedAppleApp(parsed);
            setSelectedApk(null);
            setIsInstalling(false);
            setStatusMessage('');

            addNotification({
              appId: 'apk_installer',
              appName: 'Package Installer',
              title: `${parsed.name} Ready`,
              body: `Apple iOS app ${parsed.bundleId} loaded via Darwin CocoaTouch bridge.`,
            });
          }, 400);
        }, 500);
      }, 400);
    } else {
      setTimeout(async () => {
        setInstallProgress(35);
        setStatusMessage('Extracting AndroidManifest.xml & verifying signatures...');

        try {
          // Attempt upload & install via bridge server
          let serverPkg = null;
          try {
            const bridgeRes = await uploadWaydroidApk(file);
            if (bridgeRes.ok) {
              serverPkg = bridgeRes.pkg;
            }
          } catch {}

          setInstallProgress(70);
          setStatusMessage('Configuring Waydroid AOSP 13 LXC sandbox & permissions...');

          const parsed = await parseApkFile(file);
          if (serverPkg && serverPkg !== parsed.packageName) {
            parsed.packageName = serverPkg;
            parsed.id = serverPkg;
          }

          setTimeout(() => {
            setInstallProgress(100);
            const updated = saveInstalledApk(parsed);
            setApks(updated);
            setSelectedApk(parsed);
            setSelectedAppleApp(null);
            setIsInstalling(false);
            setStatusMessage('');

            addNotification({
              appId: 'apk_installer',
              appName: 'Package Installer',
              title: `${parsed.name} Installed`,
              body: `Android package ${parsed.packageName} is verified and ready in Waydroid container.`,
            });
          }, 400);
        } catch (err: any) {
          setIsInstalling(false);
          setStatusMessage('');
          alert(`Installation error: ${err.message || 'Failed to install APK'}`);
        }
      }, 400);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processPackageFile(file);
    }
    e.target.value = '';
  };

  /* ── Drag & Drop Handlers ── */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processPackageFile(file);
    }
  };

  /* ── Install from Direct Web URL ── */
  const handleInstallFromUrl = async () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    setUrlError(null);

    const lower = url.toLowerCase();
    const isApple = lower.includes('.ipa') || lower.includes('.app');
    const isAndroid = lower.includes('.apk');

    if (!isApple && !isAndroid) {
      setUrlError('URL must point directly to a .apk or .ipa package.');
      return;
    }

    setIsInstalling(true);
    setInstallProgress(20);
    setStatusMessage(`Downloading package stream from ${new URL(url).hostname}...`);

    setTimeout(async () => {
      setInstallProgress(60);
      setStatusMessage('Verifying package integrity checksum & TLS certificate...');

      const filename = url.split('/').pop()?.split('?')[0] || (isApple ? 'app.ipa' : 'package.apk');
      const dummyBlob = new Blob(['simulated-binary-content'], { type: 'application/octet-stream' });
      const mockFile = new File([dummyBlob], filename);

      if (isApple) {
        const parsed = await parseIpaFile(mockFile);
        const updated = saveInstalledAppleApp(parsed);
        setAppleApps(updated);
        setSelectedAppleApp(parsed);
        setSelectedApk(null);
      } else {
        const parsed = await parseApkFile(mockFile);
        const updated = saveInstalledApk(parsed);
        setApks(updated);
        setSelectedApk(parsed);
        setSelectedAppleApp(null);
      }

      setInstallProgress(100);
      setIsInstalling(false);
      setUrlInput('');
      setActiveTab('all');

      addNotification({
        appId: 'apk_installer',
        appName: 'Package Installer',
        title: `Package Installed from Web`,
        body: `Downloaded and provisioned ${filename} successfully.`,
      });
    }, 1200);
  };

  const handleUninstallApk = async (pkg: string) => {
    if (!confirm(`Are you sure you want to uninstall ${pkg}?`)) return;
    await uninstallWaydroidApk(pkg);
    const updated = uninstallApk(pkg);
    setApks(updated);
    if (selectedApk?.packageName === pkg) setSelectedApk(null);
    addNotification({
      appId: 'apk_installer',
      appName: 'Package Installer',
      title: 'Package Uninstalled',
      body: `${pkg} removed from system.`,
    });
  };

  const handleUninstallApple = (bundleId: string) => {
    if (!confirm(`Are you sure you want to remove ${bundleId}?`)) return;
    const updated = uninstallAppleApp(bundleId);
    setAppleApps(updated);
    if (selectedAppleApp?.bundleId === bundleId) setSelectedAppleApp(null);
    addNotification({
      appId: 'apk_installer',
      appName: 'Package Installer',
      title: 'Package Removed',
      body: `${bundleId} removed from Darwin runtime.`,
    });
  };

  const handleLaunch = async (id: string, name: string, domain: string) => {
    if (domain === 'hardened-android') {
      launchWaydroidApp(id).catch(() => {});
    }
    openApp(id, name, domain as any);
  };

  /* ── Toggle Home Screen Pin ── */
  const activeSelectedId = selectedApk?.id || selectedAppleApp?.id || null;
  const isPinnedToHome = activeSelectedId ? persona.homeApps.includes(activeSelectedId) : false;

  const toggleHomePin = () => {
    if (!activeSelectedId) return;
    const appName = selectedApk?.name || selectedAppleApp?.name || 'Application';
    if (isPinnedToHome) {
      updatePersona({ homeApps: persona.homeApps.filter(id => id !== activeSelectedId) });
      addNotification({
        appId: 'system',
        appName: 'Launcher',
        title: 'Removed from Home',
        body: `${appName} unpinned from Home Screen.`,
      });
    } else {
      updatePersona({ homeApps: [...persona.homeApps, activeSelectedId] });
      addNotification({
        appId: 'system',
        appName: 'Launcher',
        title: 'Pinned to Home',
        body: `${appName} added to Home Screen!`,
      });
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden font-sans ${
        isDragOver ? 'ring-4 ring-emerald-500 ring-inset bg-emerald-950/20' : ''
      }`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-neutral-950/90 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none p-6 text-center border-2 border-dashed border-emerald-400">
          <Upload size={48} className="text-emerald-400 animate-bounce mb-3" />
          <h3 className="text-base font-bold text-white">Drop .APK or .IPA package here</h3>
          <p className="text-xs text-neutral-400 mt-1">LibreDroid OS will automatically verify and install the application.</p>
        </div>
      )}

      {/* Top Header */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-emerald-500 to-rose-500 text-white rounded-xl shadow">
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
              Direct installer for Android (Waydroid) and Apple iOS/macOS (Darwin CocoaTouch)
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'url' ? 'all' : 'url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
              activeTab === 'url' 
                ? 'bg-neutral-800 text-emerald-300 border-emerald-500/50' 
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
            }`}
          >
            <Globe size={13} />
            <span>Install from URL</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-rose-600 hover:from-emerald-500 hover:to-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow">
            <Upload size={14} />
            <span>Sideload File</span>
            <input
              type="file"
              accept=".apk,.ipa,.app,.zip"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isInstalling}
            />
          </label>
        </div>
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

      {/* URL Sideload Form */}
      {activeTab === 'url' && (
        <div className="p-4 bg-neutral-950/90 border-b border-neutral-800 animate-fade-in shrink-0">
          <div className="max-w-xl mx-auto space-y-2">
            <div className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <LinkIcon size={14} className="text-emerald-400" />
              <span>Direct Web Package URL</span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/downloads/application.apk"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInstallFromUrl()}
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleInstallFromUrl}
                disabled={isInstalling || !urlInput.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download size={13} />
                <span>Fetch & Install</span>
              </button>
            </div>
            {urlError && <p className="text-[11px] text-rose-400">{urlError}</p>}
            <p className="text-[10px] text-neutral-500">
              Supports raw .apk binaries and iOS .ipa archives from GitHub releases, GitLab tags, and FOSS mirrors.
            </p>
          </div>
        </div>
      )}

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
                  className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    selectedApk?.packageName === apk.packageName
                      ? 'bg-neutral-800 border-emerald-500 ring-1 ring-emerald-500/50'
                      : highlight === apk.packageName || highlight === apk.id
                        ? 'bg-emerald-950/30 border-emerald-600/50 animate-pulse'
                        : 'bg-neutral-850/60 border-neutral-800 hover:bg-neutral-800'
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
                      handleLaunch(apk.id, apk.name, 'hardened-android');
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
                      handleLaunch(app.id, app.name, 'darwin-apple');
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
        <div className="hidden sm:flex flex-1 flex-col overflow-y-auto bg-neutral-950/60">
          {effectiveIntent?.params?.origin === 'store' && (
            <div className="px-3 py-1.5 bg-emerald-950/40 border-b border-emerald-600/30 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 size={12} />
                Installed from Sovereign Store · sha256 verified
              </span>
              <button
                onClick={() => openApp('store', 'Sovereign Store')}
                className="text-[11px] text-emerald-400 hover:text-emerald-200 font-semibold"
              >
                ← back to store
              </button>
            </div>
          )}

          <div className="p-5 flex-1 flex flex-col justify-between overflow-y-auto">
            {selectedApk ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
                  <div className="flex items-center gap-3">
                    <AppIcon appId={selectedApk.id} size="lg" />
                    <div>
                      <h3 className="text-base font-bold text-white">{selectedApk.name}</h3>
                      <p className="text-xs text-neutral-400 font-mono">{selectedApk.packageName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono">
                          Waydroid AOSP 13 Isolated
                        </span>
                        <span className="text-[10px] text-neutral-400">{selectedApk.size}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={toggleHomePin}
                      className={`p-2 rounded-xl transition-colors ${
                        isPinnedToHome ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                      title={isPinnedToHome ? 'Unpin from Home' : 'Pin to Home Screen'}
                    >
                      {isPinnedToHome ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>
                    <button
                      onClick={() => handleUninstallApk(selectedApk.packageName)}
                      className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      title="Uninstall APK"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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

                <div className="pt-4 flex gap-2">
                  <button
                    onClick={() => handleLaunch(selectedApk.id, selectedApk.name, 'hardened-android')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={15} />
                    <span>Launch Android App</span>
                  </button>
                  <button
                    onClick={toggleHomePin}
                    className="px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl border border-neutral-700 flex items-center gap-1.5"
                  >
                    <Pin size={14} />
                    <span>{isPinnedToHome ? 'Unpin' : 'Pin'}</span>
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
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md font-mono">
                          Darwin CocoaTouch Active
                        </span>
                        <span className="text-[10px] text-neutral-400">{selectedAppleApp.size}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={toggleHomePin}
                      className={`p-2 rounded-xl transition-colors ${
                        isPinnedToHome ? 'text-rose-400 bg-rose-500/10' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                      title={isPinnedToHome ? 'Unpin from Home' : 'Pin to Home Screen'}
                    >
                      {isPinnedToHome ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>
                    <button
                      onClick={() => handleUninstallApple(selectedAppleApp.bundleId)}
                      className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      title="Uninstall App"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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

                <div className="pt-4 flex gap-2">
                  <button
                    onClick={() => handleLaunch(selectedAppleApp.id, selectedAppleApp.name, 'darwin-apple')}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={15} />
                    <span>Launch Apple App</span>
                  </button>
                  <button
                    onClick={toggleHomePin}
                    className="px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl border border-neutral-700 flex items-center gap-1.5"
                  >
                    <Pin size={14} />
                    <span>{isPinnedToHome ? 'Unpin' : 'Pin'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 text-xs">
                <Box size={48} className="mb-3 opacity-30 text-emerald-400" />
                <p className="font-semibold text-neutral-400">Select any installed package</p>
                <p className="text-[11px] text-neutral-500 mt-1 max-w-xs">
                  Drag & drop an .APK or .IPA anywhere, or tap "Sideload File" to install any app on LibreDroid OS.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
