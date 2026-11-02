import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  HardDrive, 
  Cloud, 
  Plus, 
  Trash2, 
  Search, 
  X,
  Server,
  Smartphone,
  ArrowLeft,
  Download,
  Eye,
  RefreshCw,
  Box,
  Image as ImageIcon,
  Bot,
  Share2
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { useWindow } from '../../context/WindowContext';
import type { AppIntent } from '../../types/apps';
import { VFile } from '../../types/system';
import { 
  fetchPhysicalStorage, 
  createPhysicalFile, 
  PhysicalStorageItem 
} from '../../services/hardwareBridgeClient';

interface Props extends Partial<AppIntent> {
  intent?: AppIntent;
}

export const FilesApp: React.FC<Props> = ({ intent, params, paramSeq }) => {
  const effectiveIntent = intent || (params ? { params, paramSeq } : undefined);
  const { account, addNotification } = useSystem();
  const { openApp } = useWindow();
  const [sourceMode, setSourceMode] = useState<'physical' | 'nextcloud'>('physical');
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [search, setSearch] = useState('');
  const [previewFile, setPreviewFile] = useState<VFile | PhysicalStorageItem | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');

  // Physical Android Storage state
  const [physicalPath, setPhysicalPath] = useState<string>('/storage/emulated/0');
  const [physicalItems, setPhysicalItems] = useState<PhysicalStorageItem[]>([]);
  const [loadingPhysical, setLoadingPhysical] = useState(false);
  const [physicalStorageStats, setPhysicalStorageStats] = useState({
    total: '107 GB',
    used: '39 GB',
    available: '67 GB',
    usePercent: '37%'
  });

  const [files, setFiles] = useState<VFile[]>([
    { id: '1', name: 'Documents', isFolder: true, parentId: 'root', modified: 'Oct 20, 2026' },
    { id: '2', name: 'Downloads (APKs)', isFolder: true, parentId: 'root', modified: 'Yesterday' },
    { id: '3', name: 'Nextcloud Sovereign Hub', isFolder: true, parentId: 'root', modified: 'Just now' },
    { id: '4', name: 'Waydroid App Data', isFolder: true, parentId: 'root', modified: 'Oct 18, 2026' },
    { 
      id: '5', 
      name: 'LibreDroid-Manifesto.txt', 
      isFolder: false, 
      parentId: 'root', 
      size: '3.6 KB', 
      modified: 'Today',
      content: 'LibreDroid Sovereign Operating Principles:\n1. Non-Monopolistic: Zero proprietary software locks or un-removable Big Tech bloat.\n2. True Android App Compatibility: Runs real .apk Android packages via containerized Waydroid/microG.\n3. Universal Device Adaptation: Adapts fluidly between smartphone, tablet, foldable, and desktop DeX modes.\n4. Independent Hardware Installation: Can be flashed as a native bootable OS to SSD, eMMC, or USB drive.'
    },
    { 
      id: '6', 
      name: 'Waydroid-Kernel-Config.conf', 
      isFolder: false, 
      parentId: 'root', 
      size: '1.4 KB', 
      modified: 'Oct 21, 2026',
      content: 'CONFIG_ANDROID=y\nCONFIG_ANDROID_BINDER_IPC=y\nCONFIG_ASHMEM=y\nCONFIG_NAMESPACES=y\nCONFIG_NET_NS=y\nCONFIG_PID_NS=y\nCONFIG_IPC_NS=y'
    },
    { 
      id: '7', 
      name: 'Nextcloud-Encrypted-Notes.md', 
      isFolder: false, 
      parentId: '1', 
      size: '2.1 KB', 
      modified: 'Oct 19, 2026',
      content: '# Nextcloud Private Hub\n- Self-hosted sync cluster on Raspberry Pi / Home Server\n- Zero third-party surveillance\n- End-to-end PGP encrypted file vaults'
    },
    { 
      id: '8', 
      name: 'NewPipe-v0.27.0.apk', 
      isFolder: false, 
      parentId: '2', 
      size: '14.8 MB', 
      modified: 'Today' 
    },
  ]);

  const loadPhysicalDirectory = async (path: string) => {
    setLoadingPhysical(true);
    try {
      const data = await fetchPhysicalStorage(path);
      setPhysicalPath(data.path);
      setPhysicalItems(data.items || []);
    } catch {
      // fallback
    } finally {
      setLoadingPhysical(false);
    }
  };

  useEffect(() => {
    if (sourceMode === 'physical') {
      loadPhysicalDirectory(physicalPath);
    }
  }, [sourceMode]);

  useEffect(() => {
    const p = effectiveIntent?.params;
    if (!p) return;
    if (typeof p.source === 'string' && (p.source === 'physical' || p.source === 'nextcloud')) {
      setSourceMode(p.source);
    }
    if (typeof p.path === 'string') {
      loadPhysicalDirectory(p.path);
    }
  }, [effectiveIntent?.paramSeq]);

  const displayedFiles = files.filter((f) => {
    if (search.trim()) {
      return f.name.toLowerCase().includes(search.toLowerCase());
    }
    return f.parentId === currentFolder;
  });

  const displayedPhysical = physicalItems.filter((f) => {
    if (search.trim()) {
      return f.name.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const handleCreateFile = async () => {
    const ts = Date.now().toString().slice(-4);
    const name = `document-${ts}.txt`;

    if (sourceMode === 'physical') {
      const res = await createPhysicalFile(physicalPath, name, `Created via LibreDroid OS Files Hub on ${new Date().toLocaleString()}`);
      if (res.success) {
        addNotification({
          appId: 'files',
          appName: 'Files Hub',
          title: 'Physical File Created',
          body: `Saved ${name} directly to ${physicalPath}`,
        });
        loadPhysicalDirectory(physicalPath);
      }
    } else {
      const newFile: VFile = {
        id: Math.random().toString(36).substring(2, 7),
        name,
        isFolder: false,
        parentId: currentFolder,
        size: '1.0 KB',
        modified: 'Just now',
        content: 'Self-sovereign file created on ' + new Date().toLocaleString(),
      };
      setFiles((prev) => [...prev, newFile]);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderNameInput.trim()) return;
    const name = newFolderNameInput.trim();
    const newFolder: VFile = {
      id: Math.random().toString(36).substring(2, 7),
      name,
      isFolder: true,
      parentId: currentFolder,
      modified: 'Just now',
    };
    setFiles((prev) => [...prev, newFolder]);
    setNewFolderNameInput('');
    setShowNewFolderModal(false);
    addNotification({
      appId: 'files',
      appName: 'Files Hub',
      title: 'Folder Created',
      body: `Created folder "${name}" in ${currentFolder === 'root' ? 'root directory' : 'current folder'}.`,
    });
  };

  const handleNavigateUp = () => {
    if (sourceMode === 'physical') {
      if (physicalPath === '/storage/emulated/0' || physicalPath === '/sdcard') return;
      const parent = physicalPath.substring(0, physicalPath.lastIndexOf('/')) || '/storage/emulated/0';
      loadPhysicalDirectory(parent);
    } else {
      setCurrentFolder('root');
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Top Bar */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {((sourceMode === 'physical' && physicalPath !== '/storage/emulated/0') ||
            (sourceMode === 'nextcloud' && currentFolder !== 'root')) && (
            <button
              onClick={handleNavigateUp}
              className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded-lg text-emerald-300 font-medium transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={12} />
              <span>Up</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSourceMode('physical')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                sourceMode === 'physical'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone size={14} />
              <span>Device Storage (/sdcard)</span>
            </button>

            <button
              onClick={() => setSourceMode('nextcloud')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                sourceMode === 'nextcloud'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Cloud size={14} />
              <span>Nextcloud Vault</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1 border border-neutral-700">
          <Search size={14} className="text-neutral-400" />
          <input
            type="text"
            placeholder={sourceMode === 'physical' ? "Search /sdcard files..." : "Search files & APKs..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none"
          />
        </div>

        {/* Actions: New Folder & New File */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 rounded-xl text-xs font-medium transition-colors shadow"
          >
            <Folder size={14} />
            <span className="hidden sm:inline">New Folder</span>
          </button>

          <button
            onClick={handleCreateFile}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-colors shadow"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New File</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="hidden sm:flex flex-col w-56 bg-neutral-950/80 border-r border-neutral-800 p-3 gap-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-3 py-1">
            Storage Locations
          </div>

          <button
            onClick={() => { setSourceMode('physical'); loadPhysicalDirectory('/storage/emulated/0'); }}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
              sourceMode === 'physical' && physicalPath === '/storage/emulated/0'
                ? 'bg-emerald-600/20 text-emerald-300 font-semibold'
                : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Smartphone size={15} />
            <span>Internal Storage (/sdcard)</span>
          </button>

          <button
            onClick={() => { setSourceMode('physical'); loadPhysicalDirectory('/storage/emulated/0/DCIM'); }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-neutral-400 hover:bg-neutral-800 transition-colors pl-6"
          >
            <Folder size={13} className="text-amber-400" />
            <span>DCIM (Photos)</span>
          </button>

          <button
            onClick={() => { setSourceMode('physical'); loadPhysicalDirectory('/storage/emulated/0/Download'); }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-neutral-400 hover:bg-neutral-800 transition-colors pl-6"
          >
            <Folder size={13} className="text-blue-400" />
            <span>Downloads</span>
          </button>

          <button
            onClick={() => { setSourceMode('physical'); loadPhysicalDirectory('/storage/emulated/0/Documents'); }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-neutral-400 hover:bg-neutral-800 transition-colors pl-6"
          >
            <Folder size={13} className="text-emerald-400" />
            <span>Documents</span>
          </button>

          <div className="h-px bg-neutral-800 my-2" />

          <button
            onClick={() => { setSourceMode('nextcloud'); setCurrentFolder('root'); }}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
              sourceMode === 'nextcloud'
                ? 'bg-blue-600/20 text-blue-300 font-semibold'
                : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Cloud size={15} />
            <span>Nextcloud E2EE Hub</span>
          </button>

          {/* Physical Storage Meter */}
          <div className="mt-auto bg-neutral-900 p-3 rounded-2xl border border-neutral-800 text-[11px]">
            <div className="flex justify-between text-neutral-400 mb-1">
              <span>OnePlus Pad Storage</span>
              <span className="text-emerald-300 font-semibold">{physicalStorageStats.usePercent}</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: physicalStorageStats.usePercent }}
              />
            </div>
            <div className="text-[10px] text-neutral-400 mt-1.5 flex justify-between font-mono">
              <span>{physicalStorageStats.available} free</span>
              <span>{physicalStorageStats.total}</span>
            </div>
          </div>
        </div>

        {/* Files Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {sourceMode === 'physical' ? (
            <div>
              {/* Breadcrumb Path */}
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-neutral-800 text-xs font-mono text-neutral-400">
                <span className="text-neutral-500">Path:</span>
                <span className="text-emerald-300 font-semibold truncate">{physicalPath}</span>
                {loadingPhysical && <RefreshCw size={12} className="animate-spin text-emerald-400 ml-2" />}
              </div>

              {displayedPhysical.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-neutral-500 text-xs">
                  <Folder size={40} className="mb-2 opacity-40" />
                  <span>Folder is empty</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {displayedPhysical.map((item) => (
                    <div
                      key={item.path}
                      onClick={() => {
                        if (item.isFolder) {
                          loadPhysicalDirectory(item.path);
                        } else {
                          setPreviewFile(item);
                        }
                      }}
                      className="bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 hover:border-neutral-600 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-neutral-700/50 group-hover:bg-neutral-700 transition-colors">
                          {item.isFolder ? (
                            <Folder size={24} className="text-amber-400" />
                          ) : item.name.endsWith('.png') || item.name.endsWith('.jpg') ? (
                            <Eye size={24} className="text-purple-400" />
                          ) : item.name.endsWith('.apk') ? (
                            <FileText size={24} className="text-emerald-400" />
                          ) : (
                            <FileText size={24} className="text-blue-400" />
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs font-medium text-white truncate" title={item.name}>
                          {item.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 flex justify-between">
                          <span>{item.isFolder ? 'Dir' : `${Math.round(parseInt(item.size || '0') / 1024)} KB`}</span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {displayedFiles.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-neutral-500 text-xs">
                  <Folder size={40} className="mb-2 opacity-40" />
                  <span>Folder is empty</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {displayedFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => {
                        if (file.isFolder) {
                          setCurrentFolder(file.id);
                        } else {
                          setPreviewFile(file);
                        }
                      }}
                      className="bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 hover:border-neutral-600 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-neutral-700/50 group-hover:bg-neutral-700 transition-colors">
                          {file.isFolder ? (
                            <Folder size={24} className="text-amber-400" />
                          ) : file.name.endsWith('.apk') ? (
                            <FileText size={24} className="text-emerald-400" />
                          ) : (
                            <FileText size={24} className="text-blue-400" />
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs font-medium text-white truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 flex justify-between">
                          <span>{file.size || 'Folder'}</span>
                          <span>{file.modified}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowNewFolderModal(false)}
        >
          <div
            className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-3xl p-5 shadow-2xl flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Folder size={16} className="text-amber-400" />
                <span>Create New Folder</span>
              </span>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="p-1 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Folder name (e.g. Invoices, Projects)"
              value={newFolderNameInput}
              onChange={(e) => setNewFolderNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderNameInput.trim()}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs rounded-xl transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewFile(null)}
        >
          <div 
            className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-3xl p-5 shadow-2xl flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-sm font-semibold truncate max-w-[300px]">{previewFile.name}</span>
              <button 
                onClick={() => setPreviewFile(null)} 
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {'path' in previewFile && (previewFile.name.endsWith('.png') || previewFile.name.endsWith('.jpg')) ? (
              <div className="max-h-72 overflow-hidden rounded-2xl border border-neutral-800 flex items-center justify-center bg-black">
                <img 
                  src={`/api/storage/file?path=${encodeURIComponent(previewFile.path)}`} 
                  alt={previewFile.name} 
                  className="max-h-72 object-contain"
                />
              </div>
            ) : (
              <div className="bg-neutral-950 p-3 rounded-2xl font-mono text-xs text-neutral-300 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-neutral-800">
                {'content' in previewFile ? previewFile.content : 'Physical file on Android device storage.'}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* APK Installer Link */}
                {previewFile.name.endsWith('.apk') && (
                  <button
                    onClick={() => {
                      openApp('apk_installer', 'Package Hub', 'hardened-android', {
                        select: previewFile.name,
                        path: 'path' in previewFile ? previewFile.path : undefined,
                        tab: 'detail'
                      });
                      setPreviewFile(null);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-white shadow-md active:scale-95 transition-all"
                  >
                    <Box size={13} />
                    <span>Install via Package Hub</span>
                  </button>
                )}

                {/* Photo Viewer Link */}
                {'path' in previewFile && (previewFile.name.endsWith('.png') || previewFile.name.endsWith('.jpg') || previewFile.name.endsWith('.jpeg')) && (
                  <button
                    onClick={() => {
                      openApp('photos', 'Immich Gallery', undefined, {
                        photoUrl: `/api/storage/file?path=${encodeURIComponent(previewFile.path)}`,
                        caption: previewFile.name,
                      });
                      setPreviewFile(null);
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-white shadow-md active:scale-95 transition-all"
                  >
                    <ImageIcon size={13} />
                    <span>Open in Gallery</span>
                  </button>
                )}

                {/* Joplin Notes Link */}
                {(previewFile.name.endsWith('.txt') || previewFile.name.endsWith('.md') || previewFile.name.endsWith('.conf') || previewFile.name.endsWith('.json')) && (
                  <button
                    onClick={() => {
                      openApp('notes', 'Joplin Notes', undefined, {
                        title: previewFile.name,
                        content: 'content' in previewFile ? previewFile.content : `File: ${previewFile.name}`,
                      });
                      setPreviewFile(null);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-white shadow-md active:scale-95 transition-all"
                  >
                    <FileText size={13} />
                    <span>Open in Notes</span>
                  </button>
                )}

                {/* Ask Universal AI Link */}
                <button
                  onClick={() => {
                    openApp('universal_ai', 'Universal AI', 'vault-airgap', {
                      initialPrompt: `Analyze this file: ${previewFile.name}\n\n${'content' in previewFile ? previewFile.content : ('path' in previewFile ? previewFile.path : '')}`,
                    });
                    setPreviewFile(null);
                  }}
                  className="px-3 py-1.5 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Bot size={13} />
                  <span>Ask AI</span>
                </button>

                {/* Share Link */}
                <button
                  onClick={() => {
                    openApp('chats', 'Sovereign Chats', 'anonymity-whonix', {
                      message: `Sharing file: ${previewFile.name}`,
                    });
                    setPreviewFile(null);
                  }}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <Share2 size={13} />
                  <span>Share</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {'path' in previewFile && (
                  <a
                    href={`/api/storage/file?path=${encodeURIComponent(previewFile.path)}`}
                    download={previewFile.name}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-medium flex items-center gap-1.5 text-white"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </a>
                )}
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-medium text-neutral-300 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
