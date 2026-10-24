import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, Folder } from 'lucide-react';
import { SYSTEM_APPS } from '../../constants/apps';
import { AppIcon } from '../common/AppIcon';
import { AppId } from '../../types/apps';

export interface HomeAppFolder {
  id: string;
  name: string;
  color: string;
  appIds: string[];
}

interface AppFolderModalProps {
  folder: HomeAppFolder;
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (appId: string) => void;
  onUpdateFolder: (updated: HomeAppFolder) => void;
  onDeleteFolder: (folderId: string) => void;
}

export const AppFolderModal: React.FC<AppFolderModalProps> = ({
  folder,
  isOpen,
  onClose,
  onLaunchApp,
  onUpdateFolder,
  onDeleteFolder,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [folderName, setFolderName] = useState(folder.name);
  const [isAddingApps, setIsAddingApps] = useState(false);

  if (!isOpen) return null;

  const containedApps = folder.appIds
    .map(id => SYSTEM_APPS.find(app => app.id === id))
    .filter(Boolean) as typeof SYSTEM_APPS;

  const availableToAdd = SYSTEM_APPS.filter(
    app => !folder.appIds.includes(app.id)
  );

  const handleSaveTitle = () => {
    if (folderName.trim()) {
      onUpdateFolder({ ...folder, name: folderName.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleRemoveApp = (appId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedIds = folder.appIds.filter(id => id !== appId);
    onUpdateFolder({ ...folder, appIds: updatedIds });
  };

  const handleAddApp = (appId: string) => {
    const updatedIds = [...folder.appIds, appId];
    onUpdateFolder({ ...folder, appIds: updatedIds });
    setIsAddingApps(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm sm:max-w-md bg-neutral-900/90 border border-neutral-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl z-10 flex flex-col max-h-[85vh]">
        {/* Header with Title and Close */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2 flex-1 mr-2">
            <Folder size={20} className="text-emerald-400 shrink-0" />
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  className="bg-neutral-950 border border-emerald-500 rounded-xl px-2.5 py-1 text-sm text-white font-bold w-full focus:outline-none"
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                <h3 className="font-extrabold text-base text-white tracking-wide">{folder.name}</h3>
                <Edit2 size={13} className="text-neutral-500 group-hover:text-neutral-300 transition-colors" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onDeleteFolder(folder.id)}
              className="p-1.5 rounded-xl hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-all"
              title="Dissolve Folder"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Apps Grid */}
        {!isAddingApps ? (
          <div className="flex-1 overflow-y-auto py-5">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 justify-items-center">
              {containedApps.map(app => (
                <div key={app.id} className="relative group flex flex-col items-center">
                  <button
                    onClick={() => {
                      onLaunchApp(app.id);
                      onClose();
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 p-1 transition-transform active:scale-90"
                  >
                    <div className="group-hover:scale-105 transition-transform pointer-events-none">
                      <AppIcon appId={app.id} size="md" badge={app.badge} />
                    </div>
                    <span className="text-xs font-medium text-white text-center max-w-[80px] truncate">
                      {app.name}
                    </span>
                  </button>

                  {/* Remove App Badge */}
                  <button
                    onClick={(e) => handleRemoveApp(app.id, e)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow-sm"
                    title={`Remove ${app.name} from folder`}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}

              {/* Add Apps Button inside grid */}
              <button
                onClick={() => setIsAddingApps(true)}
                className="flex flex-col items-center justify-center gap-1.5 p-1 group transition-transform active:scale-95"
              >
                <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-neutral-700 group-hover:border-emerald-500 flex items-center justify-center text-neutral-400 group-hover:text-emerald-400 transition-colors">
                  <Plus size={20} />
                </div>
                <span className="text-xs text-neutral-400 group-hover:text-white font-medium">Add App</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sub-picker: Add Apps to Folder */
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Select App to Add
              </span>
              <button
                onClick={() => setIsAddingApps(false)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
              {availableToAdd.map(app => (
                <div
                  key={app.id}
                  onClick={() => handleAddApp(app.id)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <AppIcon appId={app.id} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-white">{app.name}</div>
                      <div className="text-[10px] text-neutral-400">{app.author || 'System FOSS'}</div>
                    </div>
                  </div>
                  <Plus size={16} className="text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-500 flex items-center justify-between">
          <span>{containedApps.length} applications in folder</span>
          <span>Tap to launch</span>
        </div>
      </div>
    </div>
  );
};
