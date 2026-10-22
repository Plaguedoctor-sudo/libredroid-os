import React from 'react';
import { SystemProvider } from './context/SystemContext';
import { SecurityProvider } from './context/SecurityContext';
import { PersonaProvider } from './context/PersonaContext';
import { WindowProvider } from './context/WindowContext';
import { DeviceSwitcherBar } from './components/device/DeviceSwitcherBar';
import { DeviceFrame } from './components/device/DeviceFrame';
import { SecurityDialogOverlay } from './components/security/SecurityDialogOverlay';
import { UniversalAdaptationWizard } from './components/persona/UniversalAdaptationWizard';

export function App() {
  return (
    <SystemProvider>
      <SecurityProvider>
        <PersonaProvider>
          <WindowProvider>
            <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
              {/* Universal Device Mode Switcher Floating Bar */}
              <DeviceSwitcherBar />

              {/* Core Device Shell */}
              <DeviceFrame />

              {/* Global Security Permission & Cross-Domain Modals */}
              <SecurityDialogOverlay />

              {/* Universal Persona Adaptation Wizard */}
              <UniversalAdaptationWizard />
            </div>
          </WindowProvider>
        </PersonaProvider>
      </SecurityProvider>
    </SystemProvider>
  );
}

export default App;
