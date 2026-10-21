import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Camera, 
  Mic, 
  MapPin, 
  Folder, 
  Clipboard, 
  Share2, 
  X, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { MULTI_OS_DOMAINS } from '../../services/multiOsHypervisor';

export const SecurityDialogOverlay: React.FC = () => {
  const { 
    activePrompt, 
    resolvePermissionPrompt, 
    pendingTransfer, 
    resolveClipboardTransfer 
  } = useSecurity();

  const getPermissionIcon = (perm: string) => {
    switch (perm) {
      case 'camera': return <Camera size={28} className="text-rose-400" />;
      case 'microphone': return <Mic size={28} className="text-amber-400" />;
      case 'location': return <MapPin size={28} className="text-blue-400" />;
      case 'clipboard': return <Clipboard size={28} className="text-purple-400" />;
      default: return <Folder size={28} className="text-emerald-400" />;
    }
  };

  return (
    <>
      {/* 1. XDG Portal / Android Security Permission Prompt Modal */}
      {activePrompt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shadow">
              {getPermissionIcon(activePrompt.permission)}
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                Allow <span className="text-emerald-400">{activePrompt.appName}</span> to access your {activePrompt.permission}?
              </h3>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                Mediated by LibreDroid XDG Security Portal. You can grant real hardware access or provide safe spoofed sandbox data to bypass permission hostage-taking.
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <button
                onClick={() => resolvePermissionPrompt('mocked')}
                className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow"
              >
                <ShieldCheck size={14} />
                <span>Supply Spoofed Mock Data (Recommended)</span>
              </button>

              <button
                onClick={() => resolvePermissionPrompt('allowed')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow"
              >
                <Check size={14} />
                <span>Allow Real Hardware Access</span>
              </button>

              <button
                onClick={() => resolvePermissionPrompt('denied')}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl text-xs font-medium transition-colors"
              >
                Deny Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Qubes OS qvm-copy Inter-Domain Clipboard Authorization Banner */}
      {pendingTransfer && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-slide-up select-none">
          <div className="bg-neutral-900/95 border-2 border-purple-500 rounded-3xl p-4 shadow-2xl backdrop-blur-xl flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Share2 size={15} />
                <span>qvm-copy Inter-OS Clipboard Authorization</span>
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded font-mono">
                {pendingTransfer.charCount} chars
              </span>
            </div>

            <p className="text-xs text-neutral-300">
              Transfer payload from domain <span className="font-mono text-purple-400 font-bold">[{pendingTransfer.sourceDomain}]</span> to domain <span className="font-mono text-emerald-400 font-bold">[{pendingTransfer.targetDomain}]</span>?
            </p>

            <div className="p-2 bg-neutral-950 rounded-xl text-[11px] font-mono text-neutral-400 truncate border border-neutral-800">
              "{pendingTransfer.content}"
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => resolveClipboardTransfer(false)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium transition-colors"
              >
                Block Leak
              </button>
              <button
                onClick={() => resolveClipboardTransfer(true)}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                Authorize Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
