import React from 'react';
import { SystemProvider } from './context/SystemContext';
import { SecurityProvider } from './context/SecurityContext';
import { WindowProvider } from './context/WindowContext';
import { DeviceSwitcherBar } from './components/device/DeviceSwitcherBar';
import { DeviceFrame } from './components/device/DeviceFrame';
import { SecurityDialogOverlay } from './components/security/SecurityDialogOverlay';

export function App() {
  return (
    <SystemProvider>
      <SecurityProvider>
        <WindowProvider>
          <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
            {/* Universal Device Mode Switcher Floating Bar */}
            <DeviceSwitcherBar />

            {/* Core Device Shell */}
            <DeviceFrame />

            {/* Global Security Permission & Cross-Domain Modals */}
            <SecurityDialogOverlay />
          </div>
        </WindowProvider>
      </SecurityProvider>
    </SystemProvider>
  );
}

export default App;
