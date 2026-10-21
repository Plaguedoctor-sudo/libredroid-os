import React, { useState } from 'react';
import { 
  Folder, 
  FileText, 
  HardDrive, 
  Cloud, 
  Plus, 
  Trash2, 
  Search, 
  X,
  Server
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { VFile } from '../../types/system';

export const FilesApp: React.FC = () => {
  const { account } = useSystem();
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [search, setSearch] = useState('');
  const [previewFile, setPreviewFile] = useState<VFile | null>(null);

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

  const displayedFiles = files.filter((f) => {
    if (search.trim()) {
      return f.name.toLowerCase().includes(search.toLowerCase());
    }
    return f.parentId === currentFolder;
  });

  const handleCreateFile = () => {
    const name = prompt('Enter new file name (e.g. config.txt):');
    if (!name) return;
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
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id && f.parentId !== id));
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Top Bar */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {currentFolder !== 'root' && (
            <button
              onClick={() => setCurrentFolder('root')}
              className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded-lg text-emerald-300 font-medium transition-colors"
            >
              ← Root
            </button>
          )}
          <span className="text-sm font-bold flex items-center gap-1.5">
            <Server size={16} className="text-blue-400" />
            <span>Nextcloud Files & Drive</span>
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1 border border-neutral-700">
          <Search size={14} className="text-neutral-400" />
          <input
            type="text"
            placeholder="Search files & APKs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none"
          />
        </div>

        {/* Add File */}
        <button
          onClick={handleCreateFile}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-colors shadow"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New File</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="hidden sm:flex flex-col w-52 bg-neutral-950/80 border-r border-neutral-800 p-3 gap-1">
          <button
            onClick={() => setCurrentFolder('root')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
              currentFolder === 'root' ? 'bg-blue-600/20 text-blue-300 font-semibold' : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <HardDrive size={15} />
            <span>Encrypted Local Drive</span>
          </button>
          <button
            onClick={() => setCurrentFolder('3')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
              currentFolder === '3' ? 'bg-blue-600/20 text-blue-300 font-semibold' : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Cloud size={15} />
            <span>Nextcloud Self-Hosted</span>
          </button>
          <button
            onClick={() => setCurrentFolder('2')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
              currentFolder === '2' ? 'bg-blue-600/20 text-blue-300 font-semibold' : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Folder size={15} />
            <span>Sideloaded APKs</span>
          </button>

          {/* Storage Meter */}
          <div className="mt-auto bg-neutral-900 p-3 rounded-2xl border border-neutral-800 text-[11px]">
            <div className="flex justify-between text-neutral-400 mb-1">
              <span>Sovereign Storage</span>
              <span>18.4 GB</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full w-[18%]" />
            </div>
            <div className="text-[10px] text-neutral-500 mt-1.5">
              493.6 GB free of 512 GB SSD
            </div>
          </div>
        </div>

        {/* Files Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {displayedFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-xs">
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.id);
                      }}
                      className="p-1 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
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
      </div>

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
            <div className="bg-neutral-950 p-3 rounded-2xl font-mono text-xs text-neutral-300 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-neutral-800">
              {previewFile.content || 'Binary data or Android package file.'}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button 
                onClick={() => setPreviewFile(null)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
