import React, { useState, useEffect } from 'react';
import {
  Camera,
  Mic,
  Users,
  MapPin,
  Nfc,
  HardDrive,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';

export type PermissionType = 'camera' | 'microphone' | 'contacts' | 'location' | 'nfc' | 'storage';
export type PermissionResult = 'granted' | 'denied' | 'ask_again';

export interface PermissionRequest {
  permission: PermissionType;
  appName: string;
  appIcon?: string;
  rationale?: string; // Why the app needs this
  isSecondRequest?: boolean; // show "don't ask again" on second attempt
}

interface PermissionDialogProps extends PermissionRequest {
  onResult: (result: PermissionResult) => void;
}

const PERMISSION_META: Record<PermissionType, {
  icon: React.ReactNode;
  label: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskColor: string;
}> = {
  camera: {
    icon: <Camera size={28} />,
    label: 'Camera',
    description: 'Take photos and record video',
    riskLevel: 'medium',
    riskColor: 'text-amber-400',
  },
  microphone: {
    icon: <Mic size={28} />,
    label: 'Microphone',
    description: 'Record audio and listen for voice commands',
    riskLevel: 'medium',
    riskColor: 'text-amber-400',
  },
  contacts: {
    icon: <Users size={28} />,
    label: 'Contacts',
    description: 'Read and modify your contact list',
    riskLevel: 'high',
    riskColor: 'text-rose-400',
  },
  location: {
    icon: <MapPin size={28} />,
    label: 'Location',
    description: 'Access your precise GPS location',
    riskLevel: 'high',
    riskColor: 'text-rose-400',
  },
  nfc: {
    icon: <Nfc size={28} />,
    label: 'NFC',
    description: 'Read and write NFC tags and make payments',
    riskLevel: 'medium',
    riskColor: 'text-amber-400',
  },
  storage: {
    icon: <HardDrive size={28} />,
    label: 'Storage',
    description: 'Read and write files on your device',
    riskLevel: 'low',
    riskColor: 'text-blue-400',
  },
};

const RISK_LABELS: Record<string, string> = {
  low: 'Low risk',
  medium: 'Moderate risk',
  high: 'High risk — review carefully',
};

export const PermissionDialog: React.FC<PermissionDialogProps> = ({
  permission,
  appName,
  appIcon,
  rationale,
  isSecondRequest = false,
  onResult,
}) => {
  const [visible, setVisible] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const meta = PERMISSION_META[permission];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handle = (result: PermissionResult) => {
    setVisible(false);
    setTimeout(() => {
      if (result === 'denied' && dontAskAgain) {
        onResult('denied');
      } else {
        onResult(result);
      }
    }, 200);
  };

  return (
    <div className={`fixed inset-0 z-[9900] flex items-center justify-center p-4 transition-all duration-300
      ${visible ? 'bg-black/70 backdrop-blur-sm opacity-100' : 'opacity-0 pointer-events-none'}
    `}>
      <div className={`w-full max-w-xs bg-gray-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden
        transition-all duration-300 ${visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}
      `}>
        {/* Header */}
        <div className="relative pt-6 pb-4 px-6 border-b border-white/10 text-center">
          <button
            onClick={() => handle('denied')}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-400 hover:text-white transition-all"
          >
            <X size={14} />
          </button>

          {/* App Icon + Permission Icon */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-800 border border-white/10 flex items-center justify-center text-white overflow-hidden">
              {appIcon
                ? <img src={appIcon} alt={appName} className="w-full h-full object-cover" />
                : <span className="text-lg font-bold">{appName[0]}</span>
              }
            </div>
            <div className="text-neutral-400 font-bold text-lg">+</div>
            <div className={`w-12 h-12 rounded-2xl bg-gray-800 border border-white/10 flex items-center justify-center ${meta.riskColor}`}>
              {meta.icon}
            </div>
          </div>

          <h2 className="text-base font-bold text-white leading-tight">
            Allow <span className="text-emerald-400">{appName}</span> to access {meta.label}?
          </h2>
          <p className="text-xs text-neutral-400 mt-1">{meta.description}</p>

          {/* Risk badge */}
          <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium ${meta.riskColor}`}>
            <ShieldCheck size={11} />
            {RISK_LABELS[meta.riskLevel]}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3">
          {/* Rationale */}
          {rationale && (
            <div className="p-3 rounded-2xl bg-gray-800 border border-white/5 text-xs text-neutral-300 leading-relaxed">
              <span className="font-semibold text-white">Why: </span>{rationale}
            </div>
          )}

          {/* Second request warning */}
          {isSecondRequest && (
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200 leading-relaxed">
                You previously denied this permission. The app is requesting again.
              </p>
            </div>
          )}

          {/* LibreDroid privacy note */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-1"
          >
            <span>LibreDroid privacy protections apply</span>
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showDetails && (
            <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-neutral-400 leading-relaxed space-y-1">
              <p>• All permission access is logged in <span className="text-emerald-400">Privacy Dashboard</span></p>
              <p>• You can revoke this at any time in Settings → Apps → {appName}</p>
              <p>• No data leaves the device without explicit sync consent</p>
              <p>• Access is sandboxed and cannot be shared between apps</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2">
          {/* Don't ask again (second request) */}
          {isSecondRequest && (
            <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
                className="accent-rose-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-neutral-400">Don't ask again</span>
            </label>
          )}

          <button
            onClick={() => handle('granted')}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-900/40"
          >
            Allow
          </button>

          {!isSecondRequest && (
            <button
              onClick={() => handle('ask_again')}
              className="w-full py-2.5 rounded-2xl bg-white/8 hover:bg-white/12 text-neutral-200 font-medium text-sm transition-all active:scale-95 border border-white/10"
            >
              Only This Time
            </button>
          )}

          <button
            onClick={() => handle('denied')}
            className="w-full py-2.5 rounded-2xl hover:bg-white/8 text-neutral-400 hover:text-white font-medium text-sm transition-all active:scale-95"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionDialog;
