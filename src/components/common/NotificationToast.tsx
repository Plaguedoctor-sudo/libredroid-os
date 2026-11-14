import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Info, AlertTriangle, AlertOctagon, ChevronRight } from 'lucide-react';

export type ToastPriority = 'info' | 'warning' | 'critical';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  id: string;
  title: string;
  message?: string;
  priority?: ToastPriority;
  duration?: number; // ms, 0 = persistent
  actions?: ToastAction[];
  onDismiss: (id: string) => void;
}

const PRIORITY_CONFIG: Record<ToastPriority, {
  icon: React.ReactNode;
  bar: string;
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
}> = {
  info: {
    icon: <Info size={16} />,
    bar: 'bg-blue-500',
    bg: 'bg-gray-800',
    border: 'border-blue-500/30',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    bar: 'bg-amber-500',
    bg: 'bg-gray-800',
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
  },
  critical: {
    icon: <AlertOctagon size={16} />,
    bar: 'bg-rose-500',
    bg: 'bg-gray-900',
    border: 'border-rose-500/40',
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
  },
};

export const NotificationToast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  priority = 'info',
  duration = 4000,
  actions = [],
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingRef = useRef<number>(duration);
  const cfg = PRIORITY_CONFIG[priority];

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  useEffect(() => {
    // mount animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (duration === 0) return;
    const tick = 50;
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.max(0, 100 - (elapsed / remainingRef.current) * 100);
      setProgress(pct);
      if (pct <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        dismiss();
      }
    }, tick);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [duration, dismiss]);

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      remainingRef.current = remainingRef.current - (Date.now() - startTimeRef.current);
    }
  };

  const resumeTimer = () => {
    if (duration === 0) return;
    startTimeRef.current = Date.now();
    const tick = 50;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.max(0, 100 - (elapsed / remainingRef.current) * 100);
      setProgress(pct);
      if (pct <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        dismiss();
      }
    }, tick);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
    pauseTimer();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    setSwipeX(dx);
  };

  const handleTouchEnd = () => {
    if (Math.abs(swipeX) > 100) {
      dismiss();
    } else {
      setSwipeX(0);
      setIsSwiping(false);
      resumeTimer();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className={`relative w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden select-none transition-all duration-300 cursor-pointer
        ${cfg.bg} ${cfg.border}
        ${visible && !exiting ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        ${exiting ? 'opacity-0 translate-x-8 scale-95' : ''}
      `}
      style={{
        transform: `translateX(${swipeX}px) ${exiting ? 'translateX(60px) scale(0.95)' : ''}`,
        transition: isSwiping ? 'transform 0.05s linear' : 'transform 0.3s ease, opacity 0.3s ease',
        opacity: isSwiping ? Math.max(0.3, 1 - Math.abs(swipeX) / 200) : undefined,
      }}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Priority bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar}`} />

      <div className="pl-3 pr-3 py-3 flex items-start gap-3">
        {/* Icon */}
        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${cfg.iconBg} ${cfg.iconColor}`}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight truncate">{title}</p>
          {message && (
            <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed line-clamp-2">{message}</p>
          )}
          {actions.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); action.onClick(); dismiss(); }}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all active:scale-95
                    ${i === 0 ? `${cfg.iconColor} bg-white/10 hover:bg-white/20` : 'text-neutral-400 hover:text-white hover:bg-white/10'}
                  `}
                >
                  {action.label}
                  {i === 0 && <ChevronRight size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          className="shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-400 hover:text-white transition-all active:scale-90"
        >
          <X size={12} />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
          <div
            className={`h-full ${cfg.bar} transition-none`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// --- Toast Container / Manager ---

export interface ToastItem extends Omit<ToastProps, 'onDismiss'> {}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  position = 'top-right',
}) => {
  const posClass: Record<string, string> = {
    'top-right': 'top-4 right-4 items-end',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  };

  return (
    <div className={`fixed z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none ${posClass[position]}`}>
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full">
          <NotificationToast {...toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
