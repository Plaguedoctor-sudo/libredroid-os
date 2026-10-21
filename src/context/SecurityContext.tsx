import React, { createContext, useContext, useState, useEffect } from 'react';
import { OsDomainId } from '../services/multiOsHypervisor';
import { useSystem } from './SystemContext';

export interface PermissionPrompt {
  id: string;
  appId: string;
  appName: string;
  permission: 'camera' | 'microphone' | 'location' | 'storage' | 'clipboard';
  requestedBy: string;
}

export interface InterDomainClipboardTransfer {
  id: string;
  sourceDomain: OsDomainId;
  targetDomain: OsDomainId;
  content: string;
  charCount: number;
}

interface SecurityContextType {
  // Global Hardware Killswitches
  cameraKillswitch: boolean;
  setCameraKillswitch: (val: boolean | ((prev: boolean) => boolean)) => void;
  micKillswitch: boolean;
  setMicKillswitch: (val: boolean | ((prev: boolean) => boolean)) => void;
  locationKillswitch: boolean;
  setLocationKillswitch: (val: boolean | ((prev: boolean) => boolean)) => void;
  usbDataLock: boolean;
  setUsbDataLock: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Real-time Permission Portal
  activePrompt: PermissionPrompt | null;
  requestPermission: (prompt: Omit<PermissionPrompt, 'id'>) => Promise<'allowed' | 'mocked' | 'denied'>;
  resolvePermissionPrompt: (decision: 'allowed' | 'mocked' | 'denied') => void;

  // Inter-OS Qubes Clipboard Bridge
  pendingTransfer: InterDomainClipboardTransfer | null;
  requestInterDomainCopy: (sourceDomain: OsDomainId, targetDomain: OsDomainId, text: string) => Promise<boolean>;
  resolveClipboardTransfer: (allowed: boolean) => void;

  // Network Firewall
  blockedNetworkApps: string[];
  toggleAppNetworkAccess: (appId: string) => void;
  isAppNetworkAllowed: (appId: string) => boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification } = useSystem();

  // Hardware Killswitches
  const [cameraKillswitch, setCameraKillswitch] = useState(false);
  const [micKillswitch, setMicKillswitch] = useState(false);
  const [locationKillswitch, setLocationKillswitch] = useState(false);
  const [usbDataLock, setUsbDataLock] = useState(true);

  // Per-App Network Firewall (GrapheneOS style)
  const [blockedNetworkApps, setBlockedNetworkApps] = useState<string[]>([
    'calculator',
    'org.videolan.vlc',
  ]);

  // Permission Prompt State
  const [activePrompt, setActivePrompt] = useState<PermissionPrompt | null>(null);
  const [promptResolver, setPromptResolver] = useState<((decision: 'allowed' | 'mocked' | 'denied') => void) | null>(null);

  // Inter-OS Clipboard State
  const [pendingTransfer, setPendingTransfer] = useState<InterDomainClipboardTransfer | null>(null);
  const [transferResolver, setTransferResolver] = useState<((allowed: boolean) => void) | null>(null);

  const requestPermission = (prompt: Omit<PermissionPrompt, 'id'>): Promise<'allowed' | 'mocked' | 'denied'> => {
    return new Promise((resolve) => {
      const fullPrompt: PermissionPrompt = {
        ...prompt,
        id: Math.random().toString(36).substring(2, 9),
      };
      setActivePrompt(fullPrompt);
      setPromptResolver(() => resolve);
    });
  };

  const resolvePermissionPrompt = (decision: 'allowed' | 'mocked' | 'denied') => {
    if (promptResolver && activePrompt) {
      promptResolver(decision);
      const actionText = 
        decision === 'allowed' ? 'Access Granted' :
        decision === 'mocked' ? 'Spoofed Empty Sandbox Data Supplied' : 'Access Denied';

      addNotification({
        appId: activePrompt.appId,
        appName: 'XDG Security Portal',
        title: `${activePrompt.appName}: ${activePrompt.permission.toUpperCase()} ${actionText}`,
        body: `App was handled according to user's security decision (${decision}).`,
      });
    }
    setActivePrompt(null);
    setPromptResolver(null);
  };

  const requestInterDomainCopy = (sourceDomain: OsDomainId, targetDomain: OsDomainId, text: string): Promise<boolean> => {
    if (sourceDomain === targetDomain) return Promise.resolve(true);

    return new Promise((resolve) => {
      const transfer: InterDomainClipboardTransfer = {
        id: Math.random().toString(36).substring(2, 9),
        sourceDomain,
        targetDomain,
        content: text,
        charCount: text.length,
      };
      setPendingTransfer(transfer);
      setTransferResolver(() => resolve);
    });
  };

  const resolveClipboardTransfer = (allowed: boolean) => {
    if (transferResolver && pendingTransfer) {
      transferResolver(allowed);
      addNotification({
        appId: 'hypervisor',
        appName: 'qvm-copy Inter-OS Bridge',
        title: allowed ? 'Clipboard Transfer Authorized' : 'Cross-Domain Data Leak Blocked',
        body: allowed 
          ? `Transferred ${pendingTransfer.charCount} characters from [${pendingTransfer.sourceDomain}] to [${pendingTransfer.targetDomain}].`
          : `Blocked clipboard leak attempt from [${pendingTransfer.sourceDomain}].`,
      });
    }
    setPendingTransfer(null);
    setTransferResolver(null);
  };

  const toggleAppNetworkAccess = (appId: string) => {
    setBlockedNetworkApps((prev) => {
      const isBlocked = prev.includes(appId);
      const updated = isBlocked ? prev.filter((id) => id !== appId) : [...prev, appId];
      addNotification({
        appId,
        appName: 'Network Firewall',
        title: `${appId} Internet ${isBlocked ? 'Restored' : 'Blocked'}`,
        body: isBlocked ? 'App network namespace reconnected.' : 'App network namespace physically severed.',
      });
      return updated;
    });
  };

  const isAppNetworkAllowed = (appId: string) => !blockedNetworkApps.includes(appId);

  return (
    <SecurityContext.Provider
      value={{
        cameraKillswitch,
        setCameraKillswitch,
        micKillswitch,
        setMicKillswitch,
        locationKillswitch,
        setLocationKillswitch,
        usbDataLock,
        setUsbDataLock,
        activePrompt,
        requestPermission,
        resolvePermissionPrompt,
        pendingTransfer,
        requestInterDomainCopy,
        resolveClipboardTransfer,
        blockedNetworkApps,
        toggleAppNetworkAccess,
        isAppNetworkAllowed,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) throw new Error('useSecurity must be used within SecurityProvider');
  return context;
};
