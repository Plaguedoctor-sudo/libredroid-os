import React from 'react';
import { 
  Compass, 
  Folder, 
  FileText, 
  Camera, 
  Terminal, 
  Calculator, 
  ShoppingBag, 
  Settings, 
  Clock, 
  Image, 
  LucideIcon 
} from 'lucide-react';
import { AppId } from '../../types/apps';

interface AppIconProps {
  appId: AppId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
  badge?: number;
}

const ICON_MAP: Record<AppId, { icon: LucideIcon; bg: string; color: string }> = {
  browser: {
    icon: Compass,
    bg: 'bg-gradient-to-tr from-blue-600 via-yellow-500 to-green-500',
    color: 'text-white',
  },
  files: {
    icon: Folder,
    bg: 'bg-gradient-to-tr from-blue-600 to-sky-400',
    color: 'text-white',
  },
  notes: {
    icon: FileText,
    bg: 'bg-gradient-to-tr from-amber-400 to-orange-500',
    color: 'text-white',
  },
  camera: {
    icon: Camera,
    bg: 'bg-gradient-to-tr from-rose-500 to-pink-600',
    color: 'text-white',
  },
  terminal: {
    icon: Terminal,
    bg: 'bg-gradient-to-tr from-neutral-800 to-black border border-neutral-700',
    color: 'text-emerald-400',
  },
  calculator: {
    icon: Calculator,
    bg: 'bg-gradient-to-tr from-teal-500 to-emerald-600',
    color: 'text-white',
  },
  store: {
    icon: ShoppingBag,
    bg: 'bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600',
    color: 'text-white',
  },
  settings: {
    icon: Settings,
    bg: 'bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-zinc-600',
    color: 'text-gray-100',
  },
  clock: {
    icon: Clock,
    bg: 'bg-gradient-to-tr from-indigo-500 to-violet-600',
    color: 'text-white',
  },
  photos: {
    icon: Image,
    bg: 'bg-gradient-to-tr from-red-500 via-amber-400 to-emerald-400',
    color: 'text-white',
  },
};

export const AppIcon: React.FC<AppIconProps> = ({
  appId,
  size = 'md',
  className = '',
  badge,
}) => {
  const iconConfig = ICON_MAP[appId] || {
    icon: Compass,
    bg: 'bg-blue-600',
    color: 'text-white',
  };
  const Icon = iconConfig.icon;

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-12 h-12 rounded-2xl',
    lg: 'w-16 h-16 rounded-[1.25rem]',
    xl: 'w-20 h-20 rounded-[1.5rem]',
  };

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 40,
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 shadow-lg ${sizeClasses[size]} ${iconConfig.bg} ${className} transition-transform active:scale-95 duration-150`}>
      <Icon size={iconSizes[size]} className={iconConfig.color} />
      {badge && badge > 0 ? (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1c1b1f] shadow">
          {badge}
        </span>
      ) : null}
    </div>
  );
};
