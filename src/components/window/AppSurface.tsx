import React from 'react';
import { AppId } from '../../types/apps';
import { DomainStream, normalizeDomain } from '../common/DomainStream';

// Native app components
import { BrowserApp } from '../apps/BrowserApp';
import { FilesApp } from '../apps/FilesApp';
import { SettingsApp } from '../apps/SettingsApp';
import { CameraApp } from '../apps/CameraApp';
import { TerminalApp } from '../apps/TerminalApp';
import { CalculatorApp } from '../apps/CalculatorApp';
import { NotesApp } from '../apps/NotesApp';
import { FDroidApp } from '../apps/FDroidApp';
import { ClockApp } from '../apps/ClockApp';
import { PhotosApp } from '../apps/PhotosApp';
import { HardwareManagerApp } from '../apps/HardwareManagerApp';
import { AntiMonopolyGuardianApp } from '../apps/AntiMonopolyGuardianApp';
import { AntiPredatoryShieldApp } from '../apps/AntiPredatoryShieldApp';
import { SecurityGuardrailsApp } from '../apps/SecurityGuardrailsApp';
import { LinuxSandboxApp } from '../apps/LinuxSandboxApp';
import { MultiOsHypervisorApp } from '../apps/MultiOsHypervisorApp';
import { ApkInstallerApp } from '../apps/ApkInstallerApp';
import { AppleDarwinBridgeApp } from '../apps/AppleDarwinBridgeApp';
import { SystemInstallerApp } from '../apps/SystemInstallerApp';
import { UniversalPersonaApp } from '../apps/UniversalPersonaApp';
import { PhoneApp } from '../apps/PhoneApp';
import { MessagesApp } from '../apps/MessagesApp';
import { UniversalAiApp } from '../apps/UniversalAiApp';
import { ChatsApp } from '../apps/ChatsApp';
import { PlayStoreApp } from '../apps/PlayStoreApp';
import { TaskManagerApp } from '../apps/TaskManagerApp';
import { KeystoreApp } from '../apps/KeystoreApp';
import { AudioControllerApp } from '../apps/AudioControllerApp';
import { Network5gApp } from '../apps/Network5gApp';
import { AppleAppRunner } from '../apps/AppleAppRunner';
import { WaydroidAppRunner } from '../apps/WaydroidAppRunner';
import { getInstalledAppleApps } from '../../services/appleAppManager';

const NATIVE: Record<string, React.FC<any>> = {
  browser: BrowserApp,
  files: FilesApp,
  settings: SettingsApp,
  camera: CameraApp,
  terminal: TerminalApp,
  calculator: CalculatorApp,
  notes: NotesApp,
  store: FDroidApp,
  play_store: PlayStoreApp,
  clock: ClockApp,
  photos: PhotosApp,
  hardware: HardwareManagerApp,
  guardian: AntiMonopolyGuardianApp,
  predatory_shield: AntiPredatoryShieldApp,
  security: SecurityGuardrailsApp,
  linux_sandbox: LinuxSandboxApp,
  hypervisor: MultiOsHypervisorApp,
  apk_installer: ApkInstallerApp,
  darwin_bridge: AppleDarwinBridgeApp,
  system_installer: SystemInstallerApp,
  persona_engine: UniversalPersonaApp,
  phone: PhoneApp,
  messages: MessagesApp,
  universal_ai: UniversalAiApp,
  chats: ChatsApp,
  task_manager: TaskManagerApp,
  keystore: KeystoreApp,
  audio_mixer: AudioControllerApp,
  network_5g: Network5gApp,
};

interface SurfaceDescriptor {
  mode: 'native' | 'stream';
  render?: React.FC<any>;
  domain?: string;
  slot?: number;
  dedicated?: boolean;
}

function surfaceFor(appId: AppId, title?: string, isStreamingDomain?: boolean, domain?: string): SurfaceDescriptor {
  if (isStreamingDomain || appId.startsWith('domain_stream_')) {
    const rawDom = appId.startsWith('domain_stream_') ? appId.replace('domain_stream_', '') : domain;
    return {
      mode: 'stream',
      domain: rawDom || 'workstation-debian',
      slot: 0,
      dedicated: true,
    };
  }

  if (NATIVE[appId]) {
    return {
      mode: 'native',
      render: NATIVE[appId],
    };
  }

  const isApple = domain === 'darwin-apple' ||
    getInstalledAppleApps().some((a) => a.id === appId || a.bundleId === appId) ||
    appId.startsWith('com.apple.') ||
    appId.includes('.ios');

  if (isApple) {
    return {
      mode: 'native',
      render: (props: any) => <AppleAppRunner appId={appId} title={title || 'Apple App'} {...props} />,
    };
  }

  return {
    mode: 'native',
    render: (props: any) => <WaydroidAppRunner appId={appId} title={title || 'Android App'} {...props} />,
  };
}

interface Props {
  appId: AppId;
  title: string;
  domain?: string;
  params?: Record<string, unknown>;
  paramSeq?: number;
  isStreamingDomain?: boolean;
}

export const AppSurface: React.FC<Props> = ({ appId, title, domain, params, paramSeq, isStreamingDomain }) => {
  const surface = surfaceFor(appId, title, isStreamingDomain, domain);

  if (surface.mode === 'native' && surface.render) {
    const C = surface.render;
    // `intent` is spread so apps that don't care simply ignore it
    return <C intent={{ params, paramSeq }} params={params} paramSeq={paramSeq} />;
  }

  return (
    <DomainStream
      domain={surface.domain ? normalizeDomain(surface.domain) : (domain ? normalizeDomain(domain) : 'workstation-debian')}
      slot={surface.slot}
      title={title}
      dedicated={surface.dedicated}
    />
  );
};
