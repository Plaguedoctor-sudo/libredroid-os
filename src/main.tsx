import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { PlatformProvider } from './platform/react/PlatformProvider';
import { SetupHost } from './platform/react/SetupHost';
import { Kiosk, SafeArea, SystemGestureBar } from './platform/react/Chrome';
import { bindSystemActions } from './platform/input';

bindSystemActions((action) => {
  // route into the shell's existing handlers
  const sys = (window as any).__LRD_NAV__;
  switch (action) {
    case 'home': sys?.home?.(); break;
    case 'recents': sys?.recents?.(); break;
    case 'back': sys?.back?.(); break;
    case 'power-menu': sys?.powerMenu?.(); break;
    case 'lock': sys?.lock?.(); break;
    case 'terminal': sys?.launch?.('terminal'); break;
    case 'fullscreen':
      if (typeof document !== 'undefined') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        } else {
          document.documentElement.requestFullscreen?.();
        }
      }
      break;
    case 'screenshot': sys?.screenshot?.(); break;
    case 'restart-ui': location.reload(); break;
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlatformProvider>
      <SetupHost>
        <Kiosk>
          <SafeArea>
            <App />
            <SystemGestureBar
              onHome={() => (window as any).__LRD_NAV__?.home?.()}
              onRecents={() => (window as any).__LRD_NAV__?.recents?.()}
            />
          </SafeArea>
        </Kiosk>
      </SetupHost>
    </PlatformProvider>
  </React.StrictMode>
);
