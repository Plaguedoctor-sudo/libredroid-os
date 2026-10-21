import React from 'react';

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
  | 'photos';

export interface AppMetadata {
  id: AppId;
  name: string;
  icon: string;
  color: string;
  badge?: number;
  category: 'system' | 'productivity' | 'media' | 'utility';
  defaultWidth?: number;
  defaultHeight?: number;
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
}
