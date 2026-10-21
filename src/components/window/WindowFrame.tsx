import React, { useRef, useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Layers, ShieldCheck, Radio, AlertTriangle } from 'lucide-react';
import { WindowInstance } from '../../types/apps';
import { useWindow } from '../../context/WindowContext';
import { useSystem } from '../../context/SystemContext';
import { AppIcon } from '../common/AppIcon';
import { MULTI_OS_DOMAINS } from '../../services/multiOsHypervisor';

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
    updateWindowSize
  } = useWindow();

  const { actualDevice } = useSystem();
  const isDesktop = actualDevice === 'desktop';
  const isActive = activeWindowId === win.id;

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Resolve Qubes-style security domain configuration
  const domainConfig = MULTI_OS_DOMAINS.find((d) => d.id === win.osDomain) || MULTI_OS_DOMAINS[4];

  // Render the appropriate inner application component
  const renderAppContent = () => {
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
      case 'system_installer': return <SystemInstallerApp />;
      default:
        // Handle all sideloaded Android APKs inside Waydroid Container
        return <WaydroidAppRunner appId={win.appId} title={win.title} />;
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

  if (win.isMinimized) return null;

  // Mobile / Tablet Full-Screen Presentation
  if (!isDesktop || win.isMaximized) {
    return (
      <div 
        className="absolute inset-0 z-30 flex flex-col bg-neutral-900 animate-fade-in select-none"
        style={{ zIndex: win.zIndex }}
        onClick={() => focusWindow(win.id)}
      >
        {/* Top Header Controls */}
        {isDesktop && (
          <div className="h-10 bg-neutral-950/95 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2">
              <AppIcon appId={win.appId} size="sm" />
              <span className="text-xs font-semibold text-white">{win.title}</span>
              {/* Qubes Security Domain Badge */}
              <span 
                className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shadow-sm"
                style={{ backgroundColor: `${domainConfig.colorHex}25`, color: domainConfig.colorHex, border: `1px solid ${domainConfig.colorHex}50` }}
              >
                [{domainConfig.badgeLabel}]
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => minimizeWindow(win.id)}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"
                title="Minimize"
              >
                <Minus size={14} />
              </button>
              <button 
                onClick={() => maximizeWindow(win.id)}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"
                title="Restore Down"
              >
                <Copy size={12} />
              </button>
              <button 
                onClick={() => closeWindow(win.id)}
                className="p-1.5 hover:bg-red-600 rounded-lg text-neutral-400 hover:text-white"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
          {renderAppContent()}
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
        <div className="flex items-center gap-2 pointer-events-none">
          <AppIcon appId={win.appId} size="sm" />
          <span className="text-xs font-semibold text-neutral-200 truncate max-w-[160px]">
            {win.title}
          </span>
          {/* Security Domain Pill */}
          <span 
            className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold"
            style={{ backgroundColor: `${domainConfig.colorHex}25`, color: domainConfig.colorHex, border: `1px solid ${domainConfig.colorHex}60` }}
          >
            {domainConfig.badgeLabel.split(' ')[0]}
          </span>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1">
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
      <div className="flex-1 w-full h-full overflow-hidden flex flex-col bg-neutral-900">
        {renderAppContent()}
      </div>
    </div>
  );
};
