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
  Box, 
  HardDrive, 
  Cpu, 
  ShieldCheck, 
  ShieldAlert, 
  Lock,
  Film, 
  Tv, 
  MapPin, 
  MessageSquare, 
  Mail, 
  Layers, 
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

const ICON_MAP: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
  linux_sandbox: {
    icon: Box,
    bg: 'bg-gradient-to-tr from-cyan-600 via-teal-700 to-blue-800',
    color: 'text-white',
  },
  security: {
    icon: Lock,
    bg: 'bg-gradient-to-tr from-emerald-600 via-teal-700 to-cyan-800',
    color: 'text-white',
  },
  predatory_shield: {
    icon: ShieldAlert,
    bg: 'bg-gradient-to-tr from-rose-500 via-pink-600 to-red-700',
    color: 'text-white',
  },
  guardian: {
    icon: ShieldCheck,
    bg: 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-700',
    color: 'text-white',
  },
  browser: {
    icon: Compass,
    bg: 'bg-gradient-to-tr from-amber-500 to-orange-600',
    color: 'text-white',
  },
  files: {
    icon: Folder,
    bg: 'bg-gradient-to-tr from-blue-600 to-sky-500',
    color: 'text-white',
  },
  notes: {
    icon: FileText,
    bg: 'bg-gradient-to-tr from-indigo-600 to-blue-600',
    color: 'text-white',
  },
  camera: {
    icon: Camera,
    bg: 'bg-gradient-to-tr from-rose-500 to-red-600',
    color: 'text-white',
  },
  terminal: {
    icon: Terminal,
    bg: 'bg-gradient-to-tr from-neutral-800 to-black border border-neutral-700',
    color: 'text-emerald-400',
  },
  calculator: {
    icon: Calculator,
    bg: 'bg-gradient-to-tr from-cyan-600 to-teal-600',
    color: 'text-white',
  },
  store: {
    icon: ShoppingBag,
    bg: 'bg-gradient-to-tr from-blue-500 via-teal-500 to-emerald-500',
    color: 'text-white',
  },
  settings: {
    icon: Settings,
    bg: 'bg-gradient-to-tr from-neutral-700 to-neutral-900 border border-neutral-600',
    color: 'text-gray-100',
  },
  clock: {
    icon: Clock,
    bg: 'bg-gradient-to-tr from-indigo-500 to-violet-600',
    color: 'text-white',
  },
  photos: {
    icon: Image,
    bg: 'bg-gradient-to-tr from-teal-500 to-emerald-600',
    color: 'text-white',
  },
  hardware: {
    icon: Cpu,
    bg: 'bg-gradient-to-tr from-cyan-500 to-blue-700',
    color: 'text-white',
  },
  apk_installer: {
    icon: Box,
    bg: 'bg-gradient-to-tr from-emerald-500 to-teal-700',
    color: 'text-white',
  },
  system_installer: {
    icon: HardDrive,
    bg: 'bg-gradient-to-tr from-purple-600 to-indigo-800',
    color: 'text-white',
  },
  'org.videolan.vlc': {
    icon: Film,
    bg: 'bg-gradient-to-tr from-orange-500 to-amber-600',
    color: 'text-white',
  },
  'org.schabi.newpipe': {
    icon: Tv,
    bg: 'bg-gradient-to-tr from-red-600 to-rose-700',
    color: 'text-white',
  },
  'net.osmand.plus': {
    icon: MapPin,
    bg: 'bg-gradient-to-tr from-amber-500 to-yellow-600',
    color: 'text-white',
  },
  'im.vector.app': {
    icon: MessageSquare,
    bg: 'bg-gradient-to-tr from-emerald-600 to-teal-700',
    color: 'text-white',
  },
  'com.fsck.k9': {
    icon: Mail,
    bg: 'bg-gradient-to-tr from-blue-700 to-indigo-800',
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
    icon: Layers,
    bg: 'bg-gradient-to-tr from-purple-700 to-indigo-800',
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
