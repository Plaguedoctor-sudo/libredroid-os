import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-react';

export type ConfirmVariant = 'default' | 'destructive' | 'success' | 'info';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode; // extra content below message
}

const VARIANT_CFG: Record<ConfirmVariant, {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  confirmBtn: string;
}> = {
  default: {
    icon: <Info size={22} />,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    confirmBtn: 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40',
  },
  destructive: {
    icon: <Trash2 size={22} />,
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
    confirmBtn: 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40',
  },
  success: {
    icon: <CheckCircle size={22} />,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    confirmBtn: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40',
  },
  info: {
    icon: <AlertTriangle size={22} />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    confirmBtn: 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const cfg = VARIANT_CFG[variant];

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open) return null;

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div
      className={`fixed inset-0 z-[9800] flex items-center justify-center p-4 transition-all duration-300
        ${visible ? 'bg-black/70 backdrop-blur-sm opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      onClick={handleBackdrop}
    >
      <div
        className={`w-full max-w-xs bg-gray-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden
          transition-all duration-300 ${visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-6'}
        `}
      >
        {/* Header */}
        <div className="relative pt-6 pb-4 px-6 border-b border-white/8">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-400 hover:text-white transition-all"
            disabled={loading}
          >
            <X size={14} />
          </button>

          <div className="flex flex-col items-center text-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cfg.iconBg} ${cfg.iconColor} border border-white/8`}>
              {cfg.icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
              {message && (
                <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">{message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Optional extra content */}
        {children && (
          <div className="px-6 pt-4 text-sm text-neutral-300">
            {children}
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-4 flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`w-full py-3 rounded-2xl text-white font-semibold text-sm transition-all active:scale-95 shadow-lg
              ${cfg.confirmBtn} disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                Processing…
              </span>
            ) : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full py-2.5 rounded-2xl bg-white/8 hover:bg-white/12 border border-white/10 text-neutral-300 hover:text-white font-medium text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
