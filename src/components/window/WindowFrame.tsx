import React, { useRef, useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Layers, ShieldCheck, Radio, AlertTriangle, Tv } from 'lucide-react';
import { WindowInstance } from '../../types/apps';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { AppIcon } from '../common/AppIcon';
import { MULTI_OS_DOMAINS } from '../../services/multiOsHypervisor';
import { DomainStream } from '../common/DomainStream';

// Apps registry map
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
import { SystemInstallerApp } from '../apps/SystemInstallerApp';
import { WaydroidAppRunner } from '../apps/WaydroidAppRunner';
import { AppleDarwinBridgeApp } from '../apps/AppleDarwinBridgeApp';
import { AppleAppRunner } from '../apps/AppleAppRunner';
import { UniversalPersonaApp } from '../apps/UniversalPersonaApp';
import { PhoneApp } from '../apps/PhoneApp';
import { MessagesApp } from '../apps/MessagesApp';
import { UniversalAiApp } from '../apps/UniversalAiApp';
import { ChatsApp } from '../apps/ChatsApp';
import { getInstalledAppleApps } from '../../services/appleAppManager';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface WindowFrameProps {
  window: WindowInstance;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ window: win }) => {
  const { 
    closeWindow, 
    minimizeWindow, 
    maximizeWindow, 
    focusWindow, 
    activeWindowId,
    updateWindowPosition,
    updateWindowSize,
    updateWindowDomain,
    toggleWindowStream
  } = useWindow();

  const { actualDevice } = useSystem();
  const isDesktop = actualDevice === 'desktop';
  const isActive = activeWindowId === win.id;

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDomainSelectorOpen, setIsDomainSelectorOpen] = useState(false);

  // Resolve Qubes-style security domain configuration
  const domainConfig = MULTI_OS_DOMAINS.find((d) => d.id === win.osDomain) || MULTI_OS_DOMAINS[4];

  // Render the appropriate inner application component
  const renderAppContent = () => {
    // If domain streaming mode is active or app is a dedicated domain stream
    if (win.isStreamingDomain || win.appId.startsWith('domain_stream_')) {
      return (
        <DomainStream
          domainId={win.osDomain || 'workstation-debian'}
          onClose={() => toggleWindowStream(win.id)}
        />
      );
    }

    switch (win.appId) {
      case 'browser': return <BrowserApp />;
      case 'files': return <FilesApp />;
      case 'settings': return <SettingsApp />;
      case 'camera': return <CameraApp />;
      case 'terminal': return <TerminalApp />;
      case 'calculator': return <CalculatorApp />;
      case 'notes': return <NotesApp />;
      case 'store': return <FDroidApp />;
      case 'clock': return <ClockApp />;
      case 'photos': return <PhotosApp />;
      case 'hardware': return <HardwareManagerApp />;
      case 'guardian': return <AntiMonopolyGuardianApp />;
      case 'predatory_shield': return <AntiPredatoryShieldApp />;
      case 'security': return <SecurityGuardrailsApp />;
      case 'linux_sandbox': return <LinuxSandboxApp />;
      case 'hypervisor': return <MultiOsHypervisorApp />;
      case 'apk_installer': return <ApkInstallerApp />;
      case 'darwin_bridge': return <AppleDarwinBridgeApp />;
      case 'system_installer': return <SystemInstallerApp />;
      case 'persona_engine': return <UniversalPersonaApp />;
      case 'phone': return <PhoneApp />;
      case 'messages': return <MessagesApp />;
      case 'universal_ai': return <UniversalAiApp />;
      case 'chats': return <ChatsApp />;
      default: {
        // Check if the app is an Apple iOS/macOS bundle
        const isAppleApp = win.osDomain === 'darwin-apple' || 
          getInstalledAppleApps().some((a) => a.id === win.appId || a.bundleId === win.appId) ||
          win.appId.startsWith('com.apple.') ||
          win.appId.includes('.ios');

        if (isAppleApp) {
          return <AppleAppRunner appId={win.appId} title={win.title} />;
        }

        // Handle all sideloaded Android APKs inside Waydroid Container
        return <WaydroidAppRunner appId={win.appId} title={win.title} />;
      }
    }
  };

  // Dragging logic for Desktop mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDesktop || win.isMaximized) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - win.position.x,
      y: e.clientY - win.position.y,
    });
    focusWindow(win.id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragStart.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragStart.y));
      updateWindowPosition(win.id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, win.id, updateWindowPosition]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (!isDesktop || win.isMaximized) return;
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: win.size.width,
      height: win.size.height,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(340, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(260, resizeStart.height + (e.clientY - resizeStart.y));
      updateWindowSize(win.id, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, win.id, updateWindowSize]);

  if (win.isMinimized) return null;

  // Mobile / Tablet Full-Screen Presentation
  if (!isDesktop || win.isMaximized) {
    return (
      <div 
        className="absolute inset-0 z-30 flex flex-col bg-neutral-900 animate-fade-in select-none"
        style={{ zIndex: win.zIndex }}
        onClick={() => focusWindow(win.id)}
      >
        {/* Domain Accent Color Bar on Top */}
        <div className="h-0.5 w-full shrink-0" style={{ backgroundColor: domainConfig.colorHex }} />

        {/* Top Header Controls (Rendered on both Mobile & Desktop Maximized) */}
        <div className="h-10 bg-neutral-950/95 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-2">
            <AppIcon appId={win.appId} size="sm" />
            <span className="text-xs font-semibold text-white truncate max-w-[130px] sm:max-w-xs">{win.title}</span>
            {/* Qubes Security Domain Badge with Clickable Switcher */}
            <div className="relative">
              <button 
                onClick={() => setIsDomainSelectorOpen(!isDomainSelectorOpen)}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shadow-sm transition-transform hover:scale-105"
                style={{ backgroundColor: `${domainConfig.colorHex}25`, color: domainConfig.colorHex, border: `1px solid ${domainConfig.colorHex}50` }}
                title="Click to migrate app to another security domain"
              >
                [{domainConfig.badgeLabel.split(' ')[0]}]
              </button>

              {isDomainSelectorOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-52 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl py-1 z-50 animate-fade-in font-sans">
                  <div className="px-2.5 py-1 text-[9px] uppercase font-bold text-neutral-400">Migrate to OS Domain</div>
                  {MULTI_OS_DOMAINS.map((dom) => (
                    <button
                      key={dom.id}
                      onClick={() => {
                        updateWindowDomain(win.id, dom.id);
                        setIsDomainSelectorOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left transition-colors ${
                        win.osDomain === dom.id
                          ? 'bg-neutral-800 text-white font-semibold'
                          : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dom.colorHex }} />
                      <span className="truncate">{dom.badgeLabel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleWindowStream(win.id)}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                win.isStreamingDomain
                  ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/40'
                  : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title={
                win.isStreamingDomain
                  ? 'Surface Stream Active (Click to switch to React Native App)'
                  : 'Stream Domain Surface (wayvnc / labwc)'
              }
            >
              <Tv size={13} className={win.isStreamingDomain ? 'animate-pulse text-emerald-400' : ''} />
              {win.isStreamingDomain && (
                <span className="text-[10px] font-mono font-bold text-emerald-400">STREAM</span>
              )}
            </button>
            <button 
              onClick={() => minimizeWindow(win.id)}
              className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
              title="Minimize"
            >
              <Minus size={14} />
            </button>
            {isDesktop && (
              <button 
                onClick={() => maximizeWindow(win.id)}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                title="Restore Down"
              >
                <Copy size={12} />
              </button>
            )}
            <button 
              onClick={() => closeWindow(win.id)}
              className="p-1.5 hover:bg-red-600 rounded-lg text-neutral-400 hover:text-white transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
          <ErrorBoundary fallbackTitle={win.title} onReset={() => focusWindow(win.id)}>
            {renderAppContent()}
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  // Desktop Freeform Window Mode (Qubes Multi-OS Compartmentalized Border)
  return (
    <div
      onClick={() => focusWindow(win.id)}
      style={{
        zIndex: win.zIndex,
        left: `${win.position.x}px`,
        top: `${win.position.y}px`,
        width: `${win.size.width}px`,
        height: `${win.size.height}px`,
        borderColor: domainConfig.colorHex,
      }}
      className={`absolute flex flex-col rounded-2xl overflow-hidden shadow-2xl transition-shadow select-none border-2 ${
        isActive 
          ? 'shadow-2xl ring-1' 
          : 'shadow-black/70 opacity-95'
      }`}
    >
      {/* Draggable Titlebar with Qubes Domain Header */}
      <div
        onMouseDown={handleMouseDown}
        className="h-10 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 px-3 flex items-center justify-between cursor-move shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 pointer-events-none">
            <AppIcon appId={win.appId} size="sm" />
            <span className="text-xs font-semibold text-neutral-200 truncate max-w-[160px]">
              {win.title}
            </span>
          </div>
          {/* Security Domain Pill with Switcher */}
          <div className="relative">
            <button 
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setIsDomainSelectorOpen(!isDomainSelectorOpen)}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold transition-transform hover:scale-105"
              style={{ backgroundColor: `${domainConfig.colorHex}25`, color: domainConfig.colorHex, border: `1px solid ${domainConfig.colorHex}60` }}
              title="Click to migrate app to another security domain"
            >
              {domainConfig.badgeLabel.split(' ')[0]}
            </button>

            {isDomainSelectorOpen && (
              <div 
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute top-full left-0 mt-1.5 w-52 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl py-1 z-50 animate-fade-in font-sans"
              >
                <div className="px-2.5 py-1 text-[9px] uppercase font-bold text-neutral-400">Migrate to OS Domain</div>
                {MULTI_OS_DOMAINS.map((dom) => (
                  <button
                    key={dom.id}
                    onClick={() => {
                      updateWindowDomain(win.id, dom.id);
                      setIsDomainSelectorOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left transition-colors ${
                      win.osDomain === dom.id
                        ? 'bg-neutral-800 text-white font-semibold'
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dom.colorHex }} />
                    <span className="truncate">{dom.badgeLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWindowStream(win.id);
            }}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              win.isStreamingDomain
                ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/40'
                : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title={
              win.isStreamingDomain
                ? 'Surface Stream Active (Click to switch to React Native App)'
                : 'Stream Domain Surface (wayvnc / labwc)'
            }
          >
            <Tv size={12} className={win.isStreamingDomain ? 'animate-pulse text-emerald-400' : ''} />
            {win.isStreamingDomain && (
              <span className="text-[10px] font-mono font-bold text-emerald-400">STREAM</span>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(win.id);
            }}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
            title="Minimize"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              maximizeWindow(win.id);
            }}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
            title="Maximize"
          >
            <Square size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(win.id);
            }}
            className="p-1.5 hover:bg-red-600 rounded-lg text-neutral-400 hover:text-white transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* App Body */}
      <div className="flex-1 w-full h-full overflow-hidden flex flex-col bg-neutral-900 relative">
        <ErrorBoundary fallbackTitle={win.title} onReset={() => focusWindow(win.id)}>
          {renderAppContent()}
        </ErrorBoundary>

        {/* Freeform Window Corner Resize Handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0.5 right-0.5 w-4 h-4 cursor-se-resize flex items-center justify-center text-neutral-500 hover:text-white z-40 transition-colors"
          title="Drag to resize window"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <path d="M8 2L2 8M9 5L5 9M9 8L8 9" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};
