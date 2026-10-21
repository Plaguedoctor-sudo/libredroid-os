import React from 'react';
import { SystemProvider } from './context/SystemContext';
import { WindowProvider } from './context/WindowContext';
import { DeviceSwitcherBar } from './components/device/DeviceSwitcherBar';
import { DeviceFrame } from './components/device/DeviceFrame';

export function App() {
  return (
    <SystemProvider>
      <WindowProvider>
        <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
          {/* Universal Device Mode Switcher Floating Bar */}
          <DeviceSwitcherBar />

          {/* Core Device Shell */}
          <DeviceFrame />
        </div>
      </WindowProvider>
    </SystemProvider>
  );
}

export default App;
