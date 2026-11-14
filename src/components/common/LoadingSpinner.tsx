import React from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'spinner' | 'dots' | 'pulse' | 'skeleton';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
  className?: string;
  color?: string; // tailwind color class e.g. "text-emerald-400"
}

const SIZE_MAP: Record<SpinnerSize, { ring: string; dot: string; text: string }> = {
  xs: { ring: 'w-4 h-4 border-2', dot: 'w-1 h-1', text: 'text-[10px]' },
  sm: { ring: 'w-6 h-6 border-2', dot: 'w-1.5 h-1.5', text: 'text-xs' },
  md: { ring: 'w-9 h-9 border-2', dot: 'w-2 h-2', text: 'text-sm' },
  lg: { ring: 'w-14 h-14 border-[3px]', dot: 'w-2.5 h-2.5', text: 'text-base' },
  xl: { ring: 'w-20 h-20 border-4', dot: 'w-3 h-3', text: 'text-lg' },
};

const SpinnerRing: React.FC<{ size: SpinnerSize; color: string }> = ({ size, color }) => {
  const s = SIZE_MAP[size];
  return (
    <span
      className={`inline-block rounded-full border-current border-t-transparent animate-spin ${s.ring} ${color}`}
      role="status"
    />
  );
};

const SpinnerDots: React.FC<{ size: SpinnerSize; color: string }> = ({ size, color }) => {
  const s = SIZE_MAP[size];
  return (
    <div className="flex items-center gap-1.5" role="status">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`inline-block rounded-full bg-current animate-bounce ${s.dot} ${color}`}
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </div>
  );
};

const SpinnerPulse: React.FC<{ size: SpinnerSize; color: string }> = ({ size, color }) => {
  const s = SIZE_MAP[size];
  return (
    <span
      className={`inline-block rounded-full bg-current animate-ping ${s.ring.replace('border-2', '').replace('border-[3px]', '').replace('border-4', '')} ${color}`}
      role="status"
    />
  );
};

// --- Skeleton Loader ---
interface SkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 3, avatar = false }) => (
  <div className={`animate-pulse flex gap-3 w-full ${className}`} role="status" aria-label="Loading...">
    {avatar && (
      <div className="shrink-0 w-10 h-10 rounded-full bg-gray-700/60" />
    )}
    <div className="flex-1 space-y-2 py-1">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-gray-700/60 rounded-full"
          style={{ width: i === lines - 1 ? '60%' : i % 2 === 0 ? '100%' : '85%' }}
        />
      ))}
    </div>
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-gray-800 border border-white/5 p-4 space-y-3 ${className}`} role="status">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gray-700/60 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-700/60 rounded-full w-3/4" />
        <div className="h-2.5 bg-gray-700/60 rounded-full w-1/2" />
      </div>
    </div>
    <div className="space-y-1.5">
      <div className="h-2.5 bg-gray-700/60 rounded-full" />
      <div className="h-2.5 bg-gray-700/60 rounded-full w-5/6" />
      <div className="h-2.5 bg-gray-700/60 rounded-full w-4/6" />
    </div>
  </div>
);

// --- Main LoadingSpinner ---
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  label,
  className = '',
  color = 'text-emerald-400',
}) => {
  const s = SIZE_MAP[size];

  const renderSpinner = () => {
    switch (variant) {
      case 'dots': return <SpinnerDots size={size} color={color} />;
      case 'pulse': return <SpinnerPulse size={size} color={color} />;
      case 'skeleton': return <Skeleton />;
      default: return <SpinnerRing size={size} color={color} />;
    }
  };

  if (variant === 'skeleton') {
    return <Skeleton className={className} />;
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {renderSpinner()}
      {label && (
        <p className={`font-medium text-neutral-400 animate-pulse ${s.text}`}>{label}</p>
      )}
    </div>
  );
};

// --- Full-screen loading overlay ---
interface LoadingOverlayProps {
  visible: boolean;
  label?: string;
  size?: SpinnerSize;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  label = 'Loading…',
  size = 'lg',
}) => {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm">
      <LoadingSpinner size={size} label={label} />
    </div>
  );
};

export default LoadingSpinner;
