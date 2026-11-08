import React, { useState } from 'react';
import { 
  FolderLock, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Plus, 
  Eye, 
  EyeOff, 
  Image as ImageIcon, 
  FileText, 
  Camera, 
  Smartphone, 
  Key, 
  AlertTriangle, 
  Trash2,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useWindow } from '../../context/WindowContext';

interface SecureItem {
  id: string;
  name: string;
  type: 'photo' | 'document' | 'app';
  size: string;
  addedDate: string;
}

export const SecureFolderApp: React.FC = () => {
  const { openApp } = useWindow();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [disguiseMode, setDisguiseMode] = useState(false);
  const [autoLockTimeout, setAutoLockTimeout] = useState<'immediate' | '5min' | 'screen_off'>('screen_off');

  const [secureItems, setSecureItems] = useState<SecureItem[]>([
    { id: '1', name: 'Identity_Passport_Scan.enc', type: 'document', size: '2.4 MB', addedDate: 'Yesterday' },
    { id: '2', name: 'Private_Vault_Keys.asc', type: 'document', size: '12 KB', addedDate: 'Oct 28, 2026' },
    { id: '3', name: 'Personal_Photo_001.jpg', type: 'photo', size: '4.8 MB', addedDate: 'Today' },
    { id: '4', name: 'Banking & Crypto Wallet', type: 'app', size: '54 MB', addedDate: 'Installed' },
    { id: '5', name: 'Private Signal Messenger', type: 'app', size: '42 MB', addedDate: 'Installed' },
  ]);

  const correctPin = '1234';

  const handlePinSubmit = () => {
    if (pinInput === correctPin) {
      setIsUnlocked(true);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleAddItem = (type: 'photo' | 'document' | 'app') => {
    const name = type === 'photo' 
      ? `Secure_Photo_${Date.now().toString().slice(-4)}.jpg` 
      : type === 'document' 
        ? `Encrypted_Doc_${Date.now().toString().slice(-4)}.pdf` 
        : `Cloned_App_${Date.now().toString().slice(-4)}`;
    
    setSecureItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name,
        type,
        size: '1.8 MB',
        addedDate: 'Just now',
      },
    ]);
  };

  const handleDeleteItem = (id: string) => {
    setSecureItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Locked State Screen
  if (!isUnlocked) {
    return (
      <div className="w-full h-full bg-[#0e0f14] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-4 animate-bounce">
          <FolderLock size={32} className="text-white" />
        </div>

        <h2 className="text-xl font-bold tracking-tight mb-1">
          {disguiseMode ? 'Samsung Calculator Vault' : 'Samsung Secure Folder'}
        </h2>
        <p className="text-xs text-neutral-400 mb-6 text-center max-w-xs">
          Protected by Samsung Knox 3.9 Hardware Enclave & AES-256 Storage Encryption.
        </p>

        {/* PIN Input */}
        <div className="w-full max-w-xs space-y-4">
          <div className="flex gap-2">
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              placeholder="Enter Knox PIN (Default: 1234)"
              className="flex-1 bg-neutral-900 border border-neutral-750 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-center tracking-widest text-white focus:outline-none"
            />
            <button
              onClick={handlePinSubmit}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-lg transition-all"
            >
              Unlock
            </button>
          </div>

          {pinError && (
            <p className="text-xs text-rose-400 text-center font-medium animate-shake">
              Incorrect PIN. Knox safety cooldown active.
            </p>
          )}

          {/* Knox Warranty Bit Indicator */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-neutral-800 text-[11px] text-neutral-500">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Knox Warranty Bit: <strong className="text-emerald-400">0x0 (Valid / Untripped)</strong></span>
          </div>
        </div>
      </div>
    );
  }

  // Unlocked Secure Vault Dashboard
  return (
    <div className="w-full h-full bg-[#0c0d12] text-white flex flex-col overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#12131a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center shadow">
            <FolderLock size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              Secure Folder
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                Knox Vault
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400">Hardware-Isolated Sandbox</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDisguiseMode(!disguiseMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              disguiseMode 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
            }`}
            title="Disguise App Icon as Calculator"
          >
            {disguiseMode ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{disguiseMode ? 'Disguised' : 'Disguise Icon'}</span>
          </button>

          <button
            onClick={() => setIsUnlocked(false)}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-xs font-medium flex items-center gap-1.5"
          >
            <Lock size={13} />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* Quick Add Bar */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleAddItem('app')}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 transition-all text-xs font-medium text-blue-400 hover:border-blue-500/30 shadow"
          >
            <Plus size={15} />
            <span>Add / Clone Apps</span>
          </button>

          <button
            onClick={() => handleAddItem('photo')}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 transition-all text-xs font-medium text-emerald-400 hover:border-emerald-500/30 shadow"
          >
            <ImageIcon size={15} />
            <span>Add Photos</span>
          </button>

          <button
            onClick={() => handleAddItem('document')}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 transition-all text-xs font-medium text-amber-400 hover:border-amber-500/30 shadow"
          >
            <FileText size={15} />
            <span>Add Files</span>
          </button>
        </div>

        {/* Encrypted Items List */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 px-1">
            Encrypted Workspace ({secureItems.length} items)
          </h3>

          <div className="space-y-2">
            {secureItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 transition-colors group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === 'app'
                      ? 'bg-blue-500/20 text-blue-400'
                      : item.type === 'photo'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {item.type === 'app' && <Smartphone size={16} />}
                    {item.type === 'photo' && <ImageIcon size={16} />}
                    {item.type === 'document' && <FileText size={16} />}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-neutral-400">
                      {item.size} • Added {item.addedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.type === 'app' && (
                    <button
                      onClick={() => openApp('chats')}
                      className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-colors"
                    >
                      Launch
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/10"
                    title="Remove from Secure Folder"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Knox Security Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-indigo-950/20 to-neutral-900 border border-blue-500/20 text-xs text-neutral-300">
          <div className="flex items-center gap-2 text-blue-400 font-bold mb-1">
            <ShieldCheck size={16} />
            <span>Samsung Knox Hardware Security Active</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Data inside Secure Folder is encrypted with an ephemeral AES-256 key tied directly to the Exynos 1330 TrustZone hardware enclave. Even if device root is attempted, Knox hardware fuses protect your private files.
          </p>
        </div>

      </div>
    </div>
  );
};
