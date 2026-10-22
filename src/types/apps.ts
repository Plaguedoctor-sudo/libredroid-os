import React from 'react';
import { OsDomainId } from '../services/multiOsHypervisor';

export type AppId = 
  | 'browser'
  | 'files'
  | 'settings'
  | 'camera'
  | 'terminal'
  | 'calculator'
  | 'notes'
  | 'store'
  | 'clock'
  | 'photos'
  | 'hardware'
  | 'guardian'
  | 'predatory_shield'
  | 'security'
  | 'linux_sandbox'
  | 'hypervisor'
  | 'apk_installer'
  | 'darwin_bridge'
  | 'system_installer'
  | 'persona_engine'
  | 'phone'
  | 'messages'
  | string; // Dynamic sideloaded APKs

export interface AppMetadata {
  id: AppId;
  name: string;
  icon: string;
  color: string;
  badge?: number;
  category: 'system' | 'productivity' | 'media' | 'utility' | 'foss';
  isApk?: boolean;
  packageName?: string;
  version?: string;
  author?: string;
  permissions?: string[];
  defaultWidth?: number;
  defaultHeight?: number;
  defaultDomain?: OsDomainId;
}

export interface WindowInstance {
  id: string;
  appId: AppId;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  osDomain?: OsDomainId;
}
