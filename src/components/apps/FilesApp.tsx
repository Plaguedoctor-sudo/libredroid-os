import React, { useState } from 'react';
import { 
  Folder, 
  FileText, 
  Image, 
  Film, 
  Plus, 
  Trash2, 
  Cloud, 
  HardDrive, 
  Search, 
  Eye,
  X,
  DownloadCloud
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
    { id: '2', name: 'Downloads', isFolder: true, parentId: 'root', modified: 'Yesterday' },
    { id: '3', name: 'Cloud Drive', isFolder: true, parentId: 'root', modified: 'Just now' },
    { id: '4', name: 'System Logs', isFolder: true, parentId: 'root', modified: 'Oct 18, 2026' },
    { 
      id: '5', 
      name: 'Omni-Architecture-Overview.txt', 
      isFolder: false, 
      parentId: 'root', 
      size: '4.8 KB', 
      modified: 'Today',
      content: 'Omni Universal System Architecture:\n1. Adaptive UI Layer: switches fluidly between Phone, Tablet, Foldable & Desktop.\n2. HAL & Virtual Driver Bus: Abstracting hardware sensors, battery, display pipelines.\n3. Sandboxed Application Container: Running isolated web applications with universal APIs.\n4. Universal Identity: Unified account syncing across all devices in real time.'
    },
    { 
      id: '6', 
      name: 'User-Config.json', 
      isFolder: false, 
      parentId: 'root', 
      size: '1.2 KB', 
      modified: 'Oct 21, 2026',
      content: '{\n  "system": "OmniOS",\n  "version": "1.0-universal",\n  "theme": "material-you",\n  "formFactor": "adaptive"\n}'
    },
    { 
      id: '7', 
      name: 'Project-Roadmap.md', 
      isFolder: false, 
      parentId: '1', 
      size: '2.4 KB', 
      modified: 'Oct 19, 2026',
      content: '# Universal Android Roadmap\n- Phase 1: Core Shell & Responsive Viewports\n- Phase 2: Material 3 Theming & Monet Engine\n- Phase 3: Android App Sandbox\n- Phase 4: Hardware Multi-Monitor DeX Support'
    },
    { 
      id: '8', 
      name: 'Universal-Wallpaper.jpg', 
      isFolder: false, 
      parentId: '3', 
      size: '3.1 MB', 
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
    const name = prompt('Enter new file name (e.g. notes.txt):');
    if (!name) return;
    const newFile: VFile = {
      id: Math.random().toString(36).substring(2, 7),
      name,
      isFolder: false,
      parentId: currentFolder,
      size: '1.0 KB',
      modified: 'Just now',
      content: 'New universal file content created on ' + new Date().toLocaleString(),
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
              className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 rounded-lg text-purple-300 font-medium transition-colors"
            >
              ← Root
            </button>
          )}
          <span className="text-sm font-bold flex items-center gap-1.5">
            <HardDrive size={16} className="text-blue-400" />
            <span>Files & Drive</span>
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1 border border-neutral-700">
          <Search size={14} className="text-neutral-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-white focus:outline-none"
          />
        </div>

        {/* Add File */}
        <button
          onClick={handleCreateFile}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium transition-colors shadow"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New File</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop/Tablet) */}
        <div className="hidden sm:flex flex-col w-48 bg-neutral-950/80 border-r border-neutral-800 p-3 gap-1">
          <button
            onClick={() => setCurrentFolder('root')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
              currentFolder === 'root' ? 'bg-purple-600/20 text-purple-300 font-semibold' : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <HardDrive size={15} />
            <span>Internal Storage</span>
          </button>
          <button
            onClick={() => setCurrentFolder('3')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
              currentFolder === '3' ? 'bg-purple-600/20 text-purple-300 font-semibold' : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Cloud size={15} />
            <span>Google Drive</span>
          </button>

          {/* Storage Meter */}
          <div className="mt-auto bg-neutral-900 p-3 rounded-2xl border border-neutral-800 text-[11px]">
            <div className="flex justify-between text-neutral-400 mb-1">
              <span>Cloud Storage</span>
              <span>{account.storageUsedGb} GB</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${(account.storageUsedGb / account.storageTotalGb) * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-neutral-500 mt-1.5">
              {account.storageTotalGb - account.storageUsedGb} GB free of {account.storageTotalGb} GB
            </div>
          </div>
        </div>

        {/* Files Grid / List */}
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
              {previewFile.content || 'Binary / media file preview not available.'}
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
