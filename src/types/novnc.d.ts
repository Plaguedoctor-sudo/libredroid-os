declare module '@novnc/novnc' {
  export interface RFBOptions {
    wsProtocols?: string[];
    shared?: boolean;
    credentials?: {
      password?: string;
      username?: string;
      target?: string;
    };
    repeaterID?: string;
  }

  export default class RFB extends EventTarget {
    constructor(target: HTMLElement, url: string, options?: RFBOptions);
    disconnect(): void;
    focus(): void;
    blur(): void;
    sendCredentials(credentials: { password?: string; username?: string }): void;
    sendKey(keysym: number, code: string, down?: boolean): void;
    sendCtrlAltDel(): void;
    machineShutdown(): void;
    machineReboot(): void;
    machineReset(): void;

    scaleViewport: boolean;
    resizeSession: boolean;
    clipViewport: boolean;
    dragViewport: boolean;
    touchButton: number;
    viewOnly: boolean;
    focusOnClick: boolean;
    qualityLevel: number;
    compressionLevel: number;
    showDotCursor: boolean;
    background: string;

    addEventListener(type: 'connect' | 'disconnect' | 'credentialsrequired' | 'securityfailure' | 'desktopname' | 'bell' | 'clipboard' | string, listener: (e: any) => void): void;
    removeEventListener(type: string, listener: (e: any) => void): void;
  }
}
